import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, scopeToTenant } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { paginate, buildPaginationMeta } from '../utils/helpers';

const router = Router();

// GET /api/patients — List patients for a tenant
router.get('/', authenticate, requireAdminRole, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = String(req.query.tenantId || '') || req.user!.tenantId;
    const page = parseInt(String(req.query.page || '')) || 1;
    const limit = parseInt(String(req.query.limit || '')) || 20;
    const search = String(req.query.search || '');

    const where: any = { tenantId };
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patientProfile.findMany({
        where,
        ...paginate(page, limit),
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
          _count: { select: { bookings: true, onlineOrders: true, subscriptions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patientProfile.count({ where }),
    ]);

    res.json({ success: true, data: patients, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        bookings: {
          take: 10, orderBy: { createdAt: 'desc' },
          include: { service: { select: { name: true } }, branch: { select: { name: true } } },
        },
        onlineOrders: {
          take: 10, orderBy: { createdAt: 'desc' },
          include: { service: { select: { name: true } } },
        },
        subscriptions: true,
        consultations: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!patient) throw new NotFoundError('Patient');
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// PUT /api/patients/:id — Update patient profile
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateOfBirth, gender, address, city, postcode, nhsNumber, gpPractice, gpSharingConsent, marketingConsent } = req.body;
    const patient = await prisma.patientProfile.update({
      where: { id: req.params.id },
      data: {
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postcode !== undefined && { postcode }),
        ...(nhsNumber !== undefined && { nhsNumber }),
        ...(gpPractice !== undefined && { gpPractice }),
        ...(gpSharingConsent !== undefined && { gpSharingConsent }),
        ...(marketingConsent !== undefined && { marketingConsent }),
      },
    });
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// POST /api/patients/:id/idv — Record IDV result
router.post('/:id/idv', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, provider, documentType } = req.body;
    const patient = await prisma.patientProfile.update({
      where: { id: req.params.id },
      data: {
        idvStatus: status,
        idvProvider: provider,
        idvDocumentType: documentType,
        idvCompletedAt: new Date(),
        idvExpiresAt: new Date(Date.now() + 365 * 86400000), // 12 months
      },
    });
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// GET /api/patients/me/profile — Patient views own profile
router.get('/me/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        subscriptions: { where: { status: 'ACTIVE' } },
      },
    });
    if (!patient) throw new NotFoundError('Patient profile');
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

export default router;
