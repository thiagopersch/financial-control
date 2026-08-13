'use client';

import { useState } from 'react';

export function useCrudDialogState<T>() {
  const [selected, setSelected] = useState<T | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: T) => {
    setSelected(item);
    setIsFormOpen(true);
  };

  const close = () => setIsFormOpen(false);

  return { selected, isFormOpen, openCreate, openEdit, close };
}
