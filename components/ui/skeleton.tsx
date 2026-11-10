'use client';

import MuiSkeleton from '@mui/material/Skeleton';

/**
 * Placeholder de carregamento (MUI `Skeleton`, animação "wave"). O tamanho vem
 * do `className` (ex.: `h-4 w-32`) como antes.
 */
export function Skeleton({
  className,
  variant = 'rounded',
  style,
}: {
  className?: string;
  variant?: 'rounded' | 'rectangular' | 'circular' | 'text';
  style?: React.CSSProperties;
}) {
  return (
    <MuiSkeleton
      data-slot="skeleton"
      variant={variant}
      className={className}
      style={style}
      sx={{ transform: 'none', maxWidth: '100%' }}
    />
  );
}
