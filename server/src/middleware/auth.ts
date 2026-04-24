import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        tenantId: string | null;
      };
    }
  }
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = header.split(' ')[1];
  try {
    req.user = AuthService.verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

// ============================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================

// Role hierarchy: higher roles include permissions of lower roles within their scope
const PLATFORM_ROLES: UserRole[] = ['SUPER_ADMIN', 'SUPPORT_AGENT'];
const TENANT_ADMIN_ROLES: UserRole[] = ['TENANT_OWNER', 'BRANCH_MANAGER'];
const CLINICAL_ROLES: UserRole[] = ['PHARMACIST', 'PRESCRIBER'];
const OPERATIONS_ROLES: UserRole[] = ['DISPENSER', 'DISPATCH_CLERK', 'RECEPTIONIST'];

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

// Platform-level access (super-admin, support)
export function requirePlatformRole(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  if (!PLATFORM_ROLES.includes(req.user.role)) {
    return next(new ForbiddenError('Platform access required'));
  }
  next();
}

// Tenant-level access: ensures user belongs to the tenant they're accessing
export function requireTenantAccess(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());

  // Platform roles can access any tenant
  if (PLATFORM_ROLES.includes(req.user.role)) return next();

  const tenantId = req.params.tenantId || req.body?.tenantId || String(req.query?.tenantId || '');
  if (tenantId && req.user.tenantId !== tenantId) {
    return next(new ForbiddenError('Tenant access denied'));
  }
  next();
}

// Clinical access (pharmacist, prescriber + admin roles)
export function requireClinicalRole(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  const allowed = [...PLATFORM_ROLES, ...TENANT_ADMIN_ROLES, ...CLINICAL_ROLES];
  if (!allowed.includes(req.user.role)) {
    return next(new ForbiddenError('Clinical access required'));
  }
  next();
}

// Admin access (tenant owner, branch manager + platform)
export function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  const allowed = [...PLATFORM_ROLES, ...TENANT_ADMIN_ROLES];
  if (!allowed.includes(req.user.role)) {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}

// Super admin only
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new ForbiddenError('Super admin access required'));
  }
  next();
}

// Tenant scoping middleware: auto-inject tenantId into queries
export function scopeToTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());

  // Platform users can specify tenantId in query/params
  if (PLATFORM_ROLES.includes(req.user.role)) {
    // Allow explicit tenant targeting
    return next();
  }

  // For tenant users, always scope to their own tenant
  if (!req.user.tenantId) {
    return next(new ForbiddenError('No tenant association'));
  }

  // Inject tenant scoping
  (req.query as Record<string, string>).tenantId = req.user.tenantId;
  next();
}
