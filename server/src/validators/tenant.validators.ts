import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('STARTER'),
  companyNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  gphcNumber: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  // Owner details (created alongside tenant)
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  ownerFirstName: z.string().min(1),
  ownerLastName: z.string().min(1),
  ownerPhone: z.string().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  faviconUrl: z.string().url().optional().nullable(),
  companyNumber: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  gphcNumber: z.string().optional().nullable(),
  customDomain: z.string().optional().nullable(),
  onboardingStep: z.number().int().min(0).max(7).optional(),
});

export const updateTenantStatusSchema = z.object({
  status: z.enum(['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED']),
});

export const updateTenantTierSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
});

export const updateDspSchema = z.object({
  dspStatus: z.enum(['NOT_APPLICABLE', 'PENDING_VERIFICATION', 'VERIFIED', 'EXPIRED', 'REJECTED']),
  dspNumber: z.string().optional(),
  dspEvidenceUrl: z.string().url().optional(),
  dspNextReviewDate: z.string().datetime().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1),
  postcode: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  openingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
  })).optional(),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});
