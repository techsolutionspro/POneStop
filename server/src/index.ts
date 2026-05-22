import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import staffRoutes from './routes/staff.routes';
import serviceRoutes from './routes/service.routes';
import bookingRoutes from './routes/booking.routes';
import orderRoutes from './routes/order.routes';
// PGD routes disabled — not in current scope
// import pgdRoutes from './routes/pgd.routes';
import patientRoutes from './routes/patient.routes';
import auditRoutes from './routes/audit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import securityRoutes from './routes/security.routes';
import uploadRoutes from './routes/upload.routes';
import webhookRoutes from './routes/webhook.routes';
import packageRoutes from './routes/package.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import payoutRoutes from './routes/payout.routes';
import earningsRoutes from './routes/earnings.routes';
import adRoutes from './routes/ad.routes';
import subscriptionRoutes from './routes/subscription.routes';
import domainRoutes from './routes/domain.routes';
import websiteRoutes from './routes/website.routes';
import consultationRoutes from './routes/consultation.routes';
import { startRecurringJobs } from './services/jobQueue';
import { logger } from './services/logger';

const app = express();

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

import { requestLogger } from './middleware/requestLogger';

app.use(helmet());
app.use(requestLogger);
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// XSS sanitization
import { sanitizeInput } from './middleware/sanitize';
app.use(sanitizeInput);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Auth endpoints get stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many authentication attempts' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================================
// ROUTES
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/pgds', pgdRoutes); // PGD routes disabled
app.use('/api/patients', patientRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/webhooks', webhookRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(env.PORT, () => {
  logger.info(`Pharmacy One Stop API running on port ${env.PORT}`, { env: env.NODE_ENV });
  startRecurringJobs();
});

export default app;
