import * as z from 'zod';

/** Métrica de velocidade enviada pelo navegador do usuário real (RUM). */
export const webVitalSchema = z.object({
  name: z.enum(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']),
  value: z.number().finite().nonnegative(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  id: z.string().max(100),
  navigationType: z.string().max(40).optional(),
  path: z.string().max(300),
  /** Tipo de conexão (4g, 3g…) quando o navegador informa. */
  connection: z.string().max(20).optional(),
  /** Largura da viewport: separa mobile de desktop. */
  viewportWidth: z.number().int().positive().max(10000).optional(),
});

export type WebVitalPayload = z.infer<typeof webVitalSchema>;
