import type { Context } from '@opentelemetry/api';
import type { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { logger } from '@/lib/logger';

const DEFAULT_SLOW_REQUEST_MS = 1000;

/** Atributos úteis para achar a origem da lentidão, sem dados sensíveis. */
const KEPT_ATTRIBUTES = [
  'http.method',
  'http.route',
  'http.target',
  'http.status_code',
  'next.route',
  'next.span_type',
  'db.system',
  'db.operation.name',
  'db.collection.name',
];

/**
 * Loga (JSON estruturado, visível nos logs da Vercel) todo span que passa de
 * `SLOW_REQUEST_MS` — requisições, renders, `fetch` externos e queries Prisma.
 * Não exporta nada: convive com o exportador padrão.
 */
export class SlowSpanLogger implements SpanProcessor {
  private readonly thresholdMs = Number(process.env.SLOW_REQUEST_MS ?? DEFAULT_SLOW_REQUEST_MS);

  onStart(_span: Span, _parentContext: Context): void {}

  onEnd(span: ReadableSpan): void {
    const [seconds, nanos] = span.duration;
    const durationMs = seconds * 1000 + nanos / 1e6;
    if (durationMs < this.thresholdMs) return;

    const attributes: Record<string, unknown> = {};
    for (const key of KEPT_ATTRIBUTES) {
      if (span.attributes[key] !== undefined) attributes[key] = span.attributes[key];
    }

    logger.warn('otel.slow_span', {
      name: span.name,
      durationMs: Math.round(durationMs),
      thresholdMs: this.thresholdMs,
      traceId: span.spanContext().traceId,
      status: span.status.code,
      ...attributes,
    });
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
