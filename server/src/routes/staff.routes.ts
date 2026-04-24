import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, requireTenantAccess, scopeToTenant, requireSuperAdmin } from '../middleware/auth';
import { inviteStaffSchema } from '../validators/auth.validators';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const router = Router();

// POST /api/staff/invite — Invite staff member to tenant
router.post('/invite', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = inviteStaffSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new ForbiddenError('No tenant association');

    const passwordHash = await bcrypt.hash('TempPassword1!', 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        tenantId,
        staffProfile: {
          create: {
            branchId: data.branchId,
            gphcNumber: data.gphcNumber,
            gmcNumber: data.gmcNumber,
            prescribingCategory: data.prescribingCategory,
          },
        },
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, staffProfile: true, createdAt: true,
      },
    });

    // TODO: Send invite email with temp password / magic link

    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

// GET /api/staff — List staff for tenant
router.get('/', authenticate, requireAdminRole, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = String(req.query.tenantId || '') || req.user!.tenantId;
    const page = parseInt(String(req.query.page || '')) || 1;
    const limit = parseInt(String(req.query.limit || '')) || 50;
    const role = String(req.query.role || '');
    const branchId = String(req.query.branchId || '');

    const where: any = {
      tenantId,
      role: { not: 'PATIENT' },
    };
    if (role) where.role = role;
    if (branchId) where.staffProfile = { branchId };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        ...paginate(page, limit),
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, lastLoginAt: true, createdAt: true,
          staffProfile: { include: { branch: { select: { id: true, name: true } } } },
        },
        orderBy: { firstName: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/staff/:id
router.get('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, isActive: true, mfaEnabled: true, lastLoginAt: true, createdAt: true,
        staffProfile: { include: { branch: true } },
      },
    });
    if (!user) throw new NotFoundError('Staff member');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /api/staff/:id — Update staff member
router.put('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, role, isActive, branchId, gphcNumber, gmcNumber, prescribingCategory } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(branchId !== undefined || gphcNumber !== undefined || gmcNumber !== undefined || prescribingCategory !== undefined
          ? {
            staffProfile: {
              upsert: {
                create: { branchId, gphcNumber, gmcNumber, prescribingCategory },
                update: {
                  ...(branchId !== undefined && { branchId }),
                  ...(gphcNumber !== undefined && { gphcNumber }),
                  ...(gmcNumber !== undefined && { gmcNumber }),
                  ...(prescribingCategory !== undefined && { prescribingCategory }),
                },
              },
            },
          }
          : {}),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, staffProfile: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// DELETE /api/staff/:id — Deactivate staff (soft delete)
router.delete('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (err) { next(err); }
});

// GET /api/staff/platform/users — Platform-level user management (Super-Admin)
router.get('/platform/users', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '')) || 1;
    const limit = parseInt(String(req.query.limit || '')) || 50;

    const where = { role: { in: ['SUPER_ADMIN' as const, 'SUPPORT_AGENT' as const] } };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        ...paginate(page, limit),
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

export default router;
