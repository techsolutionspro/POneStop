import { logger } from './logger';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { prisma } from '../config/db';

// Simple in-memory job queue (replace with BullMQ + Redis in production)
interface Job {
  id: string;
  type: string;
  data: any;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
}

class JobQueue {
  private jobs: Job[] = [];
  private processing = false;
  private intervalId?: ReturnType<typeof setInterval>;

  start(intervalMs = 30000) {
    logger.info('Job queue started', { interval: `${intervalMs / 1000}s` });
    this.intervalId = setInterval(() => this.processJobs(), intervalMs);
    // Also run immediately
    setTimeout(() => this.processJobs(), 5000);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    logger.info('Job queue stopped');
  }

  enqueue(type: string, data: any, delayMs = 0): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.jobs.push({
      id, type, data,
      scheduledAt: new Date(Date.now() + delayMs),
      status: 'pending', attempts: 0, maxAttempts: 3,
    });
    logger.debug('Job enqueued', { id, type, scheduledAt: new Date(Date.now() + delayMs).toISOString() });
    return id;
  }

  private async processJobs() {
    if (this.processing) return;
    this.processing = true;

    const now = new Date();
    const pending = this.jobs.filter(j => j.status === 'pending' && j.scheduledAt <= now);

    for (const job of pending) {
      job.status = 'processing';
      job.attempts++;

      try {
        await this.executeJob(job);
        job.status = 'completed';
        logger.info('Job completed', { id: job.id, type: job.type });
      } catch (err: any) {
        job.error = err.message;
        if (job.attempts >= job.maxAttempts) {
          job.status = 'failed';
          logger.error('Job failed permanently', { id: job.id, type: job.type, error: err.message });
        } else {
          job.status = 'pending';
          job.scheduledAt = new Date(Date.now() + 60000 * job.attempts); // Exponential backoff
          logger.warn('Job failed, retrying', { id: job.id, type: job.type, attempt: job.attempts });
        }
      }
    }

    // Clean completed jobs older than 1 hour
    const cutoff = Date.now() - 3600000;
    this.jobs = this.jobs.filter(j => j.status !== 'completed' || new Date(j.scheduledAt).getTime() > cutoff);

    this.processing = false;
  }

  private async executeJob(job: Job) {
    switch (job.type) {
      case 'send_booking_reminder':
        await SmsService.sendBookingReminder(job.data.phone, job.data.pharmacyName, job.data);
        break;

      case 'send_booking_confirmation_email':
        await EmailService.sendBookingConfirmation(job.data.email, job.data.pharmacyName, job.data);
        break;

      case 'send_order_confirmation_email':
        await EmailService.sendOrderConfirmation(job.data.email, job.data.pharmacyName, job.data);
        break;

      case 'send_order_status_sms':
        await SmsService.sendOrderUpdate(job.data.phone, job.data.pharmacyName, job.data.reference, job.data.status);
        break;

      case 'send_dispatch_notification':
        await EmailService.sendDispatchNotification(job.data.email, job.data.pharmacyName, job.data);
        break;

      case 'send_aftercare':
        await SmsService.sendAftercare(job.data.phone, job.data.pharmacyName, job.data.message);
        break;

      case 'check_subscription_rescreens':
        await this.checkSubscriptionRescreens();
        break;

      case 'check_booking_reminders':
        await this.checkBookingReminders();
        break;

      case 'check_sla_breaches':
        await this.checkSlaBreaches();
        break;

      default:
        logger.warn('Unknown job type', { type: job.type });
    }
  }

  private async checkBookingReminders() {
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

    for (const b of bookings) {
      if (b.patient?.user?.phone) {
        this.enqueue('send_booking_reminder', {
          phone: b.patient.user.phone,
          pharmacyName: b.tenant.name,
          service: b.service.name,
          date: b.date.toLocaleDateString('en-GB'),
          time: b.startTime,
          branch: b.branch.name,
        });
      }
    }
    logger.info('Booking reminders queued', { count: bookings.length });
  }

  private async checkSubscriptionRescreens() {
    const threeDays = new Date(Date.now() + 3 * 86400000);
    const subs = await prisma.patientSubscription.findMany({
      where: { status: 'ACTIVE', nextRescreenDate: { lte: threeDays } },
      include: { patient: { include: { user: { select: { email: true } } } }, tenant: { select: { name: true } } },
    });

    for (const sub of subs) {
      await prisma.patientSubscription.update({ where: { id: sub.id }, data: { status: 'PENDING_RESCREEN' } });
      if (sub.patient?.user?.email) {
        this.enqueue('send_order_confirmation_email', {
          email: sub.patient.user.email,
          pharmacyName: sub.tenant.name,
          reference: `SUB-${sub.id.slice(-6)}`,
          product: sub.productName,
          amount: 'Re-screen required',
        });
      }
    }
    logger.info('Subscription re-screens processed', { count: subs.length });
  }

  private async checkSlaBreaches() {
    const now = new Date();
    const result = await prisma.onlineOrder.updateMany({
      where: { status: 'AWAITING_REVIEW', slaDeadline: { lt: now } },
      data: { reviewNotes: 'SLA BREACHED — auto-flagged' },
    });
    if (result.count > 0) logger.warn('SLA breaches flagged', { count: result.count });
  }

  getStats() {
    return {
      total: this.jobs.length,
      pending: this.jobs.filter(j => j.status === 'pending').length,
      processing: this.jobs.filter(j => j.status === 'processing').length,
      completed: this.jobs.filter(j => j.status === 'completed').length,
      failed: this.jobs.filter(j => j.status === 'failed').length,
    };
  }
}

export const jobQueue = new JobQueue();

// Schedule recurring jobs
export function startRecurringJobs() {
  jobQueue.start(30000); // Process every 30 seconds

  // Schedule recurring checks every 5 minutes
  setInterval(() => {
    jobQueue.enqueue('check_booking_reminders', {});
    jobQueue.enqueue('check_subscription_rescreens', {});
    jobQueue.enqueue('check_sla_breaches', {});
  }, 5 * 60 * 1000);

  // Run immediately on startup
  jobQueue.enqueue('check_sla_breaches', {});
}
