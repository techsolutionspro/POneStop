import request from 'supertest';
import jwt from 'jsonwebtoken';

// ============================================================
// MOCK SETUP — must be before app import
// ============================================================

const mockPrismaUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockPrismaRefreshToken = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

const mockPrismaTenant = {
  findMany: jest.fn(),
  count: jest.fn(),
};

jest.mock('../config/db', () => ({
  prisma: {
    user: mockPrismaUser,
    refreshToken: mockPrismaRefreshToken,
    tenant: mockPrismaTenant,
  },
}));

// Mock env so JWT secrets are deterministic
jest.mock('../config/env', () => ({
  env: {
    PORT: 4000,
    NODE_ENV: 'test',
    DATABASE_URL: 'mock://db',
    JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-for-testing',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    FRONTEND_URL: 'http://localhost:3000',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    AWS_REGION: 'eu-west-2',
    AWS_S3_BUCKET: '',
    TWILIO_ACCOUNT_SID: '',
    TWILIO_AUTH_TOKEN: '',
    TWILIO_PHONE_NUMBER: '',
    SMTP_HOST: '',
    SMTP_PORT: 587,
    SMTP_USER: '',
    SMTP_PASS: '',
    FROM_EMAIL: 'noreply@test.com',
  },
}));

import app from '../index';

// ============================================================
// HELPERS
// ============================================================

const JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
  tenantId: string | null;
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

const mockSuperAdmin = {
  userId: 'user-sa-1',
  email: 'admin@pos.com',
  role: 'SUPER_ADMIN',
  tenantId: null,
};

const mockPatient = {
  userId: 'user-p-1',
  email: 'patient@test.com',
  role: 'PATIENT',
  tenantId: 'tenant-1',
};

const mockTenantOwner = {
  userId: 'user-to-1',
  email: 'owner@pharmacy.com',
  role: 'TENANT_OWNER',
  tenantId: 'tenant-1',
};

// ============================================================
// TESTS
// ============================================================

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null); // no existing user
      mockPrismaUser.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'new@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
        tenantId: null,
        createdAt: new Date(),
      });
      mockPrismaRefreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const res = await request(app).post('/api/auth/register').send({
        email: 'new@test.com',
        password: 'Password1',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('new@test.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      const res = await request(app).post('/api/auth/register').send({
        email: 'dup@test.com',
        password: 'Password1',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'PATIENT',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it('should return 400 for invalid password (no uppercase)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'weak@test.com',
        password: 'password1',
        firstName: 'Test',
        lastName: 'User',
        role: 'PATIENT',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 12);

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'login@test.com',
        passwordHash: hash,
        firstName: 'Test',
        lastName: 'User',
        role: 'PATIENT',
        tenantId: 'tenant-1',
        isActive: true,
        tenant: { id: 'tenant-1', name: 'Test Pharmacy', slug: 'test-pharmacy', status: 'ACTIVE', tier: 'STARTER' },
      });
      mockPrismaUser.update.mockResolvedValue({});
      mockPrismaRefreshToken.create.mockResolvedValue({ id: 'rt-2' });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'Password1',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@test.com');
      expect(res.body.data.accessToken).toBeDefined();
      // Ensure passwordHash is not returned
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 for wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('RealPassword1', 12);

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'login@test.com',
        passwordHash: hash,
        isActive: true,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'WrongPassword1',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should return 401 for non-existent email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com',
        password: 'Password1',
      });

      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------
  // GET /me
  // ----------------------------------------------------------
  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const token = generateToken(mockPatient);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-p-1',
        email: 'patient@test.com',
        firstName: 'Pat',
        lastName: 'Ient',
        role: 'PATIENT',
        tenantId: 'tenant-1',
        mfaEnabled: false,
        emailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        tenant: { id: 'tenant-1', name: 'Test Pharmacy', slug: 'test', status: 'ACTIVE', tier: 'STARTER', logoUrl: null, primaryColor: null },
        staffProfile: null,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('patient@test.com');
    });

    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------
  // REFRESH TOKEN
  // ----------------------------------------------------------
  describe('POST /api/auth/refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const refreshJwt = jwt.sign(
        { userId: 'user-1', type: 'refresh' },
        'test-jwt-refresh-secret-key-for-testing',
        { expiresIn: '7d' },
      );

      mockPrismaRefreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: refreshJwt,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          email: 'refresh@test.com',
          role: 'PATIENT',
          tenantId: 'tenant-1',
        },
      });
      mockPrismaRefreshToken.update.mockResolvedValue({});
      mockPrismaRefreshToken.create.mockResolvedValue({ id: 'rt-new' });

      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: refreshJwt,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for expired refresh token', async () => {
      mockPrismaRefreshToken.findUnique.mockResolvedValue({
        id: 'rt-expired',
        token: 'expired',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
        user: { id: 'user-1' },
      });

      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'expired',
      });

      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const token = generateToken(mockPatient);
      mockPrismaRefreshToken.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out');
    });
  });

  // ----------------------------------------------------------
  // CHANGE PASSWORD
  // ----------------------------------------------------------
  describe('PUT /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('OldPassword1', 12);
      const token = generateToken(mockPatient);

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-p-1',
        passwordHash: hash,
      });
      mockPrismaUser.update.mockResolvedValue({});

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword1',
          newPassword: 'NewPassword2',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password changed');
    });

    it('should return 401 for wrong current password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('RealPassword1', 12);
      const token = generateToken(mockPatient);

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-p-1',
        passwordHash: hash,
      });

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword1',
          newPassword: 'NewPassword2',
        });

      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------
  // RBAC — Super admin can access /api/tenants, patient cannot
  // ----------------------------------------------------------
  describe('RBAC', () => {
    it('super admin can list tenants', async () => {
      const token = generateToken(mockSuperAdmin);
      mockPrismaTenant.findMany.mockResolvedValue([]);
      mockPrismaTenant.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('patient cannot list tenants (403)', async () => {
      const token = generateToken(mockPatient);

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('tenant owner cannot list all tenants (403)', async () => {
      const token = generateToken(mockTenantOwner);

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
