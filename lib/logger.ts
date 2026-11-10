/**
 * Logger estruturado (JSON por linha) — legível nos logs da Vercel e fácil de
 * filtrar por `event`. Erros são normalizados para `{ name, message, stack }`.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function normalize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function write(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const entry: Record<string, unknown> = { level, event, time: new Date().toISOString() };
  for (const [key, value] of Object.entries(fields)) entry[key] = normalize(value);
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else if (level === 'debug') {
    if (process.env.NODE_ENV !== 'production') console.debug(line);
  } else console.info(line);
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => write('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => write('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => write('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => write('error', event, fields),
};
