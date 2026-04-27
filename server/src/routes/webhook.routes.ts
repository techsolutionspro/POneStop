import { Router, Request, Response } from 'express';
import express from 'express';
import { prisma } from '../config/db';
import { env } from '../config/env';

const router = Router();

// Stripe needs raw body for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  try {
    let event: any;

    if (env.STRIPE_SECRET_KEY) {
      const Stripe = require('stripe');
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(req.body.toString());
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          await prisma.onlineOrder.update({
            where: { id: orderId },
            data: { paymentStatus: 'CAPTURED', stripePaymentId: pi.id },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          await prisma.onlineOrder.update({
            where: { id: orderId },
            data: { paymentStatus: 'FAILED' },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const orderId = charge.metadata?.orderId;
        if (orderId) {
          await prisma.onlineOrder.update({
            where: { id: orderId },
            data: { paymentStatus: 'REFUNDED', stripeRefundId: charge.refunds?.data?.[0]?.id },
          });
        }
        break;
      }

      case 'invoice.paid': {
        // Tenant subscription payment
        const invoice = event.data.object;
        const tenantId = invoice.metadata?.tenantId;
        if (tenantId) {
          await prisma.invoice.create({
            data: {
              tenantId,
              reference: `INV-${invoice.number || Date.now()}`,
              amount: invoice.amount_paid / 100,
              vatAmount: (invoice.tax || 0) / 100,
              totalAmount: invoice.amount_paid / 100,
              status: 'PAID',
              dueDate: new Date(invoice.due_date * 1000),
              paidAt: new Date(),
              stripeInvoiceId: invoice.id,
              lineItems: invoice.lines?.data?.map((l: any) => ({
                description: l.description, quantity: l.quantity, unitPrice: l.amount / 100, total: l.amount / 100,
              })) || [],
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subId = sub.metadata?.subscriptionId;
        if (subId) {
          await prisma.patientSubscription.update({
            where: { id: subId },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
