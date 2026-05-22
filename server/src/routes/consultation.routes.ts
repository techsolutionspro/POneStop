import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole, requireClinicalRole, requireAdminRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { VideoService } from '../services/video.service';
import { QuestionnaireService } from '../services/questionnaire.service';
import { AppError, NotFoundError } from '../utils/errors';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { qn } from '../utils/query';

const router = Router();

// ============================================================
// Get questionnaire schema for a service
// ============================================================
router.get('/questionnaire/:serviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.tenantService.findUnique({
      where: { id: req.params.serviceId as string },
      select: { questionnaireSchema: true, name: true, category: true, requiresQuestionnaire: true },
    });
    if (!service) throw new NotFoundError('Service not found');

    if (!service.requiresQuestionnaire) {
      return res.json({ success: true, data: { required: false } });
    }

    // Return custom schema or default weight management schema
    const schema = service.questionnaireSchema || QuestionnaireService.getWeightManagementSchema();

    res.json({ success: true, data: { required: true, schema, serviceName: service.name } });
  } catch (err) { next(err); }
});

// ============================================================
// Evaluate questionnaire answers (check eligibility + red flags)
// ============================================================
router.post('/questionnaire/evaluate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId, answers } = req.body;
    if (!serviceId || !answers) throw new AppError('serviceId and answers are required', 400);

    const service = await prisma.tenantService.findUnique({
      where: { id: serviceId },
      select: { questionnaireSchema: true },
    });
    if (!service) throw new NotFoundError('Service not found');

    const schema = service.questionnaireSchema as any || QuestionnaireService.getWeightManagementSchema();
    const result = QuestionnaireService.evaluate(schema, answers);

    // Add BMI calculation if height and weight provided
    if (answers.height && answers.weight) {
      const bmiResult = QuestionnaireService.calculateBMI(answers.height, answers.weight);
      (result as any).bmi = bmiResult;
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ============================================================
// Schedule a video consultation
// ============================================================
router.post('/video/schedule', authenticate, requireClinicalRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const { patientId, bookingId, onlineOrderId, scheduledAt } = req.body;
    if (!patientId || !scheduledAt) throw new AppError('patientId and scheduledAt are required', 400);

    const sessionId = `vs_${Date.now().toString(36)}`;
    const roomName = VideoService.generateRoomName(tenantId, sessionId);

    const session = await prisma.videoSession.create({
      data: {
        tenantId,
        clinicianId: req.user!.userId,
        patientId,
        bookingId: bookingId || null,
        onlineOrderId: onlineOrderId || null,
        roomName,
        scheduledAt: new Date(scheduledAt),
      },
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) { next(err); }
});

// ============================================================
// Join a video consultation (get token)
// ============================================================
router.post('/video/:id/join', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.videoSession.findUnique({ where: { id: req.params.id as string } });
    if (!session) throw new NotFoundError('Video session not found');

    const userId = req.user!.userId;
    const isClinician = userId === session.clinicianId;
    const isPatient = userId === session.patientId;
    if (!isClinician && !isPatient) throw new AppError('You are not a participant', 403);

    // Create room if not yet created
    if (!session.roomSid) {
      const { roomSid } = await VideoService.createRoom(session.roomName);
      await prisma.videoSession.update({ where: { id: session.id }, data: { roomSid, status: 'WAITING' } });
    }

    // Generate participant token
    const identity = isClinician ? `clinician_${userId}` : `patient_${userId}`;
    const token = VideoService.generateToken(session.roomName, identity);

    // Update status if both joining
    if (session.status === 'WAITING' || session.status === 'SCHEDULED') {
      await prisma.videoSession.update({
        where: { id: session.id },
        data: { status: 'IN_PROGRESS', startedAt: session.startedAt || new Date() },
      });
    }

    res.json({
      success: true,
      data: { token, roomName: session.roomName, identity, role: isClinician ? 'clinician' : 'patient' },
    });
  } catch (err) { next(err); }
});

// ============================================================
// End a video consultation
// ============================================================
router.post('/video/:id/end', authenticate, requireClinicalRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.videoSession.findUnique({ where: { id: req.params.id as string } });
    if (!session) throw new NotFoundError('Video session not found');

    if (session.roomSid) {
      await VideoService.endRoom(session.roomSid);
    }

    const duration = session.startedAt
      ? Math.round((Date.now() - session.startedAt.getTime()) / 60000)
      : 0;

    const updated = await prisma.videoSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        duration,
        notes: req.body.notes || null,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ============================================================
// List video sessions for tenant
// ============================================================
router.get('/video', authenticate, requireClinicalRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const page = qn(req, 'page', 1);
    const limit = qn(req, 'limit', 20);
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const status = req.query.status as string;
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.videoSession.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.videoSession.count({ where }),
    ]);

    res.json({ success: true, data: sessions, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
});

// ============================================================
// Create IDV session for patient
// ============================================================
router.post('/idv/create', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { IdvService } = require('../services/idv.service');

    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) throw new NotFoundError('Patient profile not found');

    const session = await IdvService.createSession(patient.id, {
      userId: req.user!.userId,
      email: req.user!.email,
    });

    // Update patient IDV status
    await prisma.patientProfile.update({
      where: { id: patient.id },
      data: { idvStatus: 'PENDING', idvProvider: 'Stripe Identity' },
    });

    res.json({ success: true, data: session });
  } catch (err) { next(err); }
});

// ============================================================
// Check IDV status
// ============================================================
router.get('/idv/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { idvStatus: true, idvProvider: true, idvCompletedAt: true, idvExpiresAt: true },
    });
    if (!patient) throw new NotFoundError('Patient profile not found');

    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

export default router;
