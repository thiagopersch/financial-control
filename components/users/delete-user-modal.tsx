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
import { deleteUser } from '@/lib/actions/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

export function DeleteUserModal({ isOpen, onClose, id }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function onConfirm() {
    setIsLoading(true);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        showSuccess('Usuário removido do workspace.');
        onClose();
      } else {
        showError(result.error || 'Erro ao remover usuário.');
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
            Essa ação removerá permanentemente o usuário do workspace. Ele perderá acesso
            imediatamente.
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
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
