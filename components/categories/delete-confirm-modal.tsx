"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteCategory } from "@/lib/actions/categories";
import { toast } from "sonner";

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
      const result = await deleteCategory(id);
      if (result.success) {
        toast.success("Categoria excluída com sucesso.");
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro inesperado.");
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
            Essa ação não pode ser desfeita. Isso excluirá permanentemente a categoria
            e todas as transações vinculadas a ela.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
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
