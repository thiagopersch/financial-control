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
import { deleteTransaction } from '@/lib/actions/transactions';
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
      const result = await deleteTransaction(id);
      if (result.success) {
        showSuccess('Transação excluída com sucesso.');
        onClose();
      } else {
        showError(result.error || 'Erro ao excluir transação.');
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
            Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação.
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
