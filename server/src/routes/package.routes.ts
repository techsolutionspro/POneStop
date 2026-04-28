import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const packageSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  annualPrice: z.number().positive().optional(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  ctaText: z.string().default('Start Free Trial'),
  maxBranches: z.number().int().positive(),
  maxPgds: z.number().int().positive(),
  maxStaff: z.number().int().positive(),
  onlineOrdering: z.boolean().default(false),
  customDomain: z.boolean().default(false),
  customMailbox: z.boolean().default(false),
  videoConsults: z.boolean().default(false),
  marketingTools: z.boolean().default(false),
  groupManagement: z.boolean().default(false),
  apiAccess: z.boolean().default(false),
  dedicatedSupport: z.boolean().default(false),
  customWebsite: z.boolean().default(false),
  features: z.array(z.string()),
  consultationFee: z.number().min(0).default(0.50),
  dispatchFee: z.number().min(0).default(1.50),
  smsFee: z.number().min(0).default(0.05),
  paymentUplift: z.number().min(0).default(0.5),
});

// GET /api/packages — Public: list active packages for pricing page
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: packages });
  } catch (err) { next(err); }
});

// GET /api/packages/all — Super-admin: list all packages including inactive
router.get('/all', authenticate, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.package.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: packages });
  } catch (err) { next(err); }
});

// POST /api/packages — Super-admin: create package
router.post('/', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = packageSchema.parse(req.body);
    const pkg = await prisma.package.create({ data });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// PUT /api/packages/:id — Super-admin: update package
router.put('/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = packageSchema.partial().parse(req.body);
    const pkg = await prisma.package.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// DELETE /api/packages/:id — Super-admin: deactivate package
router.delete('/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await prisma.package.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

export default router;
