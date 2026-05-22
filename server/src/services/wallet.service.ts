import { prisma } from '../config/db';
import { logger } from './logger';

export class WalletService {
  // Get or create wallet for a tenant
  static async getOrCreateWallet(tenantId: string) {
    let wallet = await prisma.pharmacyWallet.findUnique({ where: { tenantId } });
    if (!wallet) {
      wallet = await prisma.pharmacyWallet.create({
        data: { tenantId },
      });
    }
    return wallet;
  }

  // Process commission when an order is completed/delivered
  static async processOrderCommission(orderId: string) {
    const order = await prisma.onlineOrder.findUnique({
      where: { id: orderId },
      include: { tenant: true },
    });
    if (!order) throw new Error('Order not found');

    // Check if commission already exists
    const existing = await prisma.commission.findUnique({ where: { orderId } });
    if (existing) {
      logger.warn(`[Wallet] Commission already exists for order ${orderId}`);
      return existing;
    }

    const commissionRate = order.tenant.commissionRate;
    const commissionAmount = Math.round(order.totalAmount * (commissionRate / 100) * 100) / 100;
    const pharmacyEarning = Math.round((order.totalAmount - commissionAmount) * 100) / 100;

    // Create commission record and update order + wallet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const commission = await tx.commission.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          orderAmount: order.totalAmount,
          commissionRate,
          commissionAmount,
        },
      });

      await tx.onlineOrder.update({
        where: { id: orderId },
        data: {
          commissionAmount,
          commissionRate,
          platformFee: commissionAmount,
        },
      });

      // Upsert wallet
      await tx.pharmacyWallet.upsert({
        where: { tenantId: order.tenantId },
        create: {
          tenantId: order.tenantId,
          totalEarnings: pharmacyEarning,
          totalCommission: commissionAmount,
          availableBalance: pharmacyEarning,
        },
        update: {
          totalEarnings: { increment: pharmacyEarning },
          totalCommission: { increment: commissionAmount },
          availableBalance: { increment: pharmacyEarning },
        },
      });

      return commission;
    });

    logger.info(`[Wallet] Commission processed for order ${orderId}: £${commissionAmount} (${commissionRate}%)`);
    return result;
  }

  // Request a payout
  static async requestPayout(tenantId: string, amount: number, bankDetails: {
    bankName?: string;
    accountNumber?: string;
    sortCode?: string;
  }) {
    const wallet = await this.getOrCreateWallet(tenantId);

    if (amount <= 0) throw new Error('Payout amount must be positive');
    if (amount > wallet.availableBalance) throw new Error('Insufficient balance');

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          tenantId,
          amount,
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          sortCode: bankDetails.sortCode,
        },
      });

      await tx.pharmacyWallet.update({
        where: { tenantId },
        data: {
          availableBalance: { decrement: amount },
          pendingPayouts: { increment: amount },
        },
      });

      return payout;
    });

    logger.info(`[Wallet] Payout requested for tenant ${tenantId}: £${amount}`);
    return result;
  }

  // Approve a payout (super-admin)
  static async approvePayout(payoutId: string, approvedById: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new Error('Payout not found');
    if (payout.status !== 'PENDING') throw new Error('Payout is not pending');

    return prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById,
      },
    });
  }

  // Reject a payout (super-admin)
  static async rejectPayout(payoutId: string, approvedById: string, notes?: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new Error('Payout not found');
    if (payout.status !== 'PENDING') throw new Error('Payout is not pending');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'REJECTED',
          approvedById,
          notes,
        },
      });

      // Return funds to available balance
      await tx.pharmacyWallet.update({
        where: { tenantId: payout.tenantId },
        data: {
          availableBalance: { increment: payout.amount },
          pendingPayouts: { decrement: payout.amount },
        },
      });

      return updated;
    });
  }

  // Mark payout as paid (super-admin)
  static async markPaid(payoutId: string, payment: {
    paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';
    reference?: string;
  }) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new Error('Payout not found');
    if (payout.status !== 'APPROVED') throw new Error('Payout must be approved first');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: payment.paymentMethod,
          reference: payment.reference,
        },
      });

      await tx.pharmacyWallet.update({
        where: { tenantId: payout.tenantId },
        data: {
          totalPayouts: { increment: payout.amount },
          pendingPayouts: { decrement: payout.amount },
        },
      });

      return updated;
    });
  }

  // Get earnings summary for a tenant
  static async getEarningsSummary(tenantId: string) {
    const wallet = await this.getOrCreateWallet(tenantId);
    const pendingCommissions = await prisma.commission.aggregate({
      where: { tenantId, status: 'PENDING' },
      _sum: { commissionAmount: true },
      _count: true,
    });

    return {
      totalEarnings: wallet.totalEarnings,
      totalCommission: wallet.totalCommission,
      totalPayouts: wallet.totalPayouts,
      availableBalance: wallet.availableBalance,
      pendingPayouts: wallet.pendingPayouts,
      pendingCommissionCount: pendingCommissions._count,
      pendingCommissionAmount: pendingCommissions._sum.commissionAmount || 0,
    };
  }
}
