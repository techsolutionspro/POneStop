import { Request } from 'express';

/** Safely extract a string query param from Express request */
export function queryString(req: Request, key: string): string | undefined {
  const val = req.query[key];
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return String(val[0]);
  return undefined;
}

/** Safely extract a number query param */
export function queryNumber(req: Request, key: string, fallback: number): number {
  const val = queryString(req, key);
  if (!val) return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}
