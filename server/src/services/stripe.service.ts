import { env } from '../config/env';
import { logger } from './logger';

export class StripeService {
  private static getClient() {
    if (!env.STRIPE_SECRET_KEY) {
      logger.warn('[Stripe] No secret key — running in stub mode. Add STRIPE_SECRET_KEY to .env to activate.');
      return null;
    }
    const Stripe = require('stripe');
    return new Stripe(env.STRIPE_SECRET_KEY);
  }

  static isLive(): boolean {
    return !!env.STRIPE_SECRET_KEY;
  }

  // ============================================================
  // PLATFORM BILLING — Tenant subscriptions to P1S plans
  // ============================================================

  // Sync a package to Stripe (creates/updates product + price)
  static async syncPackageToStripe(pkg: { id: string; tier: string; name: string; price: number; description: string }): Promise<{ stripeProductId: string; stripePriceId: string }> {
    const stripe = this.getClient();
    if (!stripe) return { stripeProductId: `prod_stub_${pkg.tier}`, stripePriceId: `price_stub_${pkg.tier}` };

    // Check if product exists
    const products = await stripe.products.search({ query: `metadata['packageId']:'${pkg.id}'` });
    let product;
    if (products.data.length > 0) {
      product = await stripe.products.update(products.data[0].id, {
        name: `P1S ${pkg.name}`,
        description: pkg.description,
      });
    } else {
      product = await stripe.products.create({
        name: `P1S ${pkg.name}`,
        description: pkg.description,
        metadata: { packageId: pkg.id, tier: pkg.tier },
      });
    }

    // Create new price (Stripe prices are immutable — always create new)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(pkg.price * 100),
      currency: 'gbp',
      recurring: { interval: 'month' },
      metadata: { packageId: pkg.id, tier: pkg.tier },
    });

    logger.info(`[Stripe] Synced package ${pkg.name}: product=${product.id}, price=${price.id}`);
    return { stripeProductId: product.id, stripePriceId: price.id };
  }

  // Create a Stripe customer for a tenant
  static async createTenantCustomer(tenantName: string, email: string, tenantId: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `cus_stub_${Date.now()}`;

    const customer = await stripe.customers.create({
      name: tenantName,
      email,
      metadata: { tenantId, platform: 'pharmacy-one-stop' },
    });
    return customer.id;
  }

  // Create a subscription for a tenant to a plan
  static async createTenantSubscription(customerId: string, priceId: string, tenantId: string, trialDays = 14): Promise<{ subscriptionId: string; clientSecret?: string }> {
    const stripe = this.getClient();
    if (!stripe) return { subscriptionId: `sub_stub_${Date.now()}` };

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { tenantId },
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    };
  }

  // Change a tenant's subscription to a different plan
  static async changeTenantSubscription(subscriptionId: string, newPriceId: string): Promise<void> {
    const stripe = this.getClient();
    if (!stripe) { logger.info(`[Stripe] Stub: change sub ${subscriptionId} to price ${newPriceId}`); return; }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: subscription.items.data[0].id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });
    logger.info(`[Stripe] Changed subscription ${subscriptionId} to price ${newPriceId}`);
  }

  // Cancel a tenant's subscription
  static async cancelTenantSubscription(subscriptionId: string): Promise<void> {
    const stripe = this.getClient();
    if (!stripe) { logger.info(`[Stripe] Stub: cancel sub ${subscriptionId}`); return; }

    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    logger.info(`[Stripe] Subscription ${subscriptionId} set to cancel at period end`);
  }

  // Create a billing portal session (tenant manages their own billing)
  static async createBillingPortal(customerId: string, returnUrl: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `${returnUrl}?billing=stub`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  // Create a checkout session for initial payment
  static async createCheckoutSession(priceId: string, tenantId: string, email: string, returnUrl: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `${returnUrl}?checkout=stub`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      subscription_data: {
        trial_period_days: 14,
        metadata: { tenantId },
      },
      metadata: { tenantId },
    });
    return session.url;
  }

  // ============================================================
  // MARKETPLACE PAYMENTS — All payments go to platform account
  // Commission is tracked internally, payouts are manual
  // ============================================================

  // Create a payment intent for a marketplace order (all funds to platform)
  static async createMarketplacePayment(amount: number, currency: string, metadata: Record<string, string>): Promise<{ id: string; clientSecret: string }> {
    const stripe = this.getClient();
    if (!stripe) return { id: `pi_stub_${Date.now()}`, clientSecret: 'stub_secret' };

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      capture_method: 'manual',
      metadata,
    });
    return { id: intent.id, clientSecret: intent.client_secret };
  }

  static async capturePayment(paymentIntentId: string): Promise<void> {
    const stripe = this.getClient();
    if (!stripe) { logger.info(`[Stripe] Stub capture: ${paymentIntentId}`); return; }
    await stripe.paymentIntents.capture(paymentIntentId);
  }

  static async refund(paymentIntentId: string, amount?: number): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `re_stub_${Date.now()}`;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
    });
    return refund.id;
  }

  static async createCustomer(email: string, name: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `cus_stub_${Date.now()}`;

    const customer = await stripe.customers.create({ email, name });
    return customer.id;
  }

  // ============================================================
  // STRIPE CONNECT — Onboard pharmacies as connected accounts
  // ============================================================

  // Create a Connect Express account for a pharmacy
  static async createConnectAccount(tenantId: string, email: string, businessName: string): Promise<{ accountId: string; onboardingUrl: string }> {
    const stripe = this.getClient();
    if (!stripe) {
      return { accountId: `acct_stub_${Date.now()}`, onboardingUrl: `${env.FRONTEND_URL}/admin?connect=stub` };
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'GB',
      email,
      business_type: 'company',
      company: { name: businessName },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { tenantId, platform: 'pharmacy-one-stop' },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${env.FRONTEND_URL}/admin/settings?stripe=refresh`,
      return_url: `${env.FRONTEND_URL}/admin/settings?stripe=complete`,
      type: 'account_onboarding',
    });

    logger.info(`[Stripe Connect] Account created for tenant ${tenantId}: ${account.id}`);
    return { accountId: account.id, onboardingUrl: accountLink.url };
  }

  // Get Connect account status
  static async getConnectAccountStatus(accountId: string): Promise<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: string[];
  }> {
    const stripe = this.getClient();
    if (!stripe) {
      return { chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true, requirements: [] };
    }

    const account = await stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements?.currently_due || [],
    };
  }

  // Create Connect login link for pharmacy to manage their Stripe
  static async createConnectLoginLink(accountId: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `${env.FRONTEND_URL}/admin?stripe-dashboard=stub`;

    const link = await stripe.accounts.createLoginLink(accountId);
    return link.url;
  }

  // Create payment with Connect — split between platform and pharmacy
  static async createConnectPayment(
    amount: number,
    connectedAccountId: string,
    platformFeePercent: number,
    metadata: Record<string, string>
  ): Promise<{ id: string; clientSecret: string }> {
    const stripe = this.getClient();
    if (!stripe) return { id: `pi_stub_${Date.now()}`, clientSecret: 'stub_secret' };

    const platformFee = Math.round(amount * platformFeePercent / 100);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      application_fee_amount: platformFee,
      transfer_data: { destination: connectedAccountId },
      metadata,
    });

    return { id: intent.id, clientSecret: intent.client_secret };
  }

  // Transfer funds to connected account (for manual payouts)
  static async transferToConnectedAccount(
    amount: number,
    connectedAccountId: string,
    metadata: Record<string, string>
  ): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `tr_stub_${Date.now()}`;

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      destination: connectedAccountId,
      metadata,
    });

    return transfer.id;
  }

  // Create a Stripe Identity verification session
  static async createIdentitySession(metadata: Record<string, string>): Promise<{
    sessionId: string;
    clientSecret: string;
  }> {
    const stripe = this.getClient();
    if (!stripe) {
      return { sessionId: `vs_stub_${Date.now()}`, clientSecret: `vs_secret_stub_${Date.now()}` };
    }

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata,
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_matching_selfie: true,
        },
      },
    });

    return { sessionId: session.id, clientSecret: session.client_secret };
  }
}
