'use client';

import Box from '@mui/material/Box';
import MuiAvatar from '@mui/material/Avatar';
import * as React from 'react';

/** Avatar (MUI `Avatar`). `AvatarImage` vira o `src`; `AvatarFallback` aparece sem imagem. */
const SIZES = { sm: 24, default: 32, lg: 40 } as const;

export function AvatarImage(_props: { src?: string | null; alt?: string; className?: string }) {
  return null;
}

export function AvatarFallback({ className, children }: React.ComponentProps<'span'>) {
  return (
    <Box
      component="span"
      className={className}
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
      }}
    >
      {children}
    </Box>
  );
}

export function Avatar({
  className,
  size = 'default',
  children,
  onClick,
}: React.ComponentProps<'span'> & { size?: keyof typeof SIZES }) {
  let image: { src?: string | null; alt?: string } | null = null;
  const rest: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AvatarImage) image = child.props as never;
    else rest.push(child);
  });
  const img = image as { src?: string | null; alt?: string } | null;
  return (
    <MuiAvatar
      data-slot="avatar"
      src={img?.src ?? undefined}
      alt={img?.alt}
      className={className}
      onClick={onClick as React.MouseEventHandler<HTMLDivElement> | undefined}
      // Imagem do avatar fora da tela não precisa carregar antes do conteúdo.
      slotProps={{ img: { loading: 'lazy', decoding: 'async' } }}
      sx={{ width: SIZES[size], height: SIZES[size], fontSize: '0.875rem' }}
    >
      {rest}
    </MuiAvatar>
  );
}

export function AvatarBadge({ className, children }: React.ComponentProps<'span'>) {
  return (
    <Box
      component="span"
      className={className}
      sx={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        border: 2,
        borderColor: 'background.paper',
      }}
    >
      {children}
    </Box>
  );
}

export function AvatarGroup({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box className={className} sx={{ display: 'flex', '& > *:not(:first-of-type)': { ml: -1 } }}>
      {children}
    </Box>
  );
}

export function AvatarGroupCount({ className, children }: React.ComponentProps<'div'>) {
  return (
    <MuiAvatar className={className} sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
      {children}
    </MuiAvatar>
  );
}
