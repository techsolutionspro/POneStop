import { prisma } from '../config/db';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

export class SchedulerService {
  // Run all scheduled tasks (call this from a cron job or setInterval)
  static async runAll() {
    console.log('[Scheduler] Running scheduled tasks...');
    await Promise.allSettled([
      this.sendBookingReminders(),
      this.processSubscriptionRescreens(),
      this.checkExpiredIdv(),
      this.sendAftercarMessages(),
      this.flagOverdueSla(),
    ]);
    console.log('[Scheduler] Scheduled tasks complete');
  }

  // Send 24h booking reminders
  static async sendBookingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow.getTime() + 86400000);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: tomorrow, lt: dayAfter }, status: 'CONFIRMED' },
      include: {
        patient: { include: { user: { select: { phone: true, email: true } } } },
        service: { select: { name: true } },
        branch: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    });

    for (const booking of bookings) {
      const phone = booking.patient?.user?.phone;
      const email = booking.patient?.user?.email;
      if (phone) {
        await SmsService.sendBookingReminder(phone, booking.tenant.name, {
          service: booking.service.name,
          date: booking.date.toLocaleDateString('en-GB'),
          time: booking.startTime,
          branch: booking.branch.name,
        });
      }
      if (email) {
        await EmailService.send({
          to: email,
          subject: `Reminder: ${booking.service.name} Tomorrow | ${booking.tenant.name}`,
          html: `<p>Reminder: Your ${booking.service.name} appointment is tomorrow at ${booking.startTime} at ${booking.branch.name}.</p>`,
        });
      }
    }
    console.log(`[Scheduler] Sent ${bookings.length} booking reminders`);
  }

  // Process subscription re-screens
  static async processSubscriptionRescreens() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today.getTime() + 3 * 86400000);

    const subs = await prisma.patientSubscription.findMany({
      where: {
        status: 'ACTIVE',
        nextRescreenDate: { lte: threeDaysFromNow },
      },
      include: {
        patient: { include: { user: { select: { email: true, phone: true } } } },
        tenant: { select: { name: true } },
      },
    });

    for (const sub of subs) {
      // Mark as pending re-screen
      await prisma.patientSubscription.update({
        where: { id: sub.id },
        data: { status: 'PENDING_RESCREEN' },
      });

      // Notify patient
      if (sub.patient?.user?.email) {
        await EmailService.send({
          to: sub.patient.user.email,
          subject: `Re-screen Required for ${sub.productName} | ${sub.tenant.name}`,
          html: `<p>Your ${sub.productName} subscription requires a quick re-screen questionnaire before your next delivery.</p><p>Please complete it within 3 days to avoid interruption.</p>`,
        });
      }
    }
    console.log(`[Scheduler] Processed ${subs.length} subscription re-screens`);
  }

  // Check for expired IDV
  static async checkExpiredIdv() {
    const now = new Date();
    const expired = await prisma.patientProfile.updateMany({
      where: { idvStatus: 'PASSED', idvExpiresAt: { lt: now } },
      data: { idvStatus: 'EXPIRED' },
    });
    if (expired.count > 0) console.log(`[Scheduler] Expired ${expired.count} IDV records`);
  }

  // Send aftercare messages (24h post-consultation)
  static async sendAftercarMessages() {
    const yesterday = new Date(Date.now() - 24 * 3600000);
    const window = new Date(yesterday.getTime() + 3600000); // 1h window

    const consultations = await prisma.consultation.findMany({
      where: {
        completedAt: { gte: yesterday, lt: window },
        outcome: 'SUPPLY_AUTHORISED',
      },
      include: {
        patient: { include: { user: { select: { phone: true } } } },
        pgd: { select: { therapyArea: true } },
      },
    });

    for (const c of consultations) {
      if (c.patient?.user?.phone) {
        await SmsService.sendAftercare(c.patient.user.phone, 'Your Pharmacy',
          `It's been 24 hours since your ${c.pgd.therapyArea} treatment. How are you feeling?`
        );
      }
    }
    console.log(`[Scheduler] Sent ${consultations.length} aftercare messages`);
  }

  // Flag orders that have breached SLA
  static async flagOverdueSla() {
    const now = new Date();
    const overdue = await prisma.onlineOrder.updateMany({
      where: {
        status: 'AWAITING_REVIEW',
        slaDeadline: { lt: now },
      },
      data: {
        reviewNotes: 'SLA BREACHED — auto-flagged by system',
      },
    });
    if (overdue.count > 0) console.log(`[Scheduler] Flagged ${overdue.count} overdue SLA orders`);
  }
}

// Auto-start scheduler in development (every 5 minutes)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => SchedulerService.runAll(), 5 * 60 * 1000);
}
