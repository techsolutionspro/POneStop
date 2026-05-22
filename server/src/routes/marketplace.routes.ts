import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { GeocodingService } from '../services/geocoding.service';

const router = Router();

// GET /api/marketplace/search?postcode=&radius=&category=&service=
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postcode, radius = '10', category, service } = req.query;

    if (!postcode || typeof postcode !== 'string') {
      res.status(400).json({ success: false, error: 'Postcode is required' });
      return;
    }

    const coords = await GeocodingService.lookupPostcode(postcode);
    if (!coords) {
      res.status(400).json({ success: false, error: 'Invalid postcode' });
      return;
    }

    const maxRadius = Math.min(Number(radius) || 10, 50);

    // Get all active, marketplace-listed tenants with branches
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        isMarketplaceListed: true,
      },
      include: {
        branches: {
          where: { isActive: true },
          select: { id: true, name: true, address: true, city: true, postcode: true, latitude: true, longitude: true, openingHours: true },
        },
        services: {
          where: {
            isActive: true,
            ...(category ? { category: category as any } : {}),
            ...(service ? { name: { contains: service as string, mode: 'insensitive' as const } } : {}),
          },
          select: { id: true, name: true, category: true, price: true, heroImageUrl: true, fulfilmentModes: true },
        },
        _count: { select: { services: true, onlineOrders: true } },
      },
    });

    // Calculate distance and filter
    const results = tenants
      .map((tenant) => {
        // Use tenant lat/lng first, fall back to first branch
        const lat = tenant.latitude || tenant.branches[0]?.latitude;
        const lng = tenant.longitude || tenant.branches[0]?.longitude;

        if (!lat || !lng) return null;

        const distance = GeocodingService.calculateDistance(
          coords.latitude, coords.longitude, lat, lng
        );

        if (distance > maxRadius) return null;

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          rating: tenant.rating,
          reviewCount: tenant.reviewCount,
          deliveryFee: tenant.deliveryFee,
          minOrderAmount: tenant.minOrderAmount,
          deliveryRadius: tenant.deliveryRadius,
          distance,
          branches: tenant.branches,
          services: tenant.services,
          serviceCount: tenant._count.services,
          orderCount: tenant._count.onlineOrders,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance);

    res.json({
      success: true,
      data: results,
      meta: {
        searchPostcode: postcode,
        searchCoords: coords,
        radius: maxRadius,
        totalResults: results.length,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/marketplace/pharmacy/:slug — Public pharmacy detail
router.get('/pharmacy/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: String(req.params.slug) },
      include: {
        branches: {
          where: { isActive: true },
          select: { id: true, name: true, address: true, city: true, postcode: true, latitude: true, longitude: true, openingHours: true, phone: true },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true, name: true, description: true, category: true, price: true,
            heroImageUrl: true, duration: true, fulfilmentModes: true,
          },
          orderBy: { category: 'asc' },
        },
      },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      res.status(404).json({ success: false, error: 'Pharmacy not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        rating: tenant.rating,
        reviewCount: tenant.reviewCount,
        deliveryFee: tenant.deliveryFee,
        deliveryRadius: tenant.deliveryRadius,
        minOrderAmount: tenant.minOrderAmount,
        latitude: tenant.latitude,
        longitude: tenant.longitude,
        gphcNumber: tenant.gphcNumber,
        dspStatus: tenant.dspStatus,
        branches: tenant.branches,
        services: tenant.services,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/marketplace/featured — Promoted pharmacies (active ads)
router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postcode } = req.query;
    let coords: { latitude: number; longitude: number } | null = null;

    if (postcode && typeof postcode === 'string') {
      coords = await GeocodingService.lookupPostcode(postcode);
    }

    const ads = await prisma.ad.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        tenant: {
          select: {
            id: true, name: true, slug: true, logoUrl: true, primaryColor: true,
            rating: true, reviewCount: true, deliveryFee: true, minOrderAmount: true,
            latitude: true, longitude: true,
          },
        },
      },
      orderBy: { cpc: 'desc' },
      take: 10,
    });

    // Filter ads that still have budget and optionally match location
    const featured = ads
      .filter((ad) => ad.spent < ad.budget)
      .map((ad) => {
        let distance: number | undefined;
        if (coords && ad.tenant.latitude && ad.tenant.longitude) {
          distance = GeocodingService.calculateDistance(
            coords.latitude, coords.longitude,
            ad.tenant.latitude, ad.tenant.longitude
          );
        }
        return {
          adId: ad.id,
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          pharmacy: ad.tenant,
          distance,
          sponsored: true,
        };
      });

    // Record impressions
    if (featured.length > 0) {
      await prisma.ad.updateMany({
        where: { id: { in: featured.map(f => f.adId) } },
        data: { impressions: { increment: 1 } },
      });
    }

    res.json({ success: true, data: featured });
  } catch (err) { next(err); }
});

// GET /api/marketplace/categories — Service categories with counts
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.tenantService.groupBy({
      by: ['category'],
      where: {
        isActive: true,
        tenant: { status: 'ACTIVE', isMarketplaceListed: true },
      },
      _count: { category: true },
    });

    const categoryLabels: Record<string, string> = {
      BASIC_CONSULTATION: 'Consultations',
      OTC: 'Over the Counter',
      PHARMACY_MEDICINE: 'Pharmacy Medicines',
      POM_PRESCRIBING: 'Prescription Services',
    };

    res.json({
      success: true,
      data: categories.map((c) => ({
        id: c.category,
        name: categoryLabels[c.category] || c.category,
        count: c._count.category,
      })),
    });
  } catch (err) { next(err); }
});

export default router;
