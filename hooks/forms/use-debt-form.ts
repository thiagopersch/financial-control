'use client';

import { createDebt, deleteDebt, updateDebt } from '@/lib/actions/debts';
import type { DebtDTO } from '@/lib/queries/debts';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z.coerce.number().positive('Valor inicial deve ser maior que zero'),
  currentValue: z.coerce.number().positive('Valor atual deve ser maior que zero'),
  interestRate: z.coerce.number().min(0).optional().nullable(),
  minimumPayment: z.coerce.number().positive('Pagamento mínimo é obrigatório'),
  dueDay: z.number().min(1).max(31).optional().nullable(),
  startDate: z.string(),
  installments: z.coerce.number().min(1).optional().nullable(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
});

export type DebtFormValues = z.infer<typeof debtSchema>;

export interface UseDebtFormOptions {
  debt?: DebtDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useDebtForm({ debt, onSuccess, onError }: UseDebtFormOptions = {}) {
  const isEditing = !!debt;

  const defaultValues: DebtFormValues = debt
    ? {
        name: debt.name,
        description: debt.description || '',
        initialValue: debt.initialValue,
        currentValue: debt.currentValue,
        interestRate: debt.interestRate,
        minimumPayment: debt.minimumPayment,
        dueDay: debt.dueDay,
        startDate: debt.startDate,
        installments: debt.installments,
        accountId: debt.accountId || '',
      }
    : {
        name: '',
        description: '',
        initialValue: 0,
        currentValue: 0,
        interestRate: null,
        minimumPayment: 0,
        dueDay: null,
        startDate: new Date().toISOString(),
        installments: null,
        accountId: '',
      };

  async function handleSubmit(values: DebtFormValues) {
    try {
      if (isEditing) {
        const result = await updateDebt(debt.id, values);
        if (result.success) {
          showSuccess('Dívida atualizada', 'A dívida foi atualizada com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar a dívida';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createDebt(values);
        if (result.success) {
          showSuccess('Dívida criada', 'A dívida foi criada com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar a dívida';
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
      const result = await deleteDebt(id);
      if (result.success) {
        showSuccess('Dívida excluída', 'A dívida foi excluída com sucesso');
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível excluir a dívida';
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
    schema: debtSchema,
    defaultValues,
    isEditing,
    handleSubmit,
    handleDelete,
  };
}
