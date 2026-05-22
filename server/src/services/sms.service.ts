import { env } from '../config/env';

export class SmsService {
  static async send(to: string, message: string): Promise<void> {
    if (env.NODE_ENV === 'development') {
      console.log(`[SMS] To: ${to} | Message: ${message}`);
      return;
    }

    // Production: Twilio
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require('twilio');
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
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

  static async sendVideoInvite(phone: string, pharmacyName: string, data: { date: string; time: string; joinUrl: string }) {
    await this.send(phone, `${pharmacyName}: Your video consultation is scheduled for ${data.date} at ${data.time}. Join here: ${data.joinUrl}`);
  }

  static async sendVideoReminder(phone: string, pharmacyName: string, data: { time: string; joinUrl: string }) {
    await this.send(phone, `${pharmacyName}: Reminder - Your video consultation starts in 15 minutes at ${data.time}. Join: ${data.joinUrl}`);
  }

  static async sendIdvRequired(phone: string, pharmacyName: string, verifyUrl: string) {
    await this.send(phone, `${pharmacyName}: Identity verification is required for your order. Please complete it here: ${verifyUrl}`);
  }

  static async sendSubscriptionReminder(phone: string, pharmacyName: string, data: { productName: string; deliveryDate: string }) {
    await this.send(phone, `${pharmacyName}: Your ${data.productName} repeat order is due for delivery on ${data.deliveryDate}. Reply SKIP to skip or PAUSE to pause.`);
  }

  static async sendRescreenDue(phone: string, pharmacyName: string, data: { productName: string; rescreenUrl: string }) {
    await this.send(phone, `${pharmacyName}: Your ${data.productName} subscription requires a re-screening questionnaire. Complete it here: ${data.rescreenUrl}`);
  }

  static async sendColdChainAlert(phone: string, pharmacyName: string, data: { reference: string; message: string }) {
    await this.send(phone, `${pharmacyName}: Important delivery update for order ${data.reference}: ${data.message}`);
  }
}
