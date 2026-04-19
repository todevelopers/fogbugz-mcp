type Level = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3 };

function activeLevel(): number {
  const env = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return LEVELS[env as Level] ?? LEVELS.info;
}

function log(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (LEVELS[level] > activeLevel()) return;
  const ts = new Date().toISOString();
  let line = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    line += ' ' + JSON.stringify(meta);
  }
  process.stderr.write(line + '\n');
}

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log('warn',  msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => log('info',  msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
};
