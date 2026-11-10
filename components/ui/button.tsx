'use client';

import MuiButton from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import type { SxProps, Theme } from '@mui/material/styles';
import * as React from 'react';

/**
 * Botão do app sobre o MUI (`Button`/`IconButton`). Mantém a API anterior
 * (`variant`, `size`, `asChild`) para não mexer nos consumidores.
 */
export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize =
  'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

export interface ButtonProps extends Omit<React.ComponentProps<'button'>, 'color' | 'ref'> {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  /** Renderiza o filho (ex.: `<Link>`) com o visual de botão. */
  asChild?: boolean;
  sx?: SxProps<Theme>;
}

const tint = (channel: string, alpha: number) =>
  `rgba(var(--mui-palette-${channel}Channel) / ${alpha})`;

const VARIANT_SX: Record<ButtonVariant, SxProps<Theme>> = {
  // M3 "Filled button": sem sombra em repouso, elevação leve ao passar o mouse.
  default: { '&:hover': { boxShadow: 2 } },
  outline: {
    borderColor: 'divider',
    color: 'text.primary',
    bgcolor: 'background.paper',
    '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
  },
  secondary: {
    bgcolor: 'action.hover',
    color: 'text.primary',
    '&:hover': { bgcolor: 'action.selected' },
  },
  ghost: { color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } },
  destructive: {
    color: 'error.main',
    bgcolor: tint('error-main', 0.1),
    '&:hover': { bgcolor: tint('error-main', 0.18) },
  },
  link: {
    p: 0,
    minWidth: 0,
    color: 'primary.main',
    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
  },
};

const MUI_VARIANT: Record<ButtonVariant, 'contained' | 'outlined' | 'text'> = {
  default: 'contained',
  outline: 'outlined',
  secondary: 'text',
  ghost: 'text',
  destructive: 'text',
  link: 'text',
};

const SIZE_SX: Record<ButtonSize, SxProps<Theme>> = {
  default: { height: 32, px: 1.25, fontSize: '0.875rem' },
  xs: { height: 24, px: 1, fontSize: '0.75rem' },
  sm: { height: 28, px: 1.25, fontSize: '0.8rem' },
  lg: { height: 36, px: 1.5, fontSize: '0.875rem' },
  icon: { width: 32, height: 32 },
  'icon-xs': { width: 24, height: 24, '& svg': { width: 12, height: 12 } },
  'icon-sm': { width: 28, height: 28 },
  'icon-lg': { width: 36, height: 36 },
};

function asChildProps(children: React.ReactNode) {
  if (!React.isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  const { children: inner, className, ...rest } = child.props;
  return { component: child.type as React.ElementType, inner, className, rest };
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, asChild = false, className, children, sx, type, ...props },
  ref,
) {
  const v: ButtonVariant = variant ?? 'default';
  const s: ButtonSize = size ?? 'default';
  const isIcon = s.startsWith('icon');
  const styles = [
    VARIANT_SX[v],
    SIZE_SX[s],
    // `IconButton` já é circular por padrão do MUI (M3-correto) — só zera padding/minWidth.
    isIcon && { p: 0, minWidth: 0 },
    isIcon && v === 'outline' && { border: 1, borderColor: 'divider' },
    ...(Array.isArray(sx) ? sx : [sx]),
  ] as SxProps<Theme>;

  const child = asChild ? asChildProps(children) : null;
  const shared = {
    ref,
    className: [className, child?.className].filter(Boolean).join(' ') || undefined,
    'data-slot': 'button',
    'data-variant': v,
    'data-size': s,
    ...props,
    ...(child?.rest ?? {}),
  };

  if (isIcon) {
    return (
      <IconButton
        {...(shared as React.ComponentProps<typeof IconButton>)}
        {...(child ? { component: child.component } : { type: type ?? 'submit' })}
        color={v === 'destructive' ? 'error' : v === 'default' ? 'primary' : 'inherit'}
        sx={styles}
      >
        {child ? (child.inner as React.ReactNode) : children}
      </IconButton>
    );
  }

  return (
    <MuiButton
      {...(shared as React.ComponentProps<typeof MuiButton>)}
      // HTML nativo: <button> sem `type` dentro de <form> é submit — mesmo comportamento de antes.
      {...(child ? { component: child.component } : { type: type ?? 'submit' })}
      variant={MUI_VARIANT[v]}
      color={
        v === 'destructive' ? 'error' : v === 'default' || v === 'link' ? 'primary' : 'inherit'
      }
      sx={styles}
    >
      {child ? (child.inner as React.ReactNode) : children}
    </MuiButton>
  );
});

/** Compat: classes extras não são mais necessárias (o visual vem do MUI). */
export function buttonVariants(_opts?: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
}) {
  return '';
}
