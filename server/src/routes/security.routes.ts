import { Router, Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/security.service';
import { authenticate, requireSuperAdmin, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// POST /api/security/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await SecurityService.requestPasswordReset(email);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
});

// POST /api/security/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = z.object({ token: z.string(), password: z.string().min(8) }).parse(req.body);
    await SecurityService.resetPassword(token, password);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
});

// POST /api/security/verify-email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    await SecurityService.verifyEmail(token);
    res.json({ success: true, message: 'Email verified' });
  } catch (err) { next(err); }
});

// POST /api/security/send-verification — Resend verification email
router.post('/send-verification', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await SecurityService.sendVerificationEmail(req.user!.userId);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) { next(err); }
});

// POST /api/security/mfa/setup — Enable MFA
router.post('/mfa/setup', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { secret, otpauthUrl } = SecurityService.generateMfaSecret();
    const { prisma } = await import('../config/db');
    await prisma.user.update({ where: { id: req.user!.userId }, data: { mfaSecret: secret } });
    res.json({ success: true, data: { secret, otpauthUrl } });
  } catch (err) { next(err); }
});

// POST /api/security/mfa/verify — Verify and activate MFA
router.post('/mfa/verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = z.object({ token: z.string().length(6) }).parse(req.body);
    const { prisma } = await import('../config/db');
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.mfaSecret) return res.status(400).json({ success: false, error: 'MFA not set up' });

    const valid = SecurityService.verifyMfaToken(user.mfaSecret, token);
    if (!valid) return res.status(400).json({ success: false, error: 'Invalid MFA code' });

    await prisma.user.update({ where: { id: req.user!.userId }, data: { mfaEnabled: true } });
    res.json({ success: true, message: 'MFA enabled' });
  } catch (err) { next(err); }
});

// POST /api/security/mfa/disable
router.post('/mfa/disable', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../config/db');
    await prisma.user.update({ where: { id: req.user!.userId }, data: { mfaEnabled: false, mfaSecret: null } });
    res.json({ success: true, message: 'MFA disabled' });
  } catch (err) { next(err); }
});

// POST /api/security/impersonate — Start impersonation session (Super-Admin/Support)
router.post('/impersonate', authenticate, requireRole('SUPER_ADMIN', 'SUPPORT_AGENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetUserId } = z.object({ targetUserId: z.string() }).parse(req.body);
    const result = await SecurityService.startImpersonation(req.user!.userId, targetUserId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/security/gdpr/export — Export all user data
router.get('/gdpr/export', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await SecurityService.exportUserData(req.user!.userId);

    const { prisma } = await import('../config/db');
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, tenantId: req.user!.tenantId, action: 'EXPORT', resource: 'user', resourceId: req.user!.userId },
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// DELETE /api/security/gdpr/delete — Right to erasure
router.delete('/gdpr/delete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await SecurityService.deleteUserData(req.user!.userId);
    res.json({ success: true, message: 'Your data has been anonymised. You have been logged out.' });
  } catch (err) { next(err); }
});

export default router;
