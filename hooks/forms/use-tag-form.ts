'use client';

import { createTag, updateTag } from '@/lib/actions/tags';
import type { TagDTO } from '@/lib/queries/tags';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const tagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().optional().default('#6366f1'),
});

export type TagFormValues = z.infer<typeof tagSchema>;

interface UseTagFormOptions {
  tag?: TagDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useTagForm({ tag, onSuccess, onError }: UseTagFormOptions = {}) {
  const isEditing = !!tag;

  const defaultValues: TagFormValues = tag
    ? {
        name: tag.name,
        color: tag.color || '#6366f1',
      }
    : {
        name: '',
        color: '#6366f1',
      };

  async function handleSubmit(values: TagFormValues) {
    try {
      const result = tag ? await updateTag(tag.id, values) : await createTag(values);

      if (result.success) {
        showSuccess(
          tag ? 'Tag atualizada' : 'Tag criada',
          tag ? 'A tag foi atualizada com sucesso.' : 'A tag foi criada com sucesso.',
        );
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível salvar a tag';
        showError('Erro', error);
        onError?.(error);
        return { success: false, error };
      }
    } catch (_error) {
      const errorMessage = 'Ocorreu um erro inesperado';
      showError('Erro', errorMessage);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  return {
    schema: tagSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
