import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireSuperAdmin, requireAdminRole, scopeToTenant } from '../middleware/auth';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { qs, qn } from '../utils/query';

const router = Router();

// GET /api/audit — Audit log (Super-Admin: all, Tenant Admin: own tenant)
router.get('/', authenticate, requireAdminRole, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = qn(req, 'page', 1);
    const limit = qn(req, 'limit', 50);
    const tenantId = qs(req, 'tenantId') || req.user!.tenantId;
    const action = qs(req, 'action');
    const resource = qs(req, 'resource');
    const userId = qs(req, 'userId');

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        ...paginate(page, limit),
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          impersonatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/audit/stats — Audit statistics
router.get('/stats', authenticate, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, loginCount, refundCount, impersonationCount] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { action: 'LOGIN', createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { action: 'REFUND', createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { action: 'IMPERSONATE', createdAt: { gte: today } } }),
    ]);

    res.json({
      success: true,
      data: { totalToday, loginCount, refundCount, impersonationCount },
    });
  } catch (err) { next(err); }
});

export default router;
