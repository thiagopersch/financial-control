'use client';

import FormLabel from '@mui/material/FormLabel';
import * as React from 'react';

export type LabelProps = React.ComponentProps<'label'>;

/** Rótulo de campo (MUI `FormLabel`). */
export function Label({ className, children, ...props }: LabelProps) {
  return (
    <FormLabel
      data-slot="label"
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1,
        color: 'text.primary',
        '&.Mui-focused': { color: 'text.primary' },
      }}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </FormLabel>
  );
}
