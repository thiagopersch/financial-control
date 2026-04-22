'use client';

import { createGoal, deleteGoal, updateGoal } from '@/lib/actions/goals';
import type { GoalDTO } from '@/lib/queries/goals';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  targetAmount: z.coerce.number().positive('Valor alvo deve ser maior que zero'),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.coerce.date().nullable().optional(),
  color: z.string().optional().default('#0ea5e9'),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

export interface UseGoalFormOptions {
  goal?: GoalDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useGoalForm({ goal, onSuccess, onError }: UseGoalFormOptions = {}) {
  const isEditing = !!goal;

  const defaultValues: GoalFormValues = goal
    ? {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline ? new Date(goal.deadline) : null,
        color: goal.color || '#0ea5e9',
      }
    : {
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        deadline: null,
        color: '#0ea5e9',
      };

  async function handleSubmit(values: GoalFormValues) {
    try {
      if (isEditing) {
        const result = await updateGoal(goal.id, values);
        if (result.success) {
          showSuccess('Meta atualizada', 'A meta foi atualizada com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar a meta';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createGoal(values);
        if (result.success) {
          showSuccess('Meta criada', 'A meta foi criada com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar a meta';
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
      const result = await deleteGoal(id);
      if (result.success) {
        showSuccess('Meta excluída', 'A meta foi excluída com sucesso');
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível excluir a meta';
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
    schema: goalSchema,
    defaultValues,
    isEditing,
    handleSubmit,
    handleDelete,
  };
}
