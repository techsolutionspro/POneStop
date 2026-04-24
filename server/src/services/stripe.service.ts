import { env } from '../config/env';

// Stripe Connect integration for multi-tenant payments
export class StripeService {
  private static getClient() {
    if (!env.STRIPE_SECRET_KEY) {
      console.warn('[Stripe] No secret key configured — running in stub mode');
      return null;
    }
    const Stripe = require('stripe');
    return new Stripe(env.STRIPE_SECRET_KEY);
  }

  // Create a connected account for a pharmacy tenant
  static async createConnectedAccount(tenantName: string, email: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `acct_stub_${Date.now()}`;

    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'GB',
      email,
      business_type: 'company',
      company: { name: tenantName },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });
    return account.id;
  }

  // Create an onboarding link for a tenant to complete Stripe setup
  static async createAccountLink(accountId: string, returnUrl: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `${returnUrl}?stripe=stub`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return link.url;
  }

  // Create a payment intent (pre-authorization for online orders)
  static async createPaymentIntent(amount: number, currency: string, connectedAccountId: string, metadata: Record<string, string>): Promise<{ id: string; clientSecret: string }> {
    const stripe = this.getClient();
    if (!stripe) return { id: `pi_stub_${Date.now()}`, clientSecret: 'stub_secret' };

    // Platform fee: 0.5% uplift
    const platformFee = Math.round(amount * 0.005);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses pence
      currency,
      capture_method: 'manual', // Pre-auth only, capture after approval
      metadata,
      application_fee_amount: platformFee,
      transfer_data: { destination: connectedAccountId },
    });
    return { id: intent.id, clientSecret: intent.client_secret };
  }

  // Capture a pre-authorized payment (after clinical approval)
  static async capturePayment(paymentIntentId: string): Promise<void> {
    const stripe = this.getClient();
    if (!stripe) { console.log(`[Stripe] Stub capture: ${paymentIntentId}`); return; }
    await stripe.paymentIntents.capture(paymentIntentId);
  }

  // Refund a payment
  static async refund(paymentIntentId: string, amount?: number): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `re_stub_${Date.now()}`;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
    });
    return refund.id;
  }

  // Create a subscription for repeat orders
  static async createSubscription(customerId: string, priceId: string, connectedAccountId: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `sub_stub_${Date.now()}`;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      application_fee_percent: 0.5,
      transfer_data: { destination: connectedAccountId },
    });
    return subscription.id;
  }

  // Cancel a subscription
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    const stripe = this.getClient();
    if (!stripe) { console.log(`[Stripe] Stub cancel subscription: ${subscriptionId}`); return; }
    await stripe.subscriptions.cancel(subscriptionId);
  }

  // Create a customer
  static async createCustomer(email: string, name: string, connectedAccountId: string): Promise<string> {
    const stripe = this.getClient();
    if (!stripe) return `cus_stub_${Date.now()}`;

    const customer = await stripe.customers.create({ email, name }, { stripeAccount: connectedAccountId });
    return customer.id;
  }
}
