'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  useDialogContext,
} from '@/components/ui/dialog';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { XIcon } from 'lucide-react';
import * as React from 'react';

/** Painel lateral (MUI `Drawer` temporário) com a API composta de antes. */
export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;

const ANCHOR = { right: 'right', left: 'left', top: 'top', bottom: 'bottom' } as const;

export function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
}: React.ComponentProps<'div'> & {
  side?: keyof typeof ANCHOR;
  showCloseButton?: boolean;
}) {
  const { open, setOpen } = useDialogContext();
  const horizontal = side === 'left' || side === 'right';
  return (
    <Drawer
      anchor={ANCHOR[side]}
      open={open}
      onClose={() => setOpen(false)}
      slotProps={{
        paper: {
          'data-slot': 'sheet-content',
          className,
          sx: {
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            ...(horizontal ? { width: { xs: '85vw', sm: 384 } } : { maxHeight: '85vh' }),
          },
        } as never,
      }}
    >
      {children}
      {showCloseButton && (
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
          >
            <XIcon size={16} />
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

export function SheetHeader({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="sheet-header"
      className={className}
      sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 2 }}
    >
      {children}
    </Box>
  );
}

export function SheetFooter({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="sheet-footer"
      className={className}
      sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}
    >
      {children}
    </Box>
  );
}
