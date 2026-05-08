'use client';

import { createDebt, deleteDebt, updateDebt } from '@/lib/actions/debts';
import type { DebtDTO } from '@/lib/queries/debts';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

const emptyStringToUndefined = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : Number(v);

export const createDebtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(0.01, 'Valor inicial deve ser maior que zero'),
  ),
  currentValue: z.preprocess(emptyStringToUndefined, z.number().optional()),
  interestRate: z.preprocess(emptyStringToUndefined, z.number().min(0).optional()),
  minimumPayment: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(0.01, 'Pagamento mínimo é obrigatório'),
  ),
  dueDay: z.coerce
    .number()
    .min(1, { message: 'Dia do vencimento deve ser maior que zero' })
    .max(31, { message: 'Dia do vencimento deve ser no máximo que 31' })
    .optional()
    .nullable(),
  startDate: z.string().optional(),
  installments: z.preprocess(emptyStringToUndefined, z.number().min(1).optional()),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  calculationType: z.string().optional(),
  installmentValue: z.preprocess(emptyStringToUndefined, z.number().positive().optional()),
  firstInstallmentMonth: z.string().optional(),
});

export const editDebtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  interestRate: z.string().optional(),
  dueDay: z
    .string()
    .min(1, { message: 'Dia do vencimento deve ser maior que zero' })
    .max(31, { message: 'Dia do vencimento deve ser no máximo que 31' })
    .optional(),
  installments: z.string().optional(),
  calculationType: z.string().optional(),
  installmentValue: z.string().optional(),
  firstInstallmentMonth: z.string().optional(),
});

export type CreateDebtFormValues = z.infer<typeof createDebtSchema>;
export type EditDebtFormValues = z.infer<typeof editDebtSchema>;

export interface UseDebtFormOptions {
  debt?: DebtDTO | null;
  refresh?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useDebtForm({ debt, refresh, onSuccess, onError }: UseDebtFormOptions = {}) {
  const isEditing = !!debt;

  const defaultValuesCreate: CreateDebtFormValues = {
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
    calculationType: 'TOTAL_DIVIDED',
    installmentValue: null,
    firstInstallmentMonth: 'NEXT',
  };

  const defaultValuesEdit: EditDebtFormValues = debt
    ? {
        name: debt.name,
        description: debt.description || '',
        interestRate: debt.interestRate?.toString() || '',
        dueDay: debt.dueDay?.toString() || '',
        installments: debt.installments?.toString() || '',
        calculationType: debt.calculationType || 'TOTAL_DIVIDED',
        installmentValue: debt.installmentValue?.toString() || '',
        firstInstallmentMonth: debt.firstInstallmentMonth || 'NEXT',
      }
    : {
        name: '',
        description: '',
        interestRate: '',
        dueDay: '',
        installments: '',
        calculationType: 'TOTAL_DIVIDED',
        installmentValue: '',
        firstInstallmentMonth: 'NEXT',
      };

  async function handleCreate(values: CreateDebtFormValues) {
    try {
      const result = await createDebt(values);
      if (result.success) {
        showSuccess('Dívida criada', 'A dívida foi criada com sucesso');
        refresh?.();
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível criar a dívida';
        showError('Erro ao criar', error);
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

  async function handleUpdate(values: EditDebtFormValues) {
    if (!debt) {
      const error = 'Dívida não encontrada';
      showError('Erro ao atualizar', error);
      onError?.(error);
      return { success: false, error };
    }

    try {
      const parsedValues = {
        name: values.name,
        description: values.description || undefined,
        interestRate: values.interestRate ? parseFloat(values.interestRate) : undefined,
        dueDay: values.dueDay ? parseInt(values.dueDay) : undefined,
        installments: values.installments ? parseInt(values.installments) : undefined,
        calculationType: values.calculationType,
        installmentValue: values.installmentValue ? parseFloat(values.installmentValue) : undefined,
        firstInstallmentMonth: values.firstInstallmentMonth,
      };

      const result = await updateDebt(debt.id, parsedValues);
      if (result.success) {
        showSuccess('Dívida atualizada', 'A dívida foi atualizada com sucesso');
        refresh?.();
        onSuccess?.();
        return { success: true };
      } else {
        const error = result.error || 'Não foi possível atualizar a dívida';
        showError('Erro ao atualizar', error);
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

  async function handleDelete(id: string) {
    try {
      const result = await deleteDebt(id);
      if (result.success) {
        showSuccess('Dívida excluída', 'A dívida foi excluída com sucesso');
        refresh?.();
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
    createSchema: createDebtSchema,
    editSchema: editDebtSchema,
    defaultValuesCreate,
    defaultValuesEdit,
    isEditing,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
