import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  static async send(options: EmailOptions): Promise<void> {
    if (env.NODE_ENV === 'development') {
      console.log(`[Email] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }

    // Production: use Nodemailer with SES/Postmark
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: options.from || env.FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  static async sendBookingConfirmation(patientEmail: string, pharmacyName: string, data: { reference: string; service: string; date: string; time: string; branch: string }) {
    await this.send({
      to: patientEmail,
      subject: `Booking Confirmed - ${data.reference} | ${pharmacyName}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0d9488;padding:24px;color:white;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:20px">${pharmacyName}</h1>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 16px;font-size:18px;color:#111827">Booking Confirmed</h2>
            <table style="width:100%;font-size:14px;color:#374151">
              <tr><td style="padding:8px 0;color:#6b7280">Reference</td><td style="padding:8px 0;font-weight:600">${data.reference}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Service</td><td style="padding:8px 0">${data.service}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Date</td><td style="padding:8px 0">${data.date}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0">${data.time}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Branch</td><td style="padding:8px 0">${data.branch}</td></tr>
            </table>
            <p style="font-size:13px;color:#6b7280;margin-top:24px">If you need to reschedule or cancel, please contact us or manage your booking in your account.</p>
          </div>
        </div>
      `,
    });
  }

  static async sendOrderConfirmation(patientEmail: string, pharmacyName: string, data: { reference: string; product: string; amount: string }) {
    await this.send({
      to: patientEmail,
      subject: `Order Received - ${data.reference} | ${pharmacyName}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0d9488;padding:24px;color:white;border-radius:12px 12px 0 0">
            <h1 style="margin:0;font-size:20px">${pharmacyName}</h1>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 8px;font-size:18px;color:#111827">Order Received</h2>
            <p style="color:#6b7280;font-size:14px;margin-bottom:16px">Your order is being reviewed by a qualified prescriber. We'll notify you of the outcome.</p>
            <div style="background:#f9fafb;padding:16px;border-radius:8px;font-size:14px">
              <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#6b7280">Reference</span><span style="font-weight:600">${data.reference}</span></div>
              <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#6b7280">Product</span><span>${data.product}</span></div>
              <div style="display:flex;justify-content:space-between;padding:12px 0 0;border-top:1px solid #e5e7eb;margin-top:8px"><span style="font-weight:600">Total</span><span style="font-weight:700;color:#0d9488">${data.amount}</span></div>
            </div>
          </div>
        </div>
      `,
    });
  }

  static async sendOrderApproved(patientEmail: string, pharmacyName: string, reference: string) {
    await this.send({ to: patientEmail, subject: `Order Approved - ${reference} | ${pharmacyName}`, html: `<p>Your order ${reference} has been clinically approved and is being prepared for dispatch.</p>` });
  }

  static async sendOrderRejected(patientEmail: string, pharmacyName: string, reference: string, reason: string) {
    await this.send({ to: patientEmail, subject: `Order Update - ${reference} | ${pharmacyName}`, html: `<p>Unfortunately, your order ${reference} has been clinically reviewed and cannot be fulfilled.</p><p><strong>Reason:</strong> ${reason}</p><p>A full refund has been initiated and will appear in your account within 24 hours.</p>` });
  }

  static async sendDispatchNotification(patientEmail: string, pharmacyName: string, data: { reference: string; trackingNumber: string; courier: string }) {
    await this.send({ to: patientEmail, subject: `Order Dispatched - ${data.reference} | ${pharmacyName}`, html: `<p>Your order ${data.reference} has been dispatched via ${data.courier}.</p><p><strong>Tracking:</strong> ${data.trackingNumber}</p>` });
  }

  static async sendPasswordReset(email: string, resetToken: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await this.send({ to: email, subject: 'Reset Your Password | Pharmacy One Stop', html: `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0d9488;color:white;text-decoration:none;border-radius:8px;font-weight:600">Reset Password</a></p>` });
  }

  static async sendEmailVerification(email: string, verifyToken: string) {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    await this.send({ to: email, subject: 'Verify Your Email | Pharmacy One Stop', html: `<p>Click below to verify your email address.</p><p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0d9488;color:white;text-decoration:none;border-radius:8px;font-weight:600">Verify Email</a></p>` });
  }
}
