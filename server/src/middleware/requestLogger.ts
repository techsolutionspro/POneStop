import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta: Record<string, any> = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    };

    if (req.user) meta.userId = req.user.userId;
    if (req.user?.tenantId) meta.tenantId = req.user.tenantId;

    // Skip noisy health checks in logs
    if (req.path === '/api/health') return;

    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} ${res.statusCode}`, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} ${res.statusCode}`, meta);
    } else if (duration > 1000) {
      logger.warn(`${req.method} ${req.path} SLOW ${duration}ms`, meta);
    } else {
      logger.info(`${req.method} ${req.path} ${res.statusCode}`, meta);
    }
  });

  next();
}
