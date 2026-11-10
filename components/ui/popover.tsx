'use client';

import { Slot, useControllableOpen } from '@/components/ui/slot';
import Box from '@mui/material/Box';
import MuiPopover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import * as React from 'react';

/** Popover ancorado (MUI `Popover`) com a API composta de antes. */
interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error('Popover components must be used inside <Popover>');
  return ctx;
}

export function Popover({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
}) {
  const [isOpen, setOpen] = useControllableOpen(open, defaultOpen, onOpenChange);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const value = React.useMemo(
    () => ({ open: isOpen, setOpen, anchorEl, setAnchorEl }),
    [isOpen, setOpen, anchorEl],
  );
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

export function PopoverTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { open, setOpen, setAnchorEl } = usePopover();
  const triggerProps = {
    ref: setAnchorEl,
    onClick: () => setOpen(!open),
    'aria-expanded': open,
    'aria-haspopup': 'dialog' as const,
  };
  if (asChild) return <Slot {...triggerProps}>{children}</Slot>;
  return (
    <button type="button" {...props} {...triggerProps}>
      {children}
    </button>
  );
}

/** Ancora o popover num elemento diferente do trigger. */
export function PopoverAnchor({ children }: { children?: React.ReactNode; asChild?: boolean }) {
  const { setAnchorEl } = usePopover();
  return <Slot ref={setAnchorEl}>{children}</Slot>;
}

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

function origins(side: Side, align: Align) {
  const horizontal = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
  const vertical = align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center';
  switch (side) {
    case 'top':
      return {
        anchorOrigin: { vertical: 'top', horizontal },
        transformOrigin: { vertical: 'bottom', horizontal },
      } as const;
    case 'left':
      return {
        anchorOrigin: { vertical, horizontal: 'left' },
        transformOrigin: { vertical, horizontal: 'right' },
      } as const;
    case 'right':
      return {
        anchorOrigin: { vertical, horizontal: 'right' },
        transformOrigin: { vertical, horizontal: 'left' },
      } as const;
    default:
      return {
        anchorOrigin: { vertical: 'bottom', horizontal },
        transformOrigin: { vertical: 'top', horizontal },
      } as const;
  }
}

export function PopoverContent({
  className,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  style,
  onOpenAutoFocus: _onOpenAutoFocus,
}: React.ComponentProps<'div'> & {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  onOpenAutoFocus?: (event: Event) => void;
}) {
  const { open, setOpen, anchorEl } = usePopover();
  const offset =
    side === 'bottom'
      ? { mt: `${sideOffset}px` }
      : side === 'top'
        ? { mt: `-${sideOffset}px` }
        : side === 'left'
          ? { ml: `-${sideOffset}px` }
          : { ml: `${sideOffset}px` };
  return (
    <MuiPopover
      open={open && !!anchorEl}
      anchorEl={anchorEl}
      onClose={() => setOpen(false)}
      {...origins(side, align)}
      slotProps={{
        paper: {
          'data-slot': 'popover-content',
          variant: 'outlined',
          elevation: 0,
          className,
          style,
          sx: { p: 2, width: 288, fontSize: '0.875rem', boxShadow: 3, ...offset },
        } as never,
      }}
    >
      {children}
    </MuiPopover>
  );
}

export function PopoverHeader({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
      {children}
    </Box>
  );
}

export function PopoverTitle({ className, children }: React.ComponentProps<'h2'>) {
  return (
    <Typography component="h2" variant="h6" className={className}>
      {children}
    </Typography>
  );
}

export function PopoverDescription({ className, children }: React.ComponentProps<'p'>) {
  return (
    <Typography variant="body2" color="text.secondary" className={className}>
      {children}
    </Typography>
  );
}
