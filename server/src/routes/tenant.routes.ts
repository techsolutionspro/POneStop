import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireSuperAdmin, requireAdminRole, requireTenantAccess, scopeToTenant } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { generateSlug, paginate, buildPaginationMeta } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';
import { qs, qn } from '../utils/query';
import {
  createTenantSchema, updateTenantSchema, updateTenantStatusSchema,
  updateTenantTierSchema, updateDspSchema, createBranchSchema, updateBranchSchema,
} from '../validators/tenant.validators';

const router = Router();

// ============================================================
// TENANT CRUD (Super-Admin)
// ============================================================

// POST /api/tenants — Create tenant with owner
router.post('/', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTenantSchema.parse(req.body);
    const slug = data.slug || generateSlug(data.name);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug,
          tier: data.tier,
          companyNumber: data.companyNumber,
          vatNumber: data.vatNumber,
          gphcNumber: data.gphcNumber,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          subdomain: slug,
        },
      });

      // Create owner user
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(data.ownerPassword, 12);
      const owner = await tx.user.create({
        data: {
          email: data.ownerEmail,
          passwordHash,
          firstName: data.ownerFirstName,
          lastName: data.ownerLastName,
          phone: data.ownerPhone,
          role: 'TENANT_OWNER',
          tenantId: tenant.id,
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      return { tenant, owner };
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/tenants — List all tenants (Super-Admin, Support)
router.get('/', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = qn(req, 'page', 1);
    const limit = qn(req, 'limit', 20);
    const status = qs(req, 'status');
    const tier = qs(req, 'tier');
    const search = qs(req, 'search');

    const where: any = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        ...paginate(page, limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, branches: true, bookings: true, onlineOrders: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({ success: true, data: tenants, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/tenants/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: String(req.params.id) },
      include: {
        branches: true,
        _count: { select: { users: true, bookings: true, onlineOrders: true, services: true } },
      },
    });
    if (!tenant) throw new NotFoundError('Tenant');
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// PUT /api/tenants/:id
router.put('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateTenantSchema.parse(req.body);
    const tenant = await prisma.tenant.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// PUT /api/tenants/:id/status (Super-Admin)
router.put('/:id/status', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = updateTenantStatusSchema.parse(req.body);
    const tenant = await prisma.tenant.update({
      where: { id: String(req.params.id) },
      data: { status, goLiveAt: status === 'ACTIVE' ? new Date() : undefined },
    });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// PUT /api/tenants/:id/tier (Super-Admin)
router.put('/:id/tier', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier } = updateTenantTierSchema.parse(req.body);
    const tenant = await prisma.tenant.update({
      where: { id: String(req.params.id) },
      data: { tier },
    });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// PUT /api/tenants/:id/dsp (Super-Admin)
router.put('/:id/dsp', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateDspSchema.parse(req.body);
    const tenant = await prisma.tenant.update({
      where: { id: String(req.params.id) },
      data: {
        ...data,
        dspVerifiedAt: data.dspStatus === 'VERIFIED' ? new Date() : undefined,
        dspNextReviewDate: data.dspNextReviewDate ? new Date(data.dspNextReviewDate) : undefined,
      },
    });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// ============================================================
// BRANCHES
// ============================================================

// POST /api/tenants/:tenantId/branches
router.post('/:tenantId/branches', authenticate, requireAdminRole, requireTenantAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBranchSchema.parse(req.body);
    const branch = await prisma.branch.create({
      data: { ...data, tenantId: String(req.params.tenantId) },
    });
    res.status(201).json({ success: true, data: branch });
  } catch (err) { next(err); }
});

// GET /api/tenants/:tenantId/branches
router.get('/:tenantId/branches', authenticate, requireTenantAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { tenantId: String(req.params.tenantId) },
      include: { _count: { select: { staff: true, bookings: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: branches });
  } catch (err) { next(err); }
});

// PUT /api/tenants/:tenantId/branches/:branchId
router.put('/:tenantId/branches/:branchId', authenticate, requireAdminRole, requireTenantAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateBranchSchema.parse(req.body);
    const branch = await prisma.branch.update({
      where: { id: String(req.params.branchId) },
      data,
    });
    res.json({ success: true, data: branch });
  } catch (err) { next(err); }
});

export default router;
