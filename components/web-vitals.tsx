'use client';

import { reportWebVital } from '@/lib/queries/web-vitals-client';
import { useReportWebVitals } from 'next/web-vitals';

/** Mede a velocidade percebida pelos usuários reais (LCP, INP, CLS, TTFB, FCP). */
export function WebVitals() {
  // Referência estável: evita reportar a mesma métrica duas vezes.
  useReportWebVitals(reportWebVital);
  return null;
}
