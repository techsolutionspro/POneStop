import { Request } from 'express';

/** Safely extract a string query param */
export function qs(req: Request, key: string): string | undefined {
  const val = req.query[key];
  if (typeof val === 'string') return val || undefined;
  if (Array.isArray(val) && val.length > 0) return String(val[0]) || undefined;
  return undefined;
}

/** Safely extract a number query param */
export function qn(req: Request, key: string, fallback: number): number {
  const val = qs(req, key);
  if (!val) return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}
