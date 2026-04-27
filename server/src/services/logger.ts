import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = env.NODE_ENV === 'development' ? 'debug' : 'info';

function formatLog(level: LogLevel, message: string, meta?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level, message, ...meta };

  if (env.NODE_ENV === 'production') {
    return JSON.stringify(base);
  }

  const color = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' }[level];
  const reset = '\x1b[0m';
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${color}[${level.toUpperCase()}]${reset} ${timestamp} ${message}${metaStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL as LogLevel];
}

export const logger = {
  debug(message: string, meta?: Record<string, any>) {
    if (shouldLog('debug')) console.debug(formatLog('debug', message, meta));
  },
  info(message: string, meta?: Record<string, any>) {
    if (shouldLog('info')) console.info(formatLog('info', message, meta));
  },
  warn(message: string, meta?: Record<string, any>) {
    if (shouldLog('warn')) console.warn(formatLog('warn', message, meta));
  },
  error(message: string, meta?: Record<string, any>) {
    if (shouldLog('error')) console.error(formatLog('error', message, meta));
  },
};
