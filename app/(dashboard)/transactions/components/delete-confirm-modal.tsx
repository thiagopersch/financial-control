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
import { Checkbox } from '@/components/ui/checkbox';
import { deleteTransaction } from '@/lib/actions/transactions';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  isRecurring?: boolean;
  hasDebt?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  id,
  isRecurring = false,
  hasDebt = false,
}: DeleteConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteSeries, setDeleteSeries] = useState(false);

  const handleClose = () => {
    setDeleteSeries(false);
    onClose();
  };

  async function onConfirm() {
    setIsLoading(true);
    try {
      const result = await deleteTransaction(id, isRecurring && deleteSeries);
      if (result.success) {
        showSuccess(
          'deletedCount' in result && result.deletedCount
            ? `${result.deletedCount} transações recorrentes excluídas com sucesso.`
            : 'Transação excluída com sucesso.',
        );
        handleClose();
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
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isRecurring && (
          <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
            <Checkbox
              checked={deleteSeries}
              onCheckedChange={(checked) => setDeleteSeries(checked === true)}
            />
            <span>
              Esta é uma transação recorrente. Excluir também todas as outras transações desta
              recorrência?
              {hasDebt && ' O valor da dívida vinculada será atualizado automaticamente.'}
            </span>
          </label>
        )}
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
