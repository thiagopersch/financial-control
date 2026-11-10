'use client';

import Chip from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';
import * as React from 'react';

/**
 * Etiqueta pequena (MUI `Chip`, raio pequeno do tema — M3 não usa chip em pílula).
 * Além das variantes de UI de antes, inclui os papéis de status/domínio do tema
 * (`income`/`expense`/`pending`/`overdue`/`paid`/`neutral`) como "chip tonal": fundo
 * suave na cor do papel, texto na própria cor — para badges de situação em vez de
 * `bg-emerald-100 dark:bg-emerald-900/30` escritos à mão em cada tela.
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'income'
  | 'expense'
  | 'pending'
  | 'overdue'
  | 'paid'
  | 'dueSoon'
  | 'neutral';

const tint = (channel: string, alpha: number) =>
  `rgba(var(--mui-palette-${channel}Channel) / ${alpha})`;

/** Chip tonal: fundo suave + texto na cor do papel (`income`, `expense`, `pending`...). */
const tonal = (role: string): SxProps<Theme> => ({
  bgcolor: tint(`${role}-main`, 0.14),
  color: `${role}.main`,
});

const VARIANT_SX: Record<BadgeVariant, SxProps<Theme>> = {
  default: { bgcolor: 'primary.main', color: 'primary.contrastText' },
  secondary: { bgcolor: 'action.selected', color: 'text.primary' },
  destructive: { bgcolor: tint('error-main', 0.12), color: 'error.main' },
  outline: { bgcolor: 'transparent', border: 1, borderColor: 'divider', color: 'text.primary' },
  ghost: { bgcolor: 'transparent', color: 'text.secondary' },
  link: { bgcolor: 'transparent', color: 'primary.main', textDecoration: 'underline' },
  income: tonal('income'),
  expense: tonal('expense'),
  pending: tonal('pending'),
  overdue: tonal('overdue'),
  paid: tonal('paid'),
  dueSoon: tonal('dueSoon'),
  neutral: tonal('neutral'),
};

export interface BadgeProps extends Omit<React.ComponentProps<'span'>, 'color' | 'ref'> {
  variant?: BadgeVariant | null;
  asChild?: boolean;
  sx?: SxProps<Theme>;
  icon?: React.ReactElement;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  { variant, className, children, style, sx, asChild: _asChild, ...props },
  ref,
) {
  const v = variant ?? 'default';
  return (
    <Chip
      ref={ref}
      size="small"
      data-slot="badge"
      data-variant={v}
      className={className}
      style={style}
      label={children}
      sx={[
        {
          height: 20,
          fontSize: '0.75rem',
          width: 'fit-content',
          '& .MuiChip-label': {
            px: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            '& svg': { width: 12, height: 12 },
          },
        },
        VARIANT_SX[v],
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...(props as Record<string, unknown>)}
    />
  );
});

/** Compat: o visual vem do MUI. */
export function badgeVariants(_opts?: { variant?: BadgeVariant | null }) {
  return '';
}
