'use client';

import Box from '@mui/material/Box';
import * as React from 'react';

/**
 * Área com rolagem própria (antes Radix ScrollArea). Usa a barra nativa com o
 * estilo fino do tema (ver `globals.css`). `data-scroll-viewport` marca o
 * elemento que rola.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  function ScrollArea({ className, children, style, ...props }, ref) {
    return (
      <Box
        ref={ref}
        data-slot="scroll-area"
        data-scroll-viewport
        className={className}
        style={style}
        sx={{ position: 'relative', overflow: 'auto', overscrollBehavior: 'contain' }}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </Box>
    );
  },
);

export function ScrollBar(_props: { orientation?: 'vertical' | 'horizontal'; className?: string }) {
  return null;
}
