'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteSupplier } from '@/lib/actions/suppliers';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

export function DeleteConfirmModal({ isOpen, onClose, id }: DeleteConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function onConfirm() {
    setIsLoading(true);
    try {
      const result = await deleteSupplier(id);
      if (result.success) {
        showSuccess('Fornecedor excluído com sucesso.');
        onClose();
      } else {
        showError(result.error || 'Erro inesperado.');
      }
    } catch {
      showError('Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
