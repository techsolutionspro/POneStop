import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, requireSuperAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const adSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  budget: z.number().positive(),
  cpc: z.number().positive().default(0.50),
  targetPostcode: z.string().optional(),
  targetRadius: z.number().positive().optional(),
  targetCategories: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// POST /api/ads — Create ad campaign
router.post('/', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ success: false, error: 'No tenant' }); return; }

    const data = adSchema.parse(req.body);
    const ad = await prisma.ad.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        budget: data.budget,
        cpc: data.cpc,
        targetPostcode: data.targetPostcode,
        targetRadius: data.targetRadius,
        targetCategories: data.targetCategories || [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    res.status(201).json({ success: true, data: ad });
  } catch (err) { next(err); }
});

// GET /api/ads — List ads (pharmacy: own, super-admin: all)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'SUPPORT_AGENT') {
      where.tenantId = req.user!.tenantId;
    }
    if (status) where.status = status;

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ad.count({ where }),
    ]);

    res.json({
      success: true,
      data: ads,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

// PUT /api/ads/:id — Update ad
router.put('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adId = String(req.params.id);
    const tenantId = req.user!.tenantId;

    // Verify ownership (unless super-admin)
    if (req.user!.role !== 'SUPER_ADMIN') {
      const existing = await prisma.ad.findUnique({ where: { id: adId } });
      if (!existing || existing.tenantId !== tenantId) {
        res.status(404).json({ success: false, error: 'Ad not found' });
        return;
      }
    }

    const data = adSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    // Allow status changes
    if (req.body.status) updateData.status = req.body.status;

    const ad = await prisma.ad.update({ where: { id: adId }, data: updateData });
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
});

// POST /api/ads/:id/click — Record click (public)
router.post('/:id/click', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adId = String(req.params.id);
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad || ad.status !== 'ACTIVE') {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    // Deduct CPC from budget
    const newSpent = ad.spent + ad.cpc;
    const updateData: any = {
      clicks: { increment: 1 },
      spent: newSpent,
    };

    // Auto-pause if budget exhausted
    if (newSpent >= ad.budget) {
      updateData.status = 'COMPLETED';
    }

    await prisma.ad.update({ where: { id: adId }, data: updateData });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/ads/stats — Ad performance stats
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'SUPPORT_AGENT') {
      where.tenantId = req.user!.tenantId;
    }

    const [totals, active, draft] = await Promise.all([
      prisma.ad.aggregate({
        where,
        _sum: { budget: true, spent: true, impressions: true, clicks: true, conversions: true },
        _count: true,
      }),
      prisma.ad.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.ad.count({ where: { ...where, status: 'DRAFT' } }),
    ]);

    const totalClicks = totals._sum.clicks || 0;
    const totalImpressions = totals._sum.impressions || 0;

    res.json({
      success: true,
      data: {
        totalCampaigns: totals._count,
        activeCampaigns: active,
        draftCampaigns: draft,
        totalBudget: totals._sum.budget || 0,
        totalSpent: totals._sum.spent || 0,
        totalImpressions: totalImpressions,
        totalClicks: totalClicks,
        totalConversions: totals._sum.conversions || 0,
        avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      },
    });
  } catch (err) { next(err); }
});

export default router;
