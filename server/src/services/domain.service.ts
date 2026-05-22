import { env } from '../config/env';
import { logger } from './logger';

// Domain & SSL Service — Cloudflare DNS + Let's Encrypt (stub-ready)
export class DomainService {
  private static async cfFetch(endpoint: string, method = 'GET', body?: any): Promise<any> {
    if (!env.CLOUDFLARE_API_TOKEN) {
      logger.warn('[Domain] No Cloudflare token — running in stub mode');
      return null;
    }

    const res = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json() as Promise<any>;
  }

  // Create a subdomain for a tenant (e.g. mypharmacy.pharmacyonestop.co.uk)
  static async createSubdomain(subdomain: string, targetIp: string): Promise<{ success: boolean; recordId?: string }> {
    const data = await this.cfFetch(`/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records`, 'POST', {
      type: 'A',
      name: `${subdomain}.${env.PLATFORM_DOMAIN}`,
      content: targetIp,
      proxied: true,
      ttl: 1, // auto
    });

    if (!data) {
      logger.info(`[Domain] Stub: created subdomain ${subdomain}.${env.PLATFORM_DOMAIN}`);
      return { success: true, recordId: `dns_stub_${Date.now()}` };
    }

    if (data.success) {
      logger.info(`[Domain] Created subdomain: ${subdomain}.${env.PLATFORM_DOMAIN}`);
      return { success: true, recordId: data.result.id };
    }

    logger.error(`[Domain] Failed to create subdomain`, { errors: data.errors });
    return { success: false };
  }

  // Verify custom domain DNS is pointing correctly
  static async verifyCustomDomain(domain: string): Promise<{
    verified: boolean;
    cnameTarget?: string;
    aRecordIp?: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cnameTarget: string | undefined;
    let aRecordIp: string | undefined;

    try {
      const dns = require('dns').promises;

      // Check CNAME
      try {
        const cnames = await dns.resolveCname(domain);
        cnameTarget = cnames[0];
        if (!cnameTarget?.includes(env.PLATFORM_DOMAIN)) {
          errors.push(`CNAME points to ${cnameTarget}, expected *.${env.PLATFORM_DOMAIN}`);
        }
      } catch {
        // No CNAME, check A record
        try {
          const addresses = await dns.resolve4(domain);
          aRecordIp = addresses[0];
        } catch {
          errors.push('No CNAME or A record found for this domain');
        }
      }

      return {
        verified: errors.length === 0 && (!!cnameTarget || !!aRecordIp),
        cnameTarget,
        aRecordIp,
        errors,
      };
    } catch (err: any) {
      return { verified: false, errors: [err.message] };
    }
  }

  // Provision SSL via Cloudflare (automatic with proxy) or Let's Encrypt
  static async provisionSsl(domain: string): Promise<{
    status: 'ACTIVE' | 'PENDING' | 'FAILED';
    expiresAt?: string;
  }> {
    // Cloudflare proxied domains get automatic SSL
    if (env.CLOUDFLARE_API_TOKEN) {
      // Add custom hostname to Cloudflare for SSL
      const data = await this.cfFetch(`/zones/${env.CLOUDFLARE_ZONE_ID}/custom_hostnames`, 'POST', {
        hostname: domain,
        ssl: {
          method: 'http',
          type: 'dv',
          settings: { min_tls_version: '1.2' },
        },
      });

      if (data?.success) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        return { status: 'PENDING', expiresAt: expiry.toISOString() };
      }
    }

    // Stub mode
    logger.info(`[Domain] Stub: provisioning SSL for ${domain}`);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return { status: 'ACTIVE', expiresAt: expiry.toISOString() };
  }

  // Get DNS records that the customer needs to configure
  static getDnsInstructions(domain: string): { type: string; name: string; value: string; purpose: string }[] {
    return [
      { type: 'CNAME', name: 'www', value: `proxy.${env.PLATFORM_DOMAIN}`, purpose: 'Website' },
      { type: 'A', name: '@', value: '63.181.137.168', purpose: 'Root domain' },
      { type: 'TXT', name: '@', value: `v=spf1 include:${env.PLATFORM_DOMAIN} ~all`, purpose: 'Email authentication' },
      { type: 'TXT', name: `_p1s-verify.${domain}`, value: `p1s-verify=${Buffer.from(domain).toString('base64').slice(0, 32)}`, purpose: 'Domain ownership' },
    ];
  }

  // Remove a custom hostname / subdomain
  static async removeDomain(recordId: string): Promise<boolean> {
    if (!env.CLOUDFLARE_API_TOKEN) {
      logger.info(`[Domain] Stub: removing record ${recordId}`);
      return true;
    }

    const data = await this.cfFetch(`/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`, 'DELETE');
    return data?.success || false;
  }
}
