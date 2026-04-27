import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, requireSuperAdmin, scopeToTenant } from '../middleware/auth';
import { qs } from '../utils/query';

const router = Router();

// GET /api/dashboard/tenant — Tenant admin dashboard stats
router.get('/tenant', authenticate, requireAdminRole, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = qs(req, 'tenantId') || req.user!.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const [
      todayBookings, todayOrders, weekRevenue, awaitingReview,
      totalPatients, activeServices, recentBookings, recentOrders,
    ] = await Promise.all([
      prisma.booking.count({ where: { tenantId: tenantId!, date: { gte: today, lt: tomorrow } } }),
      prisma.onlineOrder.count({ where: { tenantId: tenantId!, createdAt: { gte: today } } }),
      prisma.onlineOrder.aggregate({
        where: { tenantId: tenantId!, paymentStatus: 'CAPTURED', createdAt: { gte: weekAgo } },
        _sum: { totalAmount: true },
      }),
      prisma.onlineOrder.count({ where: { tenantId: tenantId!, status: { in: ['AWAITING_REVIEW', 'QUERIED'] } } }),
      prisma.patientProfile.count({ where: { tenantId: tenantId! } }),
      prisma.tenantService.count({ where: { tenantId: tenantId!, isActive: true } }),
      prisma.booking.findMany({
        where: { tenantId: tenantId!, date: { gte: today, lt: tomorrow } },
        take: 10,
        include: {
          service: { select: { name: true } },
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          branch: { select: { name: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.onlineOrder.findMany({
        where: { tenantId: tenantId! },
        take: 10,
        include: {
          service: { select: { name: true } },
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          todayBookings,
          todayOrders,
          weekRevenue: weekRevenue._sum.totalAmount || 0,
          awaitingReview,
          totalPatients,
          activeServices,
        },
        recentBookings,
        recentOrders,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/platform — Super-admin platform dashboard
router.get('/platform', authenticate, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const [
      totalTenants, activeTenants, totalOrders, todayOrders,
      monthRevenue, avgPrescriberSla, dspVerified, dspPending,
      publishedPgds, recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.onlineOrder.count(),
      prisma.onlineOrder.count({ where: { createdAt: { gte: today } } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', createdAt: { gte: monthAgo } },
        _sum: { totalAmount: true },
      }),
      // Avg SLA placeholder
      Promise.resolve(2.1),
      prisma.tenant.count({ where: { dspStatus: 'VERIFIED' } }),
      prisma.tenant.count({ where: { dspStatus: 'PENDING_VERIFICATION' } }),
      prisma.pgd.count({ where: { status: 'PUBLISHED' } }),
      prisma.tenant.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, branches: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalTenants, activeTenants, totalOrders, todayOrders,
          monthRevenue: monthRevenue._sum.totalAmount || 0,
          avgPrescriberSla,
          dspVerified, dspPending, publishedPgds,
        },
        recentTenants,
      },
    });
  } catch (err) { next(err); }
});

export default router;
