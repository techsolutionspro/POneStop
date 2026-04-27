import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthService } from '../services/auth.service';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { generateSlug } from '../utils/helpers';
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

// POST /api/auth/signup — Self-service pharmacy signup (creates tenant + owner)
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signupSchema = z.object({
      pharmacyName: z.string().min(2).max(200),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(8)
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[a-z]/, 'Must contain lowercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
      phone: z.string().optional(),
      tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('STARTER'),
    });
    const data = signupSchema.parse(req.body);

    // Using static imports from top of file

    // Check email not taken
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered. Please login instead.' });
      return;
    }

    const slug = generateSlug(data.pharmacyName);

    // Check slug not taken
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      res.status(409).json({ success: false, error: 'A pharmacy with a similar name already exists. Please contact support.' });
      return;
    }

    // Create tenant + owner in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.pharmacyName,
          slug,
          tier: data.tier,
          status: 'ONBOARDING',
          subdomain: slug,
          onboardingStep: 0,
        },
      });

      const passwordHash = await bcrypt.hash(data.password, 12);
      const owner = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'TENANT_OWNER',
          tenantId: tenant.id,
          emailVerified: false,
        },
      });

      return { tenant, owner };
    });

    // Generate tokens so user is auto-logged-in after signup

    const accessToken = jwt.sign(
      { userId: result.owner.id, email: result.owner.email, role: 'TENANT_OWNER', tenantId: result.tenant.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as any
    );
    const refreshToken = jwt.sign(
      { userId: result.owner.id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as any
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: result.owner.id, expiresAt } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: result.tenant.id,
        userId: result.owner.id,
        action: 'CREATE',
        resource: 'tenant',
        resourceId: result.tenant.id,
        details: { pharmacyName: data.pharmacyName, tier: data.tier, selfService: true },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.owner.id,
          email: result.owner.email,
          firstName: result.owner.firstName,
          lastName: result.owner.lastName,
          role: 'TENANT_OWNER',
          tenantId: result.tenant.id,
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            slug: result.tenant.slug,
            status: result.tenant.status,
            tier: result.tenant.tier,
          },
        },
        accessToken,
        refreshToken,
      },
    });
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
