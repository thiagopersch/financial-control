'use client';

import LinearProgress from '@mui/material/LinearProgress';

const INDICATOR_PREFIX = '[&>div]:';

/**
 * Barra de progresso (MUI `LinearProgress`). Classes `[&>div]:bg-*` do
 * `className` continuam colorindo a barra (são repassadas ao indicador).
 */
export function Progress({
  className,
  value,
  indicatorClassName,
}: {
  className?: string;
  value?: number | null;
  indicatorClassName?: string;
}) {
  const tokens = (className ?? '').split(/\s+/).filter(Boolean);
  const barClasses = [
    indicatorClassName,
    ...tokens
      .filter((t) => t.startsWith(INDICATOR_PREFIX))
      .map((t) => t.slice(INDICATOR_PREFIX.length)),
  ]
    .filter(Boolean)
    .join(' ');
  const rootClasses = tokens.filter((t) => !t.startsWith(INDICATOR_PREFIX)).join(' ');

  return (
    <LinearProgress
      data-slot="progress"
      variant="determinate"
      value={Math.min(Math.max(value ?? 0, 0), 100)}
      className={rootClasses || undefined}
      classes={barClasses ? { bar: barClasses } : undefined}
      sx={{ height: 4, bgcolor: 'action.hover' }}
    />
  );
}
