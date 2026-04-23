'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FormDialogProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  isSubmitting?: boolean;
  showFooter?: boolean;
}

export function FormDialog({
  title,
  description,
  isOpen,
  onClose,
  onSubmit,
  confirmText = 'Salvar',
  cancelText = 'Cancelar',
  children,
  isSubmitting = false,
  showFooter = true,
}: FormDialogProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[95dvh] flex-col sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto py-4">{children}</div>
          {showFooter && (
            <DialogFooter className="shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {cancelText}
              </Button>
              {onSubmit && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : confirmText}
                </Button>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
