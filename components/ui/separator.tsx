'use client';

import Divider from '@mui/material/Divider';

/** Linha divisória (MUI `Divider`). */
export function Separator({
  className,
  orientation = 'horizontal',
  decorative: _decorative,
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}) {
  return (
    <Divider
      data-slot="separator"
      orientation={orientation}
      flexItem={orientation === 'vertical'}
      className={className}
    />
  );
}
