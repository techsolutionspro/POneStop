import { env } from '../config/env';
import { logger } from './logger';

// Identity Verification Service — Stripe Identity or stub
export class IdvService {
  private static getStripe() {
    if (!env.STRIPE_SECRET_KEY) return null;
    const Stripe = require('stripe');
    return new Stripe(env.STRIPE_SECRET_KEY);
  }

  // Create a verification session for the patient
  static async createSession(patientId: string, metadata: Record<string, string>): Promise<{
    sessionId: string;
    clientSecret: string;
    url: string;
  }> {
    const stripe = this.getStripe();
    if (!stripe) {
      logger.info(`[IDV] Stub: creating session for patient ${patientId}`);
      return {
        sessionId: `vs_stub_${Date.now()}`,
        clientSecret: `vs_secret_stub_${Date.now()}`,
        url: `${env.FRONTEND_URL}/idv-stub?patient=${patientId}`,
      };
    }

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: { patientId, ...metadata },
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_matching_selfie: true,
        },
      },
    });

    return {
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url,
    };
  }

  // Check verification status
  static async getStatus(sessionId: string): Promise<{
    status: 'requires_input' | 'processing' | 'verified' | 'canceled';
    lastError?: string;
  }> {
    const stripe = this.getStripe();
    if (!stripe) {
      return { status: 'verified' };
    }

    const session = await stripe.identity.verificationSessions.retrieve(sessionId);
    return {
      status: session.status,
      lastError: session.last_error?.message,
    };
  }

  // Handle webhook from Stripe Identity
  static async handleWebhook(event: any): Promise<{
    patientId: string;
    status: string;
    sessionId: string;
  } | null> {
    switch (event.type) {
      case 'identity.verification_session.verified': {
        const session = event.data.object;
        logger.info(`[IDV] Patient ${session.metadata.patientId} verified`);
        return {
          patientId: session.metadata.patientId,
          status: 'PASSED',
          sessionId: session.id,
        };
      }
      case 'identity.verification_session.requires_input': {
        const session = event.data.object;
        logger.warn(`[IDV] Patient ${session.metadata.patientId} needs more input`);
        return {
          patientId: session.metadata.patientId,
          status: 'PENDING',
          sessionId: session.id,
        };
      }
      case 'identity.verification_session.canceled': {
        const session = event.data.object;
        return {
          patientId: session.metadata.patientId,
          status: 'FAILED',
          sessionId: session.id,
        };
      }
      default:
        return null;
    }
  }
}
