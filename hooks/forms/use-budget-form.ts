'use client';

import { deleteBudget, upsertBudget } from '@/lib/actions/budgets';
import type { BudgetDTO } from '@/lib/queries/budgets';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  alertAt80: z.boolean().optional().default(true),
  alertAt100: z.boolean().optional().default(true),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

export interface UseBudgetFormOptions {
  budget?: BudgetDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useBudgetForm({ budget, onSuccess, onError }: UseBudgetFormOptions = {}) {
  const isEditing = !!budget;

  const defaultValues: BudgetFormValues = budget
    ? {
        categoryId: budget.categoryId,
        amount: budget.amount,
        month: budget.month,
        year: budget.year,
        alertAt80: budget.alertAt80,
        alertAt100: budget.alertAt100,
      }
    : {
        categoryId: '',
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        alertAt80: true,
        alertAt100: true,
      };

  async function handleSubmit(values: BudgetFormValues) {
    try {
      if (isEditing) {
        const result = await upsertBudget({ ...values, id: budget.id });
        if (result.success) {
          showSuccess('Orçamento atualizado', 'O orçamento foi atualizado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar o orçamento';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await upsertBudget(values);
        if (result.success) {
          showSuccess('Orçamento criado', 'O orçamento foi criado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar o orçamento';
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
      const result = await deleteBudget(id);
      if (result.success) {
        showSuccess('Orçamento excluído', 'O orçamento foi excluído com sucesso');
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível excluir o orçamento';
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
    schema: budgetSchema,
    defaultValues,
    isEditing,
    handleSubmit,
    handleDelete,
  };
}
