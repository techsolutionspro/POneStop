import request from 'supertest';
import jwt from 'jsonwebtoken';

// ============================================================
// MOCK SETUP
// ============================================================

const mockPrismaUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockPrismaTenant = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

const mockPrismaBranch = {
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockPrismaRefreshToken = {
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

const mockTransaction = jest.fn();

jest.mock('../config/db', () => ({
  prisma: {
    user: mockPrismaUser,
    tenant: mockPrismaTenant,
    branch: mockPrismaBranch,
    refreshToken: mockPrismaRefreshToken,
    $transaction: (fn: Function) => fn({
      tenant: { create: mockPrismaTenant.create },
      user: { create: mockPrismaUser.create },
    }),
  },
}));

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

const superAdminToken = generateToken({
  userId: 'user-sa-1',
  email: 'admin@pos.com',
  role: 'SUPER_ADMIN',
  tenantId: null,
});

const tenantOwnerToken = generateToken({
  userId: 'user-to-1',
  email: 'owner@pharmacy.com',
  role: 'TENANT_OWNER',
  tenantId: 'tenant-1',
});

const patientToken = generateToken({
  userId: 'user-p-1',
  email: 'patient@test.com',
  role: 'PATIENT',
  tenantId: 'tenant-1',
});

const mockTenantData = {
  id: 'tenant-1',
  name: 'Test Pharmacy',
  slug: 'test-pharmacy',
  tier: 'STARTER',
  status: 'ONBOARDING',
  companyNumber: null,
  vatNumber: null,
  gphcNumber: null,
  primaryColor: '#0066FF',
  secondaryColor: null,
  subdomain: 'test-pharmacy',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================
// TESTS
// ============================================================

describe('Tenant API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // CREATE TENANT
  // ----------------------------------------------------------
  describe('POST /api/tenants', () => {
    it('should create tenant with owner (super admin)', async () => {
      mockPrismaTenant.create.mockResolvedValue(mockTenantData);
      mockPrismaUser.create.mockResolvedValue({
        id: 'owner-1',
        email: 'owner@new-pharmacy.com',
        firstName: 'Owner',
        lastName: 'Person',
        role: 'TENANT_OWNER',
      });

      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'New Pharmacy',
          tier: 'STARTER',
          ownerEmail: 'owner@new-pharmacy.com',
          ownerPassword: 'Password1',
          ownerFirstName: 'Owner',
          ownerLastName: 'Person',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenant).toBeDefined();
      expect(res.body.data.owner).toBeDefined();
    });

    it('should reject tenant creation by patient (403)', async () => {
      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Rogue Pharmacy',
          tier: 'STARTER',
          ownerEmail: 'rogue@test.com',
          ownerPassword: 'Password1',
          ownerFirstName: 'Rogue',
          ownerLastName: 'User',
        });

      expect(res.status).toBe(403);
    });

    it('should reject tenant creation by tenant owner (403)', async () => {
      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${tenantOwnerToken}`)
        .send({
          name: 'Another Pharmacy',
          tier: 'STARTER',
          ownerEmail: 'another@test.com',
          ownerPassword: 'Password1',
          ownerFirstName: 'Another',
          ownerLastName: 'Owner',
        });

      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // LIST TENANTS
  // ----------------------------------------------------------
  describe('GET /api/tenants', () => {
    it('should list tenants for super admin', async () => {
      mockPrismaTenant.findMany.mockResolvedValue([mockTenantData]);
      mockPrismaTenant.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBe(1);
    });
  });

  // ----------------------------------------------------------
  // GET TENANT BY ID
  // ----------------------------------------------------------
  describe('GET /api/tenants/:id', () => {
    it('should return tenant by ID', async () => {
      mockPrismaTenant.findUnique.mockResolvedValue({
        ...mockTenantData,
        branches: [],
        _count: { users: 5, bookings: 10, onlineOrders: 3, services: 4 },
      });

      const res = await request(app)
        .get('/api/tenants/tenant-1')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('tenant-1');
      expect(res.body.data._count).toBeDefined();
    });

    it('should return 404 for non-existent tenant', async () => {
      mockPrismaTenant.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/tenants/non-existent')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ----------------------------------------------------------
  // UPDATE TENANT
  // ----------------------------------------------------------
  describe('PUT /api/tenants/:id', () => {
    it('should update tenant (admin role)', async () => {
      mockPrismaTenant.update.mockResolvedValue({
        ...mockTenantData,
        name: 'Updated Pharmacy Name',
      });

      const res = await request(app)
        .put('/api/tenants/tenant-1')
        .set('Authorization', `Bearer ${tenantOwnerToken}`)
        .send({ name: 'Updated Pharmacy Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Pharmacy Name');
    });

    it('should reject update by patient (403)', async () => {
      const res = await request(app)
        .put('/api/tenants/tenant-1')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // UPDATE TENANT STATUS
  // ----------------------------------------------------------
  describe('PUT /api/tenants/:id/status', () => {
    it('should update tenant status (super admin)', async () => {
      mockPrismaTenant.update.mockResolvedValue({
        ...mockTenantData,
        status: 'ACTIVE',
        goLiveAt: new Date(),
      });

      const res = await request(app)
        .put('/api/tenants/tenant-1/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('should reject status update by tenant owner (403)', async () => {
      const res = await request(app)
        .put('/api/tenants/tenant-1/status')
        .set('Authorization', `Bearer ${tenantOwnerToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // UPDATE DSP
  // ----------------------------------------------------------
  describe('PUT /api/tenants/:id/dsp', () => {
    it('should update DSP status (super admin)', async () => {
      mockPrismaTenant.update.mockResolvedValue({
        ...mockTenantData,
        dspStatus: 'VERIFIED',
        dspVerifiedAt: new Date(),
      });

      const res = await request(app)
        .put('/api/tenants/tenant-1/dsp')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          dspStatus: 'VERIFIED',
          dspNumber: 'DSP-12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dspStatus).toBe('VERIFIED');
    });
  });

  // ----------------------------------------------------------
  // BRANCHES
  // ----------------------------------------------------------
  describe('POST /api/tenants/:tenantId/branches', () => {
    it('should create a branch (tenant owner)', async () => {
      mockPrismaBranch.create.mockResolvedValue({
        id: 'branch-1',
        tenantId: 'tenant-1',
        name: 'Main Branch',
        address: '123 High Street',
        city: 'London',
        postcode: 'EC1A 1BB',
      });

      const res = await request(app)
        .post('/api/tenants/tenant-1/branches')
        .set('Authorization', `Bearer ${tenantOwnerToken}`)
        .send({
          name: 'Main Branch',
          address: '123 High Street',
          city: 'London',
          postcode: 'EC1A 1BB',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Main Branch');
    });
  });

  describe('GET /api/tenants/:tenantId/branches', () => {
    it('should list branches for tenant', async () => {
      mockPrismaBranch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          tenantId: 'tenant-1',
          name: 'Main Branch',
          _count: { staff: 3, bookings: 12 },
        },
      ]);

      const res = await request(app)
        .get('/api/tenants/tenant-1/branches')
        .set('Authorization', `Bearer ${tenantOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
