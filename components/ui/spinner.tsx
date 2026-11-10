'use client';

import type * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

/** Indicador de carregamento circular (MUI `CircularProgress`). */
export function Spinner({
  className,
  size = 16,
  ...props
}: { className?: string; size?: number } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <CircularProgress
      role="status"
      aria-label="Carregando"
      size={size}
      thickness={5}
      color="inherit"
      className={className}
      {...(props as Record<string, unknown>)}
    />
  );
}
