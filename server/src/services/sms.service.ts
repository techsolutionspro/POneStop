import { env } from '../config/env';

export class SmsService {
  static async send(to: string, message: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      console.log(`[SMS] To: ${to} | Message: ${message}`);
      return;
    }

    // Production: Twilio
    const twilio = await import('twilio');
    const client = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });
  }

  static async sendBookingReminder(phone: string, pharmacyName: string, data: { service: string; date: string; time: string; branch: string }) {
    await this.send(phone, `${pharmacyName}: Reminder - Your ${data.service} appointment is tomorrow at ${data.time}, ${data.branch}. Reply CANCEL to cancel.`);
  }

  static async sendBookingConfirmation(phone: string, pharmacyName: string, data: { reference: string; service: string; date: string; time: string }) {
    await this.send(phone, `${pharmacyName}: Booking confirmed! ${data.service} on ${data.date} at ${data.time}. Ref: ${data.reference}`);
  }

  static async sendOrderUpdate(phone: string, pharmacyName: string, reference: string, status: string) {
    const messages: Record<string, string> = {
      APPROVED: `${pharmacyName}: Order ${reference} approved! Your order is being prepared for dispatch.`,
      DISPATCHED: `${pharmacyName}: Order ${reference} dispatched! Track at ${env.FRONTEND_URL}/track/${reference}`,
      DELIVERED: `${pharmacyName}: Order ${reference} delivered. If you have any concerns, reply to this message.`,
      REJECTED: `${pharmacyName}: Order ${reference} update - please check your email for details. A refund has been initiated.`,
    };
    await this.send(phone, messages[status] || `${pharmacyName}: Order ${reference} status: ${status}`);
  }

  static async sendAftercare(phone: string, pharmacyName: string, message: string) {
    await this.send(phone, `${pharmacyName}: ${message} Reply if you need to speak to a pharmacist.`);
  }
}
