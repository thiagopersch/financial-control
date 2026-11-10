import type { WebVitalPayload } from '@/lib/schemas/web-vitals';

type Metric = Omit<Pick<WebVitalPayload, 'value' | 'rating' | 'id' | 'navigationType'>, never> & {
  name: string;
};

/** Só as Core Web Vitals; métricas internas do Next (ex.: "Next.js-hydration") ficam de fora. */
const WEB_VITALS = new Set<string>(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']);

/**
 * Envia a métrica com `sendBeacon` (não bloqueia a navegação e sobrevive ao
 * fechamento da aba). Cai para `fetch(keepalive)` quando não há suporte.
 */
export function reportWebVital(metric: Metric) {
  if (!WEB_VITALS.has(metric.name)) return;
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } })
    .connection?.effectiveType;
  const payload: WebVitalPayload = {
    name: metric.name as WebVitalPayload['name'],
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
    connection,
    viewportWidth: window.innerWidth,
  };
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon?.('/api/vitals', new Blob([body], { type: 'application/json' }))) return;
  void fetch('/api/vitals', {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => undefined);
}
