import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import {
  registerSchema, loginSchema, refreshTokenSchema,
  changePasswordSchema, createPlatformUserSchema,
} from '../validators/auth.validators';

const router = Router();

// POST /api/auth/register — Public registration (tenant owner or patient)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await AuthService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.logout(req.user!.userId);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../config/db');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, tenantId: true, mfaEnabled: true, emailVerified: true,
        lastLoginAt: true, createdAt: true,
        tenant: { select: { id: true, name: true, slug: true, status: true, tier: true, logoUrl: true, primaryColor: true } },
        staffProfile: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    await AuthService.changePassword(req.user!.userId, data.currentPassword, data.newPassword);
    res.json({ success: true, message: 'Password changed' });
  } catch (err) { next(err); }
});

// POST /api/auth/platform-user — Super admin creates platform users
router.post('/platform-user', authenticate, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPlatformUserSchema.parse(req.body);
    const result = await AuthService.register({ ...data, tenantId: undefined });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
