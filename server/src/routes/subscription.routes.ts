import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { AppError, NotFoundError } from '../utils/errors';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { qn } from '../utils/query';

const router = Router();

// ============================================================
// PATIENT: Get my subscriptions
// ============================================================
router.get('/me', authenticate, requireRole('PATIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new NotFoundError('Patient profile not found');

    const subscriptions = await prisma.patientSubscription.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true, slug: true } },
        orders: { select: { id: true, reference: true, status: true, createdAt: true }, take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    const formatted = subscriptions.map(s => ({
      id: s.id,
      serviceName: s.productName,
      pharmacyName: s.tenant.name,
      status: s.status,
      price: 0, // would come from linked service
      dose: s.dose,
      frequency: s.frequency,
      nextDeliveryDate: s.nextDeliveryDate?.toISOString(),
      rescreenDueDate: s.nextRescreenDate?.toISOString(),
      startedAt: s.createdAt.toISOString(),
      pausedAt: s.pausedAt?.toISOString(),
      recentOrders: s.orders,
    }));

    res.json({ success: true, data: { subscriptions: formatted } });
  } catch (err) { next(err); }
});

// ============================================================
// PATIENT: Pause subscription
// ============================================================
router.post('/:id/pause', authenticate, requireRole('PATIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new NotFoundError('Patient profile not found');

    const sub = await prisma.patientSubscription.findFirst({
      where: { id: req.params.id as string, patientId: patient.id, status: 'ACTIVE' },
    });
    if (!sub) throw new NotFoundError('Active subscription not found');

    const updated = await prisma.patientSubscription.update({
      where: { id: sub.id },
      data: { status: 'PAUSED', pausedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ============================================================
// PATIENT: Resume subscription
// ============================================================
router.post('/:id/resume', authenticate, requireRole('PATIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new NotFoundError('Patient profile not found');

    const sub = await prisma.patientSubscription.findFirst({
      where: { id: req.params.id as string, patientId: patient.id, status: 'PAUSED' },
    });
    if (!sub) throw new NotFoundError('Paused subscription not found');

    // Calculate next delivery date (next month from now)
    const nextDelivery = new Date();
    nextDelivery.setMonth(nextDelivery.getMonth() + (sub.frequency === 'QUARTERLY' ? 3 : 1));

    const updated = await prisma.patientSubscription.update({
      where: { id: sub.id },
      data: { status: 'ACTIVE', pausedAt: null, nextDeliveryDate: nextDelivery },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ============================================================
// PATIENT: Skip next delivery
// ============================================================
router.post('/:id/skip', authenticate, requireRole('PATIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new NotFoundError('Patient profile not found');

    const sub = await prisma.patientSubscription.findFirst({
      where: { id: req.params.id as string, patientId: patient.id, status: 'ACTIVE' },
    });
    if (!sub) throw new NotFoundError('Active subscription not found');

    // Push next delivery by one cycle
    const nextDelivery = sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate) : new Date();
    nextDelivery.setMonth(nextDelivery.getMonth() + (sub.frequency === 'QUARTERLY' ? 3 : 1));

    const updated = await prisma.patientSubscription.update({
      where: { id: sub.id },
      data: { nextDeliveryDate: nextDelivery },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ============================================================
// PATIENT: Cancel subscription
// ============================================================
router.post('/:id/cancel', authenticate, requireRole('PATIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new NotFoundError('Patient profile not found');

    const sub = await prisma.patientSubscription.findFirst({
      where: { id: req.params.id as string, patientId: patient.id, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (!sub) throw new NotFoundError('Subscription not found');

    const updated = await prisma.patientSubscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ============================================================
// ADMIN: List tenant subscriptions
// ============================================================
router.get('/', authenticate, requireRole('TENANT_OWNER', 'BRANCH_MANAGER', 'PHARMACIST', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = qn(req, 'page', 1);
    const limit = qn(req, 'limit', 20);
    const { skip, take } = paginate(page, limit);
    const tenantId = req.user!.tenantId;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const [subscriptions, total] = await Promise.all([
      prisma.patientSubscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          tenant: { select: { name: true } },
        },
      }),
      prisma.patientSubscription.count({ where }),
    ]);

    res.json({ success: true, data: subscriptions, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// ============================================================
// ADMIN: Create subscription for patient (after approved order)
// ============================================================
router.post('/', authenticate, requireRole('TENANT_OWNER', 'PHARMACIST', 'PRESCRIBER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, productName, dose, frequency, nextDeliveryDate } = req.body;
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const nextDelivery = nextDeliveryDate ? new Date(nextDeliveryDate) : new Date();
    if (!nextDeliveryDate) nextDelivery.setMonth(nextDelivery.getMonth() + (frequency === 'QUARTERLY' ? 3 : 1));

    const nextRescreen = new Date(nextDelivery);
    nextRescreen.setDate(nextRescreen.getDate() + 60); // 60-day safety window

    const subscription = await prisma.patientSubscription.create({
      data: {
        tenantId,
        patientId,
        productName,
        dose,
        frequency: frequency || 'MONTHLY',
        nextDeliveryDate: nextDelivery,
        nextRescreenDate: nextRescreen,
      },
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (err) { next(err); }
});

export default router;
