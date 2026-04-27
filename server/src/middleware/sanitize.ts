import { Request, Response, NextFunction } from 'express';

// Simple XSS sanitization — strips HTML tags from string values in request body
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    // Don't sanitize file uploads or webhook payloads
    if (req.headers['content-type']?.includes('multipart') || req.path.includes('/webhooks')) {
      return next();
    }
    req.body = sanitizeValue(req.body);
  }
  next();
}
