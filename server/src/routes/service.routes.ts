import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, requireTenantAccess, scopeToTenant } from '../middleware/auth';
import { enforceServiceLimit } from '../middleware/tierEnforcement';
import { createServiceSchema, updateServiceSchema } from '../validators/service.validators';
import { NotFoundError } from '../utils/errors';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { qs } from '../utils/query';

const router = Router();

// ============================================================
// TENANT SERVICES
// ============================================================

// POST /api/services — Activate a service for the tenant
router.post('/', authenticate, requireAdminRole, scopeToTenant, enforceServiceLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createServiceSchema.parse(req.body);
    const tenantId = req.user!.tenantId!;

    const service = await prisma.tenantService.create({
      data: { ...data, tenantId },
      include: { pgd: { select: { id: true, title: true, therapyArea: true, version: true } } },
    });
    res.status(201).json({ success: true, data: service });
  } catch (err) { next(err); }
});

// GET /api/services — List tenant's services
router.get('/', authenticate, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = qs(req, 'tenantId') || req.user!.tenantId;
    const services = await prisma.tenantService.findMany({
      where: { tenantId: tenantId!, isActive: true },
      include: {
        pgd: { select: { id: true, title: true, therapyArea: true, version: true, status: true } },
        _count: { select: { bookings: true, onlineOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
});

// GET /api/services/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.tenantService.findUnique({
      where: { id: String(req.params.id) },
      include: {
        pgd: true,
        branchServices: { include: { branch: { select: { id: true, name: true } } } },
      },
    });
    if (!service) throw new NotFoundError('Service');
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
});

// PUT /api/services/:id
router.put('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateServiceSchema.parse(req.body);
    const service = await prisma.tenantService.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
});

// ============================================================
// PUBLIC STOREFRONT SERVICES (No auth — patient-facing)
// ============================================================

// GET /api/storefront/:slug/services
router.get('/storefront/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: String(req.params.slug) },
      select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true },
    });
    if (!tenant) throw new NotFoundError('Pharmacy');

    const services = await prisma.tenantService.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: {
        id: true, name: true, description: true, heroImageUrl: true,
        price: true, depositAmount: true, duration: true,
        category: true, fulfilmentModes: true, isDiscreet: true,
        requiresIdv: true, requiresQuestionnaire: true, requiresPrescriberReview: true,
        pgd: { select: { therapyArea: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { pharmacy: tenant, services } });
  } catch (err) { next(err); }
});

export default router;
