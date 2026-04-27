import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ForbiddenError } from '../utils/errors';

// Tier limits configuration
const TIER_LIMITS = {
  STARTER: {
    maxBranches: 1,
    maxPgds: 20,
    onlineOrdering: false,
    customDomain: false,
    customMailbox: false,
    videoConsultations: false,
    marketingTools: false,
    groupManagement: false,
    maxStaff: 10,
  },
  PROFESSIONAL: {
    maxBranches: 3,
    maxPgds: 999,
    onlineOrdering: true,
    customDomain: true,
    customMailbox: true,
    videoConsultations: false,
    marketingTools: true,
    groupManagement: false,
    maxStaff: 50,
  },
  ENTERPRISE: {
    maxBranches: 999,
    maxPgds: 999,
    onlineOrdering: true,
    customDomain: true,
    customMailbox: true,
    videoConsultations: true,
    marketingTools: true,
    groupManagement: true,
    maxStaff: 999,
  },
} as const;

type TierName = keyof typeof TIER_LIMITS;

async function getTenantTier(tenantId: string): Promise<TierName> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { tier: true } });
  return (tenant?.tier as TierName) || 'STARTER';
}

// Check branch limit before creating a new branch
export function enforceBranchLimit(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.tenantId) return next();
  // Platform users bypass
  if (['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role)) return next();

  (async () => {
    const tier = await getTenantTier(req.user!.tenantId!);
    const limits = TIER_LIMITS[tier];
    const branchCount = await prisma.branch.count({ where: { tenantId: req.user!.tenantId! } });
    if (branchCount >= limits.maxBranches) {
      return next(new ForbiddenError(`Your ${tier} plan allows up to ${limits.maxBranches} branch(es). Please upgrade to add more.`));
    }
    next();
  })().catch(next);
}

// Check service/PGD limit before activating a service
export function enforceServiceLimit(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.tenantId) return next();
  if (['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role)) return next();

  (async () => {
    const tier = await getTenantTier(req.user!.tenantId!);
    const limits = TIER_LIMITS[tier];
    const serviceCount = await prisma.tenantService.count({ where: { tenantId: req.user!.tenantId!, isActive: true } });
    if (serviceCount >= limits.maxPgds) {
      return next(new ForbiddenError(`Your ${tier} plan allows up to ${limits.maxPgds} services. Please upgrade.`));
    }
    next();
  })().catch(next);
}

// Check online ordering is enabled for the tier
export function enforceOnlineOrdering(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.tenantId) return next();
  if (['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role)) return next();

  (async () => {
    const tier = await getTenantTier(req.user!.tenantId!);
    if (!TIER_LIMITS[tier].onlineOrdering) {
      return next(new ForbiddenError('Online ordering is not available on your plan. Please upgrade to Professional or Enterprise.'));
    }
    next();
  })().catch(next);
}

// Check staff limit
export function enforceStaffLimit(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.tenantId) return next();
  if (['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role)) return next();

  (async () => {
    const tier = await getTenantTier(req.user!.tenantId!);
    const limits = TIER_LIMITS[tier];
    const staffCount = await prisma.user.count({ where: { tenantId: req.user!.tenantId!, role: { not: 'PATIENT' } } });
    if (staffCount >= limits.maxStaff) {
      return next(new ForbiddenError(`Your ${tier} plan allows up to ${limits.maxStaff} staff members. Please upgrade.`));
    }
    next();
  })().catch(next);
}

// Check feature availability
export function requireFeature(feature: keyof typeof TIER_LIMITS.STARTER) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.tenantId) return next();
    if (['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role)) return next();

    (async () => {
      const tier = await getTenantTier(req.user!.tenantId!);
      const limits = TIER_LIMITS[tier];
      if (!limits[feature]) {
        return next(new ForbiddenError(`${String(feature).replace(/([A-Z])/g, ' $1')} is not available on your ${tier} plan. Please upgrade.`));
      }
      next();
    })().catch(next);
  };
}

// Utility: get tier limits for frontend display
export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as TierName] || TIER_LIMITS.STARTER;
}
