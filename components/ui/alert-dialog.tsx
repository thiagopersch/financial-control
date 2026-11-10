'use client';

import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useDialogContext,
} from '@/components/ui/dialog';
import { useControllableOpen } from '@/components/ui/slot';
import Box from '@mui/material/Box';
import MuiDialog from '@mui/material/Dialog';
import type { SxProps, Theme } from '@mui/material/styles';
import * as React from 'react';

/**
 * Diálogo de confirmação (MUI `Dialog` em tamanho pequeno, sem fechar ao
 * clicar fora), com a API de antes: AlertDialogAction / AlertDialogCancel.
 */
export function AlertDialog(props: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useControllableOpen(props.open, props.defaultOpen, props.onOpenChange);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.children}
    </Dialog>
  );
}

export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;
export const AlertDialogBody = DialogBody;

export function AlertDialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
export function AlertDialogOverlay() {
  return null;
}

export function AlertDialogContent({
  className,
  size = 'default',
  children,
  style,
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  const { open } = useDialogContext();
  return (
    <MuiDialog
      open={open}
      // Confirmação exige uma escolha explícita: não fecha clicando fora.
      onClose={(_e, reason) => {
        if (reason === 'backdropClick') return;
      }}
      maxWidth={size === 'sm' ? 'xs' : 'sm'}
      role="alertdialog"
      slotProps={{
        paper: {
          'data-slot': 'alert-dialog-content',
          className,
          style,
          sx: { p: 3, gap: 2, display: 'flex', flexDirection: 'column', m: 2 },
        } as never,
      }}
    >
      {children}
    </MuiDialog>
  );
}

export function AlertDialogMedia({ className, children }: React.ComponentProps<'div'>) {
  return (
    <Box
      data-slot="alert-dialog-media"
      className={className}
      sx={{
        mb: 1,
        display: 'inline-flex',
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        bgcolor: 'action.hover',
        '& svg': { width: 24, height: 24 },
      }}
    >
      {children}
    </Box>
  );
}

type ActionProps = React.ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  sx?: SxProps<Theme>;
};

/** Botão de confirmação: executa o `onClick` e fecha (a menos que o evento seja cancelado). */
export function AlertDialogAction({
  variant = 'default',
  size = 'default',
  onClick,
  ...props
}: ActionProps) {
  const { setOpen } = useDialogContext();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  variant = 'outline',
  size = 'default',
  ...props
}: ActionProps) {
  return (
    <DialogClose asChild>
      <Button type="button" variant={variant} size={size} {...props} />
    </DialogClose>
  );
}
