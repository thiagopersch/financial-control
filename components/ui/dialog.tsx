'use client';

import { Button } from '@/components/ui/button';
import { Slot, useControllableOpen } from '@/components/ui/slot';
import Box from '@mui/material/Box';
import MuiDialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import { Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-react';
import * as React from 'react';

/**
 * Diálogo modal sobre o MUI `Dialog`, com a API composta de antes
 * (Dialog/DialogTrigger/DialogContent/DialogHeader/DialogBody/DialogFooter).
 *
 * Regra de overflow: só o `DialogBody` rola; cabeçalho e rodapé ficam fixos.
 */
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be used inside <Dialog>');
  return ctx;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
}

export function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const [isOpen, setOpen] = useControllableOpen(open, defaultOpen, onOpenChange);
  const value = React.useMemo(() => ({ open: isOpen, setOpen }), [isOpen, setOpen]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { setOpen } = useDialogContext();
  const onClick = () => setOpen(true);
  if (asChild) return <Slot onClick={onClick}>{children}</Slot>;
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function DialogClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { setOpen } = useDialogContext();
  const onClick = () => setOpen(false);
  if (asChild) return <Slot onClick={onClick}>{children}</Slot>;
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );
}

/** Compat com a API anterior (o MUI já cuida de portal e backdrop). */
export function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogOverlay() {
  return null;
}

export interface DialogContentProps extends Omit<React.ComponentProps<'div'>, 'ref'> {
  showCloseButton?: boolean;
  showExpandButton?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onInteractOutside?: (event: Event) => void;
  onPointerDownOutside?: (event: Event) => void;
  onOpenAutoFocus?: (event: Event) => void;
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  showExpandButton = true,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  onOpenAutoFocus: _onOpenAutoFocus,
  style,
  ...props
}: DialogContentProps) {
  const { open, setOpen } = useDialogContext();
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <MuiDialog
      open={open}
      maxWidth={false}
      onClose={(event, reason) => {
        const native = event as unknown as Event;
        if (reason === 'escapeKeyDown') {
          onEscapeKeyDown?.(native as KeyboardEvent);
          if ((native as Event).defaultPrevented) return;
        } else {
          onInteractOutside?.(native);
          onPointerDownOutside?.(native);
          if ((native as Event).defaultPrevented) return;
        }
        setOpen(false);
      }}
      slotProps={{
        paper: {
          'data-slot': 'dialog-content',
          className,
          style,
          sx: {
            m: 2,
            p: 3,
            gap: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            maxWidth: isExpanded ? '90vw' : { xs: '90vw', sm: '70vw' },
            maxHeight: isExpanded ? '90vh' : { xs: '90vh', sm: '70vh' },
            position: 'relative',
          },
          ...(props as Record<string, unknown>),
        } as never,
      }}
    >
      {children}
      {(showExpandButton || showCloseButton) && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
          {showExpandButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={isExpanded ? 'Reduzir' : 'Expandir'}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? <Minimize2Icon size={16} /> : <Maximize2Icon size={16} />}
            </Button>
          )}
          {showCloseButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            >
              <XIcon size={16} />
            </Button>
          )}
        </Box>
      )}
    </MuiDialog>
  );
}

export function DialogHeader({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="dialog-header"
      className={className}
      sx={{ display: 'flex', flexShrink: 0, flexDirection: 'column', gap: 1, pr: 7 }}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
}

export function DialogBody({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="dialog-body"
      data-scroll-viewport
      className={className}
      sx={{ minHeight: 0, flex: 1, overflowX: 'hidden', overflowY: 'auto' }}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Box>
  );
}

export function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <Box
      data-slot="dialog-footer"
      className={className}
      sx={{
        display: 'flex',
        flexShrink: 0,
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        justifyContent: { sm: 'flex-end' },
        gap: 1,
        borderTop: 1,
        borderColor: 'divider',
        pt: 2,
      }}
      {...(props as Record<string, unknown>)}
    >
      {children}
      {showCloseButton && (
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Fechar
          </Button>
        </DialogClose>
      )}
    </Box>
  );
}

export function DialogTitle({ className, children, ...props }: React.ComponentProps<'h2'>) {
  return (
    <Typography
      component="h2"
      variant="h5"
      data-slot="dialog-title"
      className={className}
      sx={{ lineHeight: 1.2 }}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Typography>
  );
}

export function DialogDescription({ className, children, ...props }: React.ComponentProps<'p'>) {
  return (
    <Typography
      component="div"
      variant="body2"
      color="text.secondary"
      data-slot="dialog-description"
      className={className}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Typography>
  );
}
