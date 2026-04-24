import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireClinicalRole, requireAdminRole, scopeToTenant, requireRole } from '../middleware/auth';
import { createOnlineOrderSchema, reviewOrderSchema } from '../validators/service.validators';
import { generateReference, paginate, buildPaginationMeta } from '../utils/helpers';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

const router = Router();

// POST /api/orders — Create online order (patient)
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createOnlineOrderSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new ForbiddenError('Not associated with a pharmacy');

    // Get or verify patient profile
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new ValidationError('Patient profile required');

    // Verify tenant has DSP if online POM
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.dspStatus !== 'VERIFIED') {
      throw new ForbiddenError('This pharmacy is not enabled for online ordering');
    }

    // Get service and calculate price
    const service = await prisma.tenantService.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new NotFoundError('Service');

    const subtotal = service.price * data.quantity;
    const deliveryFee = data.isColdChain ? 9.0 : 4.99;
    const totalAmount = subtotal + deliveryFee;

    // Set SLA deadline (4 working hours)
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 4);

    const order = await prisma.onlineOrder.create({
      data: {
        reference: generateReference('ORD'),
        tenantId,
        branchId: data.branchId,
        serviceId: data.serviceId,
        patientId: patient.id,
        status: patient.idvStatus === 'PASSED' ? 'AWAITING_REVIEW' : 'AWAITING_IDV',
        productName: data.productName,
        productStrength: data.productStrength,
        quantity: data.quantity,
        isColdChain: data.isColdChain,
        isDiscreet: data.isDiscreet,
        questionnaireAnswers: data.questionnaireAnswers,
        idvPassed: patient.idvStatus === 'PASSED',
        consentClinical: data.consentClinical,
        consentRemote: data.consentRemote,
        consentGpShare: data.consentGpShare,
        consentDelivery: data.consentDelivery,
        paymentStatus: 'AUTHORISED',
        subtotal,
        deliveryFee,
        totalAmount,
        slaDeadline,
      },
      include: {
        service: { select: { id: true, name: true } },
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });

    // TODO: Create Stripe PaymentIntent (pre-auth)

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

// GET /api/orders — List orders
router.get('/', authenticate, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = String(req.query.tenantId || '') || req.user!.tenantId;
    const page = parseInt(String(req.query.page || '')) || 1;
    const limit = parseInt(String(req.query.limit || '')) || 20;
    const status = String(req.query.status || '');
    const branchId = String(req.query.branchId || '');
    const reviewerId = String(req.query.reviewerId || '');

    const where: any = { tenantId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (reviewerId) where.reviewerId = reviewerId;

    // Patients only see own orders
    if (req.user!.role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
      if (profile) where.patientId = profile.id;
    }

    const [orders, total] = await Promise.all([
      prisma.onlineOrder.findMany({
        where,
        ...paginate(page, limit),
        include: {
          service: { select: { id: true, name: true } },
          patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          reviewer: { select: { firstName: true, lastName: true } },
          shipment: { select: { status: true, trackingNumber: true, courier: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.onlineOrder.count({ where }),
    ]);

    res.json({ success: true, data: orders, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// GET /api/orders/queue — Prescriber review queue
router.get('/queue', authenticate, requireClinicalRole, scopeToTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = String(req.query.tenantId || '') || req.user!.tenantId;

    const orders = await prisma.onlineOrder.findMany({
      where: {
        tenantId: tenantId!,
        status: { in: ['AWAITING_REVIEW', 'QUERIED'] },
      },
      include: {
        service: { select: { id: true, name: true } },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first (FIFO)
    });

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.onlineOrder.findUnique({
      where: { id: req.params.id },
      include: {
        service: { include: { pgd: true } },
        patient: {
          include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
        },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        consultation: true,
        prescription: true,
        shipment: true,
        branch: { select: { id: true, name: true } },
      },
    });
    if (!order) throw new NotFoundError('Order');
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// POST /api/orders/:id/review — Prescriber reviews an order
router.post('/:id/review', authenticate, requireRole('PRESCRIBER', 'PHARMACIST', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = reviewOrderSchema.parse(req.body);
    const orderId = req.params.id;
    const reviewerId = req.user!.userId;

    const order = await prisma.onlineOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (!['AWAITING_REVIEW', 'QUERIED'].includes(order.status)) {
      throw new ValidationError('Order is not in a reviewable state');
    }

    let updateData: any = {
      reviewerId,
      reviewedAt: new Date(),
      reviewNotes: data.notes,
    };

    switch (data.action) {
      case 'APPROVE':
        updateData.status = 'APPROVED';
        updateData.paymentStatus = 'CAPTURED';
        // TODO: Capture Stripe payment, generate prescription + dispensing label
        break;
      case 'REJECT':
        updateData.status = 'REJECTED';
        updateData.clinicalReason = data.clinicalReason;
        updateData.paymentStatus = 'REFUNDED';
        // TODO: Auto-refund via Stripe
        break;
      case 'QUERY':
        updateData.status = 'QUERIED';
        updateData.clinicalReason = data.clinicalReason;
        // TODO: Send patient message
        break;
      case 'ESCALATE':
        updateData.reviewNotes = `ESCALATED: ${data.notes}`;
        break;
    }

    const updated = await prisma.onlineOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: order.tenantId,
        userId: reviewerId,
        action: data.action === 'APPROVE' ? 'APPROVE' : data.action === 'REJECT' ? 'REJECT' : 'UPDATE',
        resource: 'online_order',
        resourceId: orderId,
        details: { action: data.action, notes: data.notes, clinicalReason: data.clinicalReason },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// POST /api/orders/:id/dispatch — Mark as dispatched
router.post('/:id/dispatch', authenticate, requireRole('DISPATCH_CLERK', 'DISPENSER', 'BRANCH_MANAGER', 'TENANT_OWNER', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courier, trackingNumber } = req.body;
    const orderId = req.params.id;

    const order = await prisma.onlineOrder.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundError('Order');

    // Create or update shipment
    const shipment = await prisma.shipment.upsert({
      where: { onlineOrderId: orderId },
      create: {
        onlineOrderId: orderId,
        status: 'DISPATCHED',
        courier,
        trackingNumber,
        isColdChain: order.isColdChain,
        isSignedFor: true,
        isDiscreet: order.isDiscreet,
        dispatchedAt: new Date(),
      },
      update: {
        status: 'DISPATCHED',
        courier,
        trackingNumber,
        dispatchedAt: new Date(),
      },
    });

    await prisma.onlineOrder.update({
      where: { id: orderId },
      data: { status: 'DISPATCHED' },
    });

    res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
});

// GET /api/orders/track/:reference — Public tracking (no auth)
router.get('/track/:reference', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.onlineOrder.findUnique({
      where: { reference: req.params.reference },
      select: {
        reference: true, status: true, productName: true, totalAmount: true, createdAt: true,
        shipment: {
          select: { status: true, courier: true, trackingNumber: true, dispatchedAt: true, deliveredAt: true },
        },
        tenant: { select: { name: true, logoUrl: true, primaryColor: true } },
      },
    });
    if (!order) throw new NotFoundError('Order');
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

export default router;
