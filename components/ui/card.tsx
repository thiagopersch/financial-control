'use client';

import Box from '@mui/material/Box';
import MuiCard from '@mui/material/Card';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import * as React from 'react';

/**
 * Cartão do app sobre o MUI `Card` (M3: elevação por padrão, não borda — o
 * `elevation`/`variant="outlined"` do MUI continuam passáveis via props quando
 * um card específico precisar de borda em vez de sombra).
 */
type DivProps = Omit<React.ComponentProps<'div'>, 'color'> & { sx?: SxProps<Theme> };

/** Funde o `sx` interno do primitivo com o `sx` que o consumidor passar (nunca sobrescreve). */
function mergeSx(own: SxProps<Theme>, incoming?: SxProps<Theme>): SxProps<Theme> {
  return [own, ...(Array.isArray(incoming) ? incoming : incoming ? [incoming] : [])];
}

const CardSizeContext = React.createContext<'default' | 'sm'>('default');

export function Card({
  className,
  size = 'default',
  children,
  sx,
  ...props
}: DivProps & { size?: 'default' | 'sm'; elevation?: number; variant?: 'elevation' | 'outlined' }) {
  const gap = size === 'sm' ? 1.5 : 2;
  return (
    <CardSizeContext.Provider value={size}>
      <MuiCard
        data-slot="card"
        data-size={size}
        className={className}
        sx={mergeSx({ gap, py: gap, '&:has(> [data-slot=card-footer])': { pb: 0 } }, sx)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </MuiCard>
    </CardSizeContext.Provider>
  );
}

export function CardHeader({ className, children, sx, ...props }: DivProps) {
  const size = React.useContext(CardSizeContext);
  return (
    <Box
      data-slot="card-header"
      className={className}
      sx={mergeSx(
        {
          display: 'grid',
          gridAutoRows: 'min-content',
          alignItems: 'start',
          gap: 0.5,
          px: size === 'sm' ? 1.5 : 2,
          '&:has([data-slot=card-action])': { gridTemplateColumns: '1fr auto' },
          '&.border-b': { pb: size === 'sm' ? 1.5 : 2 },
        },
        sx,
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
}

export function CardTitle({ className, children, sx, ...props }: DivProps) {
  const size = React.useContext(CardSizeContext);
  return (
    <Typography
      component="div"
      variant="h6"
      data-slot="card-title"
      className={className}
      sx={mergeSx(
        { fontSize: size === 'sm' ? '0.875rem' : '1rem', fontWeight: 600, lineHeight: 1.35 },
        sx,
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Typography>
  );
}

export function CardDescription({ className, children, sx, ...props }: DivProps) {
  return (
    <Typography
      component="div"
      variant="body2"
      color="text.secondary"
      data-slot="card-description"
      className={className}
      sx={sx}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Typography>
  );
}

export function CardAction({ className, children, sx, ...props }: DivProps) {
  return (
    <Box
      data-slot="card-action"
      className={className}
      sx={mergeSx(
        { gridColumnStart: 2, gridRow: '1 / span 2', alignSelf: 'start', justifySelf: 'end' },
        sx,
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
}

export function CardContent({ className, children, sx, ...props }: DivProps) {
  const size = React.useContext(CardSizeContext);
  return (
    <Box
      data-slot="card-content"
      className={className}
      sx={mergeSx({ px: size === 'sm' ? 1.5 : 2 }, sx)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
}

export function CardFooter({ className, children, sx, ...props }: DivProps) {
  const size = React.useContext(CardSizeContext);
  return (
    <Box
      data-slot="card-footer"
      className={className}
      sx={mergeSx(
        {
          display: 'flex',
          alignItems: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          p: size === 'sm' ? 1.5 : 2,
        },
        sx,
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
}
