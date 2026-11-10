import { registerOTel } from '@vercel/otel';

/**
 * OpenTelemetry: o Next já instrumenta rotas, renders e `fetch`; somamos as
 * queries do Prisma e um processador que loga spans lentos.
 *
 * Exportação: integração de observabilidade da Vercel (automática) ou OTLP via
 * `OTEL_EXPORTER_OTLP_ENDPOINT` — ver `.env.example`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    registerOTel({ serviceName: 'financial-control' });
    return;
  }

  const [{ PrismaInstrumentation }, { SlowSpanLogger }] = await Promise.all([
    import('@prisma/instrumentation'),
    import('@/lib/observability/slow-span-logger'),
  ]);

  registerOTel({
    serviceName: 'financial-control',
    instrumentations: ['auto', new PrismaInstrumentation()],
    spanProcessors: ['auto', new SlowSpanLogger()],
  });
}
