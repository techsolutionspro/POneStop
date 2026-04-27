import request from 'supertest';
import jwt from 'jsonwebtoken';

// ============================================================
// MOCK SETUP
// ============================================================

const mockPrismaOnlineOrder = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

const mockPrismaPatientProfile = {
  findUnique: jest.fn(),
};

const mockPrismaTenant = {
  findUnique: jest.fn(),
};

const mockPrismaTenantService = {
  findUnique: jest.fn(),
};

const mockPrismaAuditLog = {
  create: jest.fn(),
};

const mockPrismaShipment = {
  upsert: jest.fn(),
};

const mockPrismaUser = {
  findUnique: jest.fn(),
};

const mockPrismaRefreshToken = {
  create: jest.fn(),
};

jest.mock('../config/db', () => ({
  prisma: {
    onlineOrder: mockPrismaOnlineOrder,
    patientProfile: mockPrismaPatientProfile,
    tenant: mockPrismaTenant,
    tenantService: mockPrismaTenantService,
    auditLog: mockPrismaAuditLog,
    shipment: mockPrismaShipment,
    user: mockPrismaUser,
    refreshToken: mockPrismaRefreshToken,
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

const patientToken = generateToken({
  userId: 'user-p-1',
  email: 'patient@test.com',
  role: 'PATIENT',
  tenantId: 'tenant-1',
});

const prescriberToken = generateToken({
  userId: 'user-rx-1',
  email: 'prescriber@test.com',
  role: 'PRESCRIBER',
  tenantId: 'tenant-1',
});

const superAdminToken = generateToken({
  userId: 'user-sa-1',
  email: 'admin@pos.com',
  role: 'SUPER_ADMIN',
  tenantId: null,
});

const dispatchClerkToken = generateToken({
  userId: 'user-dc-1',
  email: 'dispatch@test.com',
  role: 'DISPATCH_CLERK',
  tenantId: 'tenant-1',
});

const mockOrder = {
  id: 'order-1',
  reference: 'ORD-1234',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  serviceId: 'service-1',
  patientId: 'patient-1',
  status: 'AWAITING_REVIEW',
  productName: 'Sildenafil',
  productStrength: '50mg',
  quantity: 1,
  isColdChain: false,
  isDiscreet: true,
  subtotal: 29.99,
  deliveryFee: 4.99,
  totalAmount: 34.98,
  paymentStatus: 'AUTHORISED',
  createdAt: new Date(),
};

// ============================================================
// TESTS
// ============================================================

describe('Order API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // CREATE ORDER
  // ----------------------------------------------------------
  describe('POST /api/orders', () => {
    it('should create an online order (patient)', async () => {
      mockPrismaPatientProfile.findUnique.mockResolvedValue({
        id: 'patient-1',
        userId: 'user-p-1',
        idvStatus: 'PASSED',
      });
      mockPrismaTenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        dspStatus: 'VERIFIED',
      });
      mockPrismaTenantService.findUnique.mockResolvedValue({
        id: 'service-1',
        name: 'Sildenafil Service',
        price: 29.99,
      });
      mockPrismaOnlineOrder.create.mockResolvedValue({
        ...mockOrder,
        service: { id: 'service-1', name: 'Sildenafil Service' },
        patient: { user: { firstName: 'Pat', lastName: 'Ient', email: 'patient@test.com' } },
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          serviceId: 'service-1',
          branchId: 'branch-1',
          productName: 'Sildenafil',
          productStrength: '50mg',
          quantity: 1,
          isColdChain: false,
          isDiscreet: true,
          questionnaireAnswers: { q1: 'yes', q2: 'no' },
          consentClinical: true,
          consentRemote: true,
          consentGpShare: false,
          consentDelivery: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.productName).toBe('Sildenafil');
    });

    it('should reject order when pharmacy has no DSP', async () => {
      mockPrismaPatientProfile.findUnique.mockResolvedValue({
        id: 'patient-1',
        userId: 'user-p-1',
        idvStatus: 'PASSED',
      });
      mockPrismaTenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        dspStatus: 'PENDING_VERIFICATION',
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          serviceId: 'service-1',
          branchId: 'branch-1',
          productName: 'Test',
          quantity: 1,
          questionnaireAnswers: {},
          consentClinical: true,
          consentRemote: true,
          consentDelivery: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/not enabled for online ordering/i);
    });

    it('should reject order when patient profile missing', async () => {
      mockPrismaPatientProfile.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          serviceId: 'service-1',
          branchId: 'branch-1',
          productName: 'Test',
          quantity: 1,
          questionnaireAnswers: {},
          consentClinical: true,
          consentRemote: true,
          consentDelivery: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/patient profile required/i);
    });
  });

  // ----------------------------------------------------------
  // LIST ORDERS
  // ----------------------------------------------------------
  describe('GET /api/orders', () => {
    it('should list orders for authenticated user', async () => {
      // Patient role triggers patientProfile lookup
      mockPrismaPatientProfile.findUnique.mockResolvedValue({
        id: 'patient-1',
        userId: 'user-p-1',
      });
      mockPrismaOnlineOrder.findMany.mockResolvedValue([mockOrder]);
      mockPrismaOnlineOrder.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  // ----------------------------------------------------------
  // GET ORDER DETAIL
  // ----------------------------------------------------------
  describe('GET /api/orders/:id', () => {
    it('should return order detail', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        service: { id: 'service-1', name: 'Sildenafil', pgd: null },
        patient: {
          user: { firstName: 'Pat', lastName: 'Ient', email: 'patient@test.com', phone: '07123456789' },
        },
        reviewer: null,
        consultation: null,
        prescription: null,
        shipment: null,
        branch: { id: 'branch-1', name: 'Main Branch' },
      });

      const res = await request(app)
        .get('/api/orders/order-1')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('order-1');
      expect(res.body.data.branch.name).toBe('Main Branch');
    });

    it('should return 404 for non-existent order', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/orders/non-existent')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ----------------------------------------------------------
  // PRESCRIBER REVIEW
  // ----------------------------------------------------------
  describe('POST /api/orders/:id/review', () => {
    it('should approve an order (prescriber)', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'AWAITING_REVIEW',
      });
      mockPrismaOnlineOrder.update.mockResolvedValue({
        ...mockOrder,
        status: 'APPROVED',
        reviewerId: 'user-rx-1',
        patient: { user: { firstName: 'Pat', lastName: 'Ient', email: 'patient@test.com' } },
      });
      mockPrismaAuditLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/orders/order-1/review')
        .set('Authorization', `Bearer ${prescriberToken}`)
        .send({ action: 'APPROVE', notes: 'All clear' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should reject an order with clinical reason', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'AWAITING_REVIEW',
      });
      mockPrismaOnlineOrder.update.mockResolvedValue({
        ...mockOrder,
        status: 'REJECTED',
        clinicalReason: 'Contraindicated',
        patient: { user: { firstName: 'Pat', lastName: 'Ient', email: 'patient@test.com' } },
      });
      mockPrismaAuditLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/orders/order-1/review')
        .set('Authorization', `Bearer ${prescriberToken}`)
        .send({ action: 'REJECT', clinicalReason: 'Contraindicated' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    it('should query an order', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'AWAITING_REVIEW',
      });
      mockPrismaOnlineOrder.update.mockResolvedValue({
        ...mockOrder,
        status: 'QUERIED',
        patient: { user: { firstName: 'Pat', lastName: 'Ient', email: 'patient@test.com' } },
      });
      mockPrismaAuditLog.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/orders/order-1/review')
        .set('Authorization', `Bearer ${prescriberToken}`)
        .send({ action: 'QUERY', clinicalReason: 'Need more info on allergies' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('QUERIED');
    });

    it('should reject review by patient (403)', async () => {
      const res = await request(app)
        .post('/api/orders/order-1/review')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ action: 'APPROVE' });

      expect(res.status).toBe(403);
    });

    it('should return 404 when reviewing non-existent order', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/orders/fake-id/review')
        .set('Authorization', `Bearer ${prescriberToken}`)
        .send({ action: 'APPROVE' });

      expect(res.status).toBe(404);
    });
  });

  // ----------------------------------------------------------
  // TRACK ORDER (public)
  // ----------------------------------------------------------
  describe('GET /api/orders/track/:reference', () => {
    it('should return tracking info without auth', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue({
        reference: 'ORD-1234',
        status: 'DISPATCHED',
        productName: 'Sildenafil',
        totalAmount: 34.98,
        createdAt: new Date(),
        shipment: {
          status: 'DISPATCHED',
          courier: 'Royal Mail',
          trackingNumber: 'RM123456789GB',
          dispatchedAt: new Date(),
          deliveredAt: null,
        },
        tenant: { name: 'Test Pharmacy', logoUrl: null, primaryColor: '#0066FF' },
      });

      const res = await request(app).get('/api/orders/track/ORD-1234');

      expect(res.status).toBe(200);
      expect(res.body.data.reference).toBe('ORD-1234');
      expect(res.body.data.shipment.courier).toBe('Royal Mail');
      // Ensure no sensitive fields leak
      expect(res.body.data.patientId).toBeUndefined();
    });

    it('should return 404 for unknown tracking reference', async () => {
      mockPrismaOnlineOrder.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/orders/track/UNKNOWN-REF');

      expect(res.status).toBe(404);
    });
  });
});
