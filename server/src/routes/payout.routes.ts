import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole, requireSuperAdmin, scopeToTenant } from '../middleware/auth';
import { WalletService } from '../services/wallet.service';
import { z } from 'zod';

const router = Router();

const requestPayoutSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  sortCode: z.string().optional(),
});

// POST /api/payouts/request — Pharmacy requests payout
router.post('/request', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ success: false, error: 'No tenant' }); return; }

    const data = requestPayoutSchema.parse(req.body);
    const payout = await WalletService.requestPayout(tenantId, data.amount, {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      sortCode: data.sortCode,
    });

    res.status(201).json({ success: true, data: payout });
  } catch (err) { next(err); }
});

// GET /api/payouts — List payouts (pharmacy: own, super-admin: all)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'SUPPORT_AGENT') {
      where.tenantId = req.user!.tenantId;
    }
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          approvedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payout.count({ where }),
    ]);

    res.json({
      success: true,
      data: payouts,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

// GET /api/payouts/stats — Dashboard stats
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'SUPPORT_AGENT') {
      where.tenantId = req.user!.tenantId;
    }

    const [pending, approved, paid, totalPaid] = await Promise.all([
      prisma.payout.count({ where: { ...where, status: 'PENDING' } }),
      prisma.payout.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.payout.count({ where: { ...where, status: 'PAID' } }),
      prisma.payout.aggregate({ where: { ...where, status: 'PAID' }, _sum: { amount: true } }),
    ]);

    res.json({
      success: true,
      data: {
        pending,
        approved,
        paid,
        totalPaidAmount: totalPaid._sum.amount || 0,
      },
    });
  } catch (err) { next(err); }
});

// PUT /api/payouts/:id/approve — Super-admin approves
router.put('/:id/approve', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payout = await WalletService.approvePayout(String(req.params.id), req.user!.userId);
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
});

// PUT /api/payouts/:id/reject — Super-admin rejects
router.put('/:id/reject', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const payout = await WalletService.rejectPayout(String(req.params.id), req.user!.userId, notes);
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
});

// PUT /api/payouts/:id/mark-paid — Record payment
router.put('/:id/mark-paid', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentMethod, reference } = req.body;
    const payout = await WalletService.markPaid(String(req.params.id), { paymentMethod, reference });
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
});

export default router;
