import crypto from 'crypto';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { EmailService } from './email.service';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = crypto.scryptSync(env.JWT_SECRET, 'pharmacy-one-stop-salt', 32);

export class SecurityService {
  // ============================================================
  // FIELD-LEVEL ENCRYPTION (for clinical notes, ID documents)
  // ============================================================
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, tagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if email exists

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token hash (we could use a separate table, but for now use a workaround)
    await prisma.refreshToken.create({
      data: {
        token: `reset:${tokenHash}`,
        userId: user.id,
        expiresAt,
      },
    });

    await EmailService.sendPasswordReset(email, token);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await prisma.refreshToken.findFirst({
      where: { token: `reset:${tokenHash}`, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedError('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } });
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    // Revoke all existing sessions
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================
  static async sendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (user.emailVerified) throw new ValidationError('Email already verified');

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.refreshToken.create({
      data: { token: `verify:${tokenHash}`, userId, expiresAt: new Date(Date.now() + 86400000) },
    });

    await EmailService.sendEmailVerification(user.email, token);
  }

  static async verifyEmail(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await prisma.refreshToken.findFirst({
      where: { token: `verify:${tokenHash}`, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!stored) throw new UnauthorizedError('Invalid or expired verification token');

    await prisma.user.update({ where: { id: stored.userId }, data: { emailVerified: true } });
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  }

  // ============================================================
  // MFA (TOTP)
  // ============================================================
  static generateMfaSecret(): { secret: string; otpauthUrl: string } {
    const secret = crypto.randomBytes(20).toString('hex');
    const otpauthUrl = `otpauth://totp/PharmacyOneStop?secret=${secret}&issuer=PharmacyOneStop`;
    return { secret, otpauthUrl };
  }

  static verifyMfaToken(secret: string, token: string): boolean {
    // TOTP implementation using time-based algorithm
    const time = Math.floor(Date.now() / 30000);
    for (let i = -1; i <= 1; i++) { // Allow 30s window
      const expected = this.generateTotp(secret, time + i);
      if (expected === token) return true;
    }
    return false;
  }

  private static generateTotp(secret: string, time: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(time, 4);
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24 | (hash[offset + 1] & 0xff) << 16 | (hash[offset + 2] & 0xff) << 8 | (hash[offset + 3] & 0xff)) % 1000000;
    return code.toString().padStart(6, '0');
  }

  // ============================================================
  // IMPERSONATION (Support)
  // ============================================================
  static async startImpersonation(adminUserId: string, targetUserId: string): Promise<{ token: string; expiresAt: Date }> {
    const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || !['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(admin.role)) {
      throw new UnauthorizedError('Impersonation not permitted');
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundError('Target user');

    // 30-minute time-boxed session
    const expiresAt = new Date(Date.now() + 30 * 60000);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: targetUserId,
        impersonatedById: adminUserId,
        action: 'IMPERSONATE',
        resource: 'user',
        resourceId: targetUserId,
        details: { adminEmail: admin.email, targetEmail: target.email, expiresAt: expiresAt.toISOString() },
      },
    });

    // Generate a special token for the impersonated session
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: target.id, email: target.email, role: target.role, tenantId: target.tenantId, impersonatedBy: adminUserId },
      env.JWT_SECRET,
      { expiresIn: '30m' } as any
    );

    return { token, expiresAt };
  }

  // ============================================================
  // GDPR
  // ============================================================
  static async exportUserData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: {
          include: {
            bookings: { include: { service: { select: { name: true } }, branch: { select: { name: true } } } },
            onlineOrders: { include: { service: { select: { name: true } }, shipment: true } },
            consultations: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User');

    // Strip sensitive internal fields
    const { passwordHash, mfaSecret, ...safeUser } = user;
    return {
      exportedAt: new Date().toISOString(),
      user: safeUser,
    };
  }

  static async deleteUserData(userId: string): Promise<void> {
    // Anonymize rather than hard-delete to maintain audit integrity
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@anonymized.local`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        passwordHash: 'DELETED',
        isActive: false,
        mfaSecret: null,
      },
    });

    // Anonymize patient profile
    await prisma.patientProfile.updateMany({
      where: { userId },
      data: {
        dateOfBirth: null,
        address: null,
        city: null,
        postcode: null,
        nhsNumber: null,
        gpPractice: null,
        familyMembers: null,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: { userId, action: 'DELETE', resource: 'user', resourceId: userId, details: { reason: 'GDPR right to erasure' } },
    });
  }
}
