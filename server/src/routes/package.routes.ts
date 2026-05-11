import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireSuperAdmin, requireAdminRole } from '../middleware/auth';
import { StripeService } from '../services/stripe.service';
import { z } from 'zod';

const router = Router();

const packageSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  annualPrice: z.number().positive().optional().nullable(),
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

// GET /api/packages — Public: active packages for pricing
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: packages });
  } catch (err) { next(err); }
});

// GET /api/packages/all — Super-admin: all packages including inactive
router.get('/all', authenticate, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.package.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: packages });
  } catch (err) { next(err); }
});

// GET /api/packages/stripe-status — Check if Stripe is configured
router.get('/stripe-status', authenticate, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        isLive: StripeService.isLive(),
        message: StripeService.isLive()
          ? 'Stripe is connected and active'
          : 'Stripe is in stub mode. Add STRIPE_SECRET_KEY to .env to activate real billing.',
      },
    });
  } catch (err) { next(err); }
});

// POST /api/packages — Create package
router.post('/', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = packageSchema.parse(req.body);
    const pkg = await prisma.package.create({ data });

    // Sync to Stripe if configured
    if (StripeService.isLive()) {
      const stripe = await StripeService.syncPackageToStripe({
        id: pkg.id, tier: pkg.tier, name: pkg.name, price: pkg.price, description: pkg.description,
      });
      await prisma.package.update({
        where: { id: pkg.id },
        data: { stripeProductId: stripe.stripeProductId, stripePriceId: stripe.stripePriceId },
      });
    }

    res.status(201).json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// PUT /api/packages/:id — Update package
router.put('/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = packageSchema.partial().parse(req.body);
    const pkg = await prisma.package.update({ where: { id: req.params.id }, data });

    // If price changed, sync to Stripe
    if (data.price !== undefined && StripeService.isLive()) {
      const stripe = await StripeService.syncPackageToStripe({
        id: pkg.id, tier: pkg.tier, name: pkg.name, price: pkg.price, description: pkg.description,
      });
      await prisma.package.update({
        where: { id: pkg.id },
        data: { stripeProductId: stripe.stripeProductId, stripePriceId: stripe.stripePriceId },
      });
    }

    res.json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// DELETE /api/packages/:id — Deactivate
router.delete('/:id', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await prisma.package.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// POST /api/packages/sync-stripe — Sync all packages to Stripe
router.post('/sync-stripe', authenticate, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!StripeService.isLive()) {
      res.json({ success: false, error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env.' });
      return;
    }

    const packages = await prisma.package.findMany({ where: { isActive: true } });
    const results = [];

    for (const pkg of packages) {
      const stripe = await StripeService.syncPackageToStripe({
        id: pkg.id, tier: pkg.tier, name: pkg.name, price: pkg.price, description: pkg.description,
      });
      await prisma.package.update({
        where: { id: pkg.id },
        data: { stripeProductId: stripe.stripeProductId, stripePriceId: stripe.stripePriceId },
      });
      results.push({ tier: pkg.tier, ...stripe });
    }

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// ============================================================
// TENANT BILLING — Manage tenant subscriptions
// ============================================================

// POST /api/packages/subscribe — Tenant subscribes to a plan
router.post('/subscribe', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { packageId } = req.body;
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ success: false, error: 'No tenant' }); return; }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) { res.status(404).json({ success: false, error: 'Package not found' }); return; }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) { res.status(404).json({ success: false, error: 'Tenant not found' }); return; }

    if (!StripeService.isLive() || !pkg.stripePriceId) {
      // Stub mode — just update the tier
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          tier: pkg.tier,
          stripeSubscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 14 * 86400000),
        },
      });
      res.json({ success: true, data: { mode: 'stub', tier: pkg.tier, message: 'Plan updated (Stripe not active — no charge).' } });
      return;
    }

    // Real Stripe flow
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const owner = await prisma.user.findFirst({ where: { tenantId, role: 'TENANT_OWNER' } });
      customerId = await StripeService.createTenantCustomer(tenant.name, owner?.email || '', tenantId);
      await prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: customerId } });
    }

    // If already subscribed, change plan
    if (tenant.stripeSubscriptionId) {
      await StripeService.changeTenantSubscription(tenant.stripeSubscriptionId, pkg.stripePriceId);
      await prisma.tenant.update({ where: { id: tenantId }, data: { tier: pkg.tier } });
      res.json({ success: true, data: { mode: 'upgrade', tier: pkg.tier } });
      return;
    }

    // New subscription
    const sub = await StripeService.createTenantSubscription(customerId, pkg.stripePriceId, tenantId);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        tier: pkg.tier,
        stripeSubscriptionId: sub.subscriptionId,
        stripeSubscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 86400000),
      },
    });

    res.json({ success: true, data: { mode: 'new', tier: pkg.tier, clientSecret: sub.clientSecret } });
  } catch (err) { next(err); }
});

// POST /api/packages/billing-portal — Get Stripe billing portal URL
router.post('/billing-portal', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(400).json({ success: false, error: 'No tenant' }); return; }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.stripeCustomerId) {
      res.json({ success: false, error: 'No billing account. Stripe not configured or no subscription.' });
      return;
    }

    const returnUrl = `${req.headers.origin || 'http://localhost:3000'}/admin/billing`;
    const url = await StripeService.createBillingPortal(tenant.stripeCustomerId, returnUrl);
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

// GET /api/packages/my-plan — Get current tenant's plan details
router.get('/my-plan', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.json({ success: true, data: null }); return; }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        tier: true, stripeSubscriptionStatus: true, trialEndsAt: true, currentPeriodEnd: true,
        _count: { select: { branches: true, services: true, users: true } },
      },
    });

    const pkg = await prisma.package.findUnique({ where: { tier: tenant!.tier } });

    res.json({
      success: true,
      data: {
        currentTier: tenant!.tier,
        package: pkg,
        subscriptionStatus: tenant!.stripeSubscriptionStatus || 'none',
        trialEndsAt: tenant!.trialEndsAt,
        currentPeriodEnd: tenant!.currentPeriodEnd,
        usage: {
          branches: tenant!._count.branches,
          maxBranches: pkg?.maxBranches || 1,
          services: tenant!._count.services,
          maxServices: pkg?.maxPgds || 20,
          staff: tenant!._count.users,
          maxStaff: pkg?.maxStaff || 10,
        },
        stripeIsLive: StripeService.isLive(),
      },
    });
  } catch (err) { next(err); }
});

export default router;
