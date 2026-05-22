import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireAdminRole } from '../middleware/auth';
import { WalletService } from '../services/wallet.service';

const router = Router();

// GET /api/earnings — Pharmacy earnings summary
router.get('/', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ success: false, error: 'No tenant' }); return; }

    const summary = await WalletService.getEarningsSummary(tenantId);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// GET /api/earnings/history — Transaction history
router.get('/history', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ success: false, error: 'No tenant' }); return; }

    const { page = '1', limit = '20', type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build a unified transaction history from orders, commissions, and payouts
    const transactions: any[] = [];

    if (!type || type === 'order') {
      const orders = await prisma.onlineOrder.findMany({
        where: { tenantId, status: { in: ['DELIVERED', 'DISPATCHED', 'APPROVED'] } },
        select: {
          id: true, reference: true, totalAmount: true, commissionAmount: true,
          status: true, createdAt: true, productName: true,
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const order of orders) {
        transactions.push({
          id: order.id,
          type: 'ORDER',
          reference: order.reference,
          amount: order.totalAmount - (order.commissionAmount || 0),
          grossAmount: order.totalAmount,
          commission: order.commissionAmount || 0,
          description: `Order ${order.reference} — ${order.productName}`,
          patient: order.patient ? `${order.patient.user.firstName} ${order.patient.user.lastName}` : null,
          status: order.status,
          date: order.createdAt,
        });
      }
    }

    if (!type || type === 'payout') {
      const payouts = await prisma.payout.findMany({
        where: { tenantId },
        select: { id: true, amount: true, status: true, paymentMethod: true, reference: true, createdAt: true, paidAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const payout of payouts) {
        transactions.push({
          id: payout.id,
          type: 'PAYOUT',
          reference: payout.reference,
          amount: -payout.amount,
          description: `Payout — ${payout.paymentMethod || 'Pending'}`,
          status: payout.status,
          date: payout.paidAt || payout.createdAt,
        });
      }
    }

    // Sort by date descending and paginate
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const paginated = transactions.slice(skip, skip + take);

    res.json({
      success: true,
      data: paginated,
      meta: { total: transactions.length, page: Number(page), limit: take },
    });
  } catch (err) { next(err); }
});

export default router;
