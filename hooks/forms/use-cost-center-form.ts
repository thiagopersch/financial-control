'use client';

import { createCostCenter, deleteCostCenter, updateCostCenter } from '@/lib/actions/cost-centers';
import type { CostCenterDTO } from '@/lib/queries/cost-centers';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const costCenterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

export type CostCenterFormValues = z.infer<typeof costCenterSchema>;

export interface UseCostCenterFormOptions {
  costCenter?: CostCenterDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCostCenterForm({
  costCenter,
  onSuccess,
  onError,
}: UseCostCenterFormOptions = {}) {
  const isEditing = !!costCenter;

  const defaultValues: CostCenterFormValues = costCenter
    ? {
        name: costCenter.name,
        description: costCenter.description || '',
      }
    : {
        name: '',
        description: '',
      };

  async function handleSubmit(values: CostCenterFormValues) {
    try {
      if (isEditing) {
        const result = await updateCostCenter(costCenter.id, values);
        if (result.success) {
          showSuccess('Centro de custo atualizado', 'O centro de custo foi atualizado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar o centro de custo';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createCostCenter(values);
        if (result.success) {
          showSuccess('Centro de custo criado', 'O centro de custo foi criado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar o centro de custo';
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

  async function handleDelete(id: string) {
    try {
      const result = await deleteCostCenter(id);
      if (result.success) {
        showSuccess('Centro de custo excluído', 'O centro de custo foi excluído com sucesso');
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível excluir o centro de custo';
        showError('Erro ao excluir', error);
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
    schema: costCenterSchema,
    defaultValues,
    isEditing,
    handleSubmit,
    handleDelete,
  };
}
