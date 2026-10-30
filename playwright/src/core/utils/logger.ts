import { config } from '@config/env.config';

// Minimal levelled logger – set LOG_LEVEL=debug|info|warn|error in env
type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const current = (config.logLevel as Level) in order ? (config.logLevel as Level) : 'info';

function log(level: Level, message: string, meta?: unknown): void {
  if (order[level] < order[current]) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const out = level === 'error' ? console.error : console.log;
  if (meta === undefined) out(line);
  else out(line, typeof meta === 'string' ? meta : JSON.stringify(meta));
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
};
