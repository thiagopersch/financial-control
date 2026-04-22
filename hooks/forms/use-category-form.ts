'use client';

import { createCategory, updateCategory } from '@/lib/actions/categories';
import type { CategoryDTO } from '@/lib/queries/categories';
import { showError, showSuccess } from '@/lib/utils/toast';
import { TransactionType } from '@prisma/client';
import * as z from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(TransactionType),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export interface UseCategoryFormOptions {
  category?: CategoryDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCategoryForm({ category, onSuccess, onError }: UseCategoryFormOptions = {}) {
  const isEditing = !!category;

  const defaultValues: CategoryFormValues = category
    ? {
        name: category.name,
        type: category.type,
        color: category.color || '#3b82f6',
      }
    : {
        name: '',
        type: TransactionType.INCOME,
        color: '#3b82f6',
      };

  async function handleSubmit(values: CategoryFormValues) {
    try {
      if (isEditing) {
        const result = await updateCategory(category.id, values);
        if (result.success) {
          showSuccess('Categoria atualizada', 'A categoria foi atualizada com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar a categoria';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createCategory(values);
        if (result.success) {
          showSuccess('Categoria criada', 'A categoria foi criada com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar a categoria';
          showError('Erro ao criar', error);
          onError?.(error);
          return { success: false, error };
        }
      }
    } catch (_error) {
      const errorMessage = 'Ocorreu um erro inesperado';
      showError('Erro', errorMessage);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  return {
    schema: categorySchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
