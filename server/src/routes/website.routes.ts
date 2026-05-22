import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdminRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { AppError, NotFoundError } from '../utils/errors';

const router = Router();

// ============================================================
// Get website config for current tenant
// ============================================================
router.get('/', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const config = await prisma.websiteConfig.findUnique({ where: { tenantId } });

    res.json({
      success: true,
      data: config || { blocks: [], settings: {}, isPublished: false },
    });
  } catch (err) { next(err); }
});

// ============================================================
// Save website config (create or update)
// ============================================================
router.put('/', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const { blocks, settings } = req.body;
    if (!blocks || !Array.isArray(blocks)) throw new AppError('blocks must be an array', 400);

    const config = await prisma.websiteConfig.upsert({
      where: { tenantId },
      create: { tenantId, blocks, settings: settings || {} },
      update: { blocks, settings: settings || {}, updatedAt: new Date() },
    });

    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

// ============================================================
// Publish website
// ============================================================
router.post('/publish', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const config = await prisma.websiteConfig.findUnique({ where: { tenantId } });
    if (!config) throw new NotFoundError('No website config found. Save your design first.');

    const updated = await prisma.websiteConfig.update({
      where: { tenantId },
      data: { isPublished: true, publishedAt: new Date() },
    });

    res.json({ success: true, data: updated, message: 'Website published successfully' });
  } catch (err) { next(err); }
});

// ============================================================
// Unpublish website
// ============================================================
router.post('/unpublish', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const updated = await prisma.websiteConfig.update({
      where: { tenantId },
      data: { isPublished: false },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ============================================================
// PUBLIC: Get published website for a pharmacy slug
// ============================================================
router.get('/public/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        websiteConfig: true,
        branches: { where: { isActive: true }, take: 1 },
      },
    });

    if (!tenant || !tenant.websiteConfig?.isPublished) {
      throw new NotFoundError('Published website not found');
    }

    const branch = tenant.branches[0] || null;
    res.json({
      success: true,
      data: {
        pharmacy: {
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          gphcNumber: tenant.gphcNumber,
          customDomain: tenant.customDomain,
          branch: branch ? { address: branch.address, city: branch.city, postcode: branch.postcode, phone: branch.phone, email: branch.email, openingHours: branch.openingHours } : null,
        },
        blocks: tenant.websiteConfig.blocks,
        settings: tenant.websiteConfig.settings,
      },
    });
  } catch (err) { next(err); }
});

export default router;
