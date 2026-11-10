import { logger } from '@/lib/logger';
import { webVitalSchema } from '@/lib/schemas/web-vitals';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 2048;

/**
 * Recebe as Web Vitals dos usuários reais (RUM) e grava como log estruturado
 * (`rum.web_vital`), filtrável nos logs/observabilidade da Vercel. Métricas
 * "poor" saem como warning para facilitar alertas.
 */
export async function POST(request: NextRequest) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = webVitalSchema.safeParse(json);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const metric = parsed.data;
  const fields = {
    ...metric,
    // CLS é adimensional (ex.: 0.12); as demais são em ms.
    value: metric.name === 'CLS' ? Number(metric.value.toFixed(4)) : Math.round(metric.value),
    region: process.env.VERCEL_REGION,
  };
  if (metric.rating === 'poor') logger.warn('rum.web_vital', fields);
  else logger.info('rum.web_vital', fields);

  return new NextResponse(null, { status: 204 });
}
