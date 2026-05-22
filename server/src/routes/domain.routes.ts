import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole, requireAdminRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { DomainService } from '../services/domain.service';
import { AppError, NotFoundError } from '../utils/errors';

const router = Router();

// ============================================================
// Get tenant's domain configuration
// ============================================================
router.get('/', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, subdomain: true, customDomain: true },
    });

    const domains = await prisma.domain.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        subdomain: tenant?.subdomain || tenant?.slug,
        customDomain: tenant?.customDomain,
        domains,
      },
    });
  } catch (err) { next(err); }
});

// ============================================================
// Add custom domain
// ============================================================
router.post('/custom', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const { domain: domainName } = req.body;
    if (!domainName) throw new AppError('Domain is required', 400);

    // Check not already taken
    const existing = await prisma.domain.findUnique({ where: { domain: domainName } });
    if (existing) throw new AppError('This domain is already registered on the platform', 409);

    // Get DNS instructions
    const dnsRecords = DomainService.getDnsInstructions(domainName);

    // Create domain record
    const domainRecord = await prisma.domain.create({
      data: {
        tenantId,
        domain: domainName,
        type: 'CUSTOM',
        sslStatus: 'PENDING',
        dnsConfigured: false,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        domain: domainRecord,
        dnsRecords,
        instructions: 'Add the DNS records below at your domain registrar, then click Verify.',
      },
    });
  } catch (err) { next(err); }
});

// ============================================================
// Verify domain DNS
// ============================================================
router.post('/:id/verify', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id as string, tenantId },
    });
    if (!domain) throw new NotFoundError('Domain not found');

    const result = await DomainService.verifyCustomDomain(domain.domain);

    if (result.verified) {
      // Provision SSL
      const ssl = await DomainService.provisionSsl(domain.domain);

      const updated = await prisma.domain.update({
        where: { id: domain.id },
        data: {
          dnsConfigured: true,
          sslStatus: ssl.status,
          sslExpiresAt: ssl.expiresAt ? new Date(ssl.expiresAt) : null,
        },
      });

      // Update tenant's custom domain
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { customDomain: domain.domain },
      });

      res.json({ success: true, data: { domain: updated, ssl, verified: true } });
    } else {
      res.json({
        success: true,
        data: {
          verified: false,
          errors: result.errors,
          dnsRecords: DomainService.getDnsInstructions(domain.domain),
        },
      });
    }
  } catch (err) { next(err); }
});

// ============================================================
// Remove custom domain
// ============================================================
router.delete('/:id', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id as string, tenantId },
    });
    if (!domain) throw new NotFoundError('Domain not found');

    await prisma.domain.delete({ where: { id: domain.id } });

    // Clear tenant's custom domain if it matches
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { customDomain: null },
    });

    res.json({ success: true, message: 'Domain removed' });
  } catch (err) { next(err); }
});

// ============================================================
// Get SSL status
// ============================================================
router.get('/:id/ssl', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id as string, tenantId },
    });
    if (!domain) throw new NotFoundError('Domain not found');

    res.json({
      success: true,
      data: {
        sslStatus: domain.sslStatus,
        sslExpiresAt: domain.sslExpiresAt,
        autoRenewal: domain.autoRenewal,
      },
    });
  } catch (err) { next(err); }
});

// ============================================================
// Toggle SSL auto-renewal
// ============================================================
router.put('/:id/ssl/auto-renew', authenticate, requireAdminRole, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError('Tenant context required', 403);

    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id as string, tenantId },
    });
    if (!domain) throw new NotFoundError('Domain not found');

    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: { autoRenewal: !domain.autoRenewal },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
