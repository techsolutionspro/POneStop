import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, requireClinicalRole, scopeToTenant } from '../middleware/auth';
import { createBookingSchema, updateBookingStatusSchema } from '../validators/service.validators';
import { generateReference, paginate, buildPaginationMeta } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';

const router = Router();

// POST /api/bookings — Create a booking
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const tenantId = req.user!.tenantId!;

    // If patient self-booking, get or create patient profile
    let patientId = data.patientId;
    if (!patientId && req.user!.role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
      patientId = profile?.id;
    }

    if (!patientId) {
      // Create patient from booking data for guest checkout
      const patient = await prisma.patientProfile.create({
        data: {
          userId: req.user!.userId,
          tenantId,
          dateOfBirth: data.patientDob ? new Date(data.patientDob) : undefined,
        },
      });
      patientId = patient.id;
    }

    const booking = await prisma.booking.create({
      data: {
        reference: generateReference('BK'),
        tenantId,
        branchId: data.branchId,
        serviceId: data.serviceId,
        patientId,
        createdById: req.user!.userId,
        status: 'CONFIRMED',
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        source: data.source,
        questionnaireAnswers: data.questionnaireAnswers,
        consentGiven: data.consentGiven,
        consentAt: data.consentGiven ? new Date() : undefined,
        notes: data.notes,
      },
      include: {
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });

    // TODO: Send confirmation SMS + email

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// GET /api/bookings — List bookings
router.get('/', authenticate, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = String(req.query.tenantId || '') || req.user!.tenantId;
    const page = parseInt(String(req.query.page || '')) || 1;
    const limit = parseInt(String(req.query.limit || '')) || 20;
    const status = String(req.query.status || '');
    const branchId = String(req.query.branchId || '');
    const date = String(req.query.date || '');
    const patientId = String(req.query.patientId || '');

    const where: any = { tenantId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (patientId) where.patientId = patientId;
    if (date) {
      const d = new Date(date);
      where.date = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }

    // If patient, only show their bookings
    if (req.user!.role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
      if (profile) where.patientId = profile.id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        ...paginate(page, limit),
        include: {
          branch: { select: { id: true, name: true } },
          service: { select: { id: true, name: true, price: true } },
          patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ success: true, data: bookings, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/bookings/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        branch: true,
        service: { include: { pgd: { select: { id: true, title: true, version: true } } } },
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
        consultation: true,
      },
    });
    if (!booking) throw new NotFoundError('Booking');
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, cancellationReason } = updateBookingStatusSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status, cancellationReason },
    });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// GET /api/bookings/today — Today's bookings for clinician dashboard
router.get('/today/list', authenticate, requireClinicalRole, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = String(req.query.tenantId || '') || req.user!.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const bookings = await prisma.booking.findMany({
      where: { tenantId: tenantId!, date: { gte: today, lt: tomorrow } },
      include: {
        branch: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
});

export default router;
