import { z } from 'zod';

export const createServiceSchema = z.object({
  pgdId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  depositAmount: z.number().min(0).optional(),
  duration: z.number().int().positive().optional(),
  capacity: z.number().int().positive().default(1),
  bufferTime: z.number().int().min(0).default(0),
  fulfilmentModes: z.array(z.enum(['IN_BRANCH', 'ONLINE_DELIVERY', 'CLICK_AND_COLLECT'])).min(1),
  isDiscreet: z.boolean().default(false),
  questionnaireSchema: z.any().optional(),
  consentCopy: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createBookingSchema = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  patientId: z.string().optional(), // For staff-created bookings
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  source: z.enum(['ONLINE', 'PHONE', 'WALK_IN']).default('ONLINE'),
  questionnaireAnswers: z.any().optional(),
  consentGiven: z.boolean().default(false),
  notes: z.string().optional(),
  // Patient self-registration fields
  patientEmail: z.string().email().optional(),
  patientFirstName: z.string().optional(),
  patientLastName: z.string().optional(),
  patientPhone: z.string().optional(),
  patientDob: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS',
    'COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED',
  ]),
  cancellationReason: z.string().optional(),
});

export const createOnlineOrderSchema = z.object({
  serviceId: z.string().min(1),
  branchId: z.string().min(1),
  productName: z.string().min(1),
  productStrength: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  isColdChain: z.boolean().default(false),
  isDiscreet: z.boolean().default(false),
  questionnaireAnswers: z.any(),
  consentClinical: z.boolean(),
  consentRemote: z.boolean(),
  consentGpShare: z.boolean().default(false),
  consentDelivery: z.boolean(),
  deliveryAddress: z.string().optional(),
  subscriptionOptIn: z.boolean().default(false),
});

export const reviewOrderSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'QUERY', 'ESCALATE']),
  notes: z.string().optional(),
  clinicalReason: z.string().optional(),
  modifiedProduct: z.string().optional(),
  modifiedDose: z.string().optional(),
});
