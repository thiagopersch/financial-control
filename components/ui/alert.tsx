'use client';

import Box from '@mui/material/Box';
import MuiAlert from '@mui/material/Alert';
import MuiAlertTitle from '@mui/material/AlertTitle';
import * as React from 'react';

/** Aviso em destaque (MUI `Alert`). Ícone vem como primeiro filho, como antes. */
export function Alert({
  className,
  variant = 'default',
  children,
}: React.ComponentProps<'div'> & { variant?: 'default' | 'destructive' | null }) {
  const childArray = React.Children.toArray(children);
  const first = childArray[0];
  const isIcon =
    React.isValidElement(first) &&
    typeof first.type !== 'string' &&
    !(first.type as { muiName?: string }).muiName &&
    first.type !== AlertTitle &&
    first.type !== AlertDescription &&
    first.type !== AlertAction;
  return (
    <MuiAlert
      data-slot="alert"
      severity={variant === 'destructive' ? 'error' : 'info'}
      variant="outlined"
      icon={isIcon ? first : false}
      className={className}
      sx={{
        width: '100%',
        fontSize: '0.875rem',
        py: 0.5,
        ...(variant !== 'destructive' && {
          color: 'text.primary',
          borderColor: 'divider',
          '& .MuiAlert-icon': { color: 'text.secondary' },
        }),
        '& .MuiAlert-icon svg': { width: 16, height: 16 },
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      {isIcon ? childArray.slice(1) : children}
    </MuiAlert>
  );
}

export function AlertTitle({ className, children }: React.ComponentProps<'div'>) {
  return (
    <MuiAlertTitle className={className} sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.25 }}>
      {children}
    </MuiAlertTitle>
  );
}

export function AlertDescription({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="alert-description"
      className={className}
      sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
    >
      {children}
    </Box>
  );
}

export function AlertAction({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="alert-action"
      className={className}
      sx={{ position: 'absolute', top: 8, right: 8 }}
    >
      {children}
    </Box>
  );
}
