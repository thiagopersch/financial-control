'use client';

import { showError, showSuccess } from '@/lib/utils/toast';
import { useState } from 'react';

interface DeleteActionResult {
  success: boolean;
  error?: string;
}

interface UseDeleteConfirmOptions<TId> {
  successMessage: string;
  errorMessage: string;
  onSuccess?: (id: TId) => void;
}

export function useDeleteConfirm<TId = string>(
  deleteFn: (id: TId) => Promise<DeleteActionResult>,
  { successMessage, errorMessage, onSuccess }: UseDeleteConfirmOptions<TId>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<TId | null>(null);

  const requestDelete = (id: TId) => {
    setIdToDelete(id);
    setIsOpen(true);
  };

  const cancel = () => {
    setIsOpen(false);
    setIdToDelete(null);
  };

  const confirmDelete = async () => {
    if (idToDelete == null) return;
    const result = await deleteFn(idToDelete);
    if (result.success) {
      showSuccess(successMessage);
      onSuccess?.(idToDelete);
    } else {
      showError(result.error || errorMessage);
    }
    cancel();
  };

  return { isOpen, idToDelete, requestDelete, confirmDelete, cancel };
}
