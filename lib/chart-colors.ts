// Fixed-order categorical palette — validated for CVD-safe adjacent contrast.
// Never cycle/reorder per render; assign by stable index (e.g. sort order).
export const CHART_CATEGORICAL_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

export function getCategoricalColor(index: number): string {
  return CHART_CATEGORICAL_COLORS[index % CHART_CATEGORICAL_COLORS.length];
}

// Fixed status palette — reserved for status meaning, never reused for series identity.
// Mantido em sincronia manual com `paid`/`pending`/`overdue` (modo claro) em
// `components/theme/theme.ts`: este arquivo roda no servidor (dados de gráfico
// vêm de `lib/queries/*`) e não pode importar o tema MUI, que é `'use client'`.
export const CHART_STATUS_COLORS = {
  PAID: '#007a55', // theme.palette.paid.main (light)
  PENDING: '#b45309', // theme.palette.pending.main (light)
  OVERDUE: '#e7000b', // theme.palette.overdue.main (light)
} as const;
