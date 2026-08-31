'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <DialogBody className="flex flex-col gap-4">{children}</DialogBody>
          {showFooter && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {cancelText}
              </Button>
              {onSubmit && (
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
