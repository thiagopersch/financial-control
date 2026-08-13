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
export const CHART_STATUS_COLORS = {
  PAID: '#0ca30c',
  PENDING: '#fab219',
  OVERDUE: '#d03b3b',
} as const;
