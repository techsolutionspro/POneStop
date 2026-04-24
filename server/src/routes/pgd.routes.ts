import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireSuperAdmin, requireClinicalRole } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { z } from 'zod';

const router = Router();

const createPgdSchema = z.object({
  title: z.string().min(1),
  version: z.string().min(1),
  therapyArea: z.string().min(1),
  indication: z.string().min(1),
  inclusionCriteria: z.any(),
  exclusionCriteria: z.any(),
  redFlags: z.any(),
  authorisedProducts: z.any(),
  doseRegimen: z.any(),
  counsellingPoints: z.any().optional(),
  competenciesRequired: z.any().optional(),
  fulfilmentModes: z.array(z.enum(['IN_BRANCH', 'ONLINE_DELIVERY', 'CLICK_AND_COLLECT'])),
  reviewDate: z.string().datetime().optional(),
});

// POST /api/pgds — Create PGD (Super-Admin / Clinical Governance)
router.post('/', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPgdSchema.parse(req.body);
    const pgd = await prisma.pgd.create({
      data: {
        ...data,
        authorId: req.user!.userId,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      },
    });
    res.status(201).json({ success: true, data: pgd });
  } catch (err) { next(err); }
});

// GET /api/pgds — List PGDs
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const therapyArea = req.query.therapyArea as string;

    const where: any = {};
    if (status) where.status = status;
    if (therapyArea) where.therapyArea = therapyArea;

    // Non-platform users only see published PGDs
    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user!.role)) {
      where.status = 'PUBLISHED';
    }

    const [pgds, total] = await Promise.all([
      prisma.pgd.findMany({
        where,
        ...paginate(page, limit),
        select: {
          id: true, title: true, version: true, status: true, therapyArea: true,
          indication: true, fulfilmentModes: true, reviewDate: true,
          publishedAt: true, createdAt: true,
        },
        orderBy: { title: 'asc' },
      }),
      prisma.pgd.count({ where }),
    ]);

    res.json({ success: true, data: pgds, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/pgds/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pgd = await prisma.pgd.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { services: true, consultations: true } } },
    });
    if (!pgd) throw new NotFoundError('PGD');
    res.json({ success: true, data: pgd });
  } catch (err) { next(err); }
});

// PUT /api/pgds/:id
router.put('/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const pgd = await prisma.pgd.update({
      where: { id: req.params.id },
      data: {
        ...data,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      },
    });
    res.json({ success: true, data: pgd });
  } catch (err) { next(err); }
});

// POST /api/pgds/:id/publish
router.post('/:id/publish', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pgd = await prisma.pgd.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        clinicalLeadId: req.user!.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'APPROVE',
        resource: 'pgd',
        resourceId: pgd.id,
        details: { title: pgd.title, version: pgd.version },
      },
    });

    res.json({ success: true, data: pgd });
  } catch (err) { next(err); }
});

// GET /api/pgds/therapy-areas — List unique therapy areas
router.get('/meta/therapy-areas', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await prisma.pgd.findMany({
      where: { status: 'PUBLISHED' },
      select: { therapyArea: true },
      distinct: ['therapyArea'],
      orderBy: { therapyArea: 'asc' },
    });
    res.json({ success: true, data: areas.map(a => a.therapyArea) });
  } catch (err) { next(err); }
});

export default router;
