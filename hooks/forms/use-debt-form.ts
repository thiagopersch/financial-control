'use client';

import { createDebt, deleteDebt, updateDebt } from '@/lib/actions/debts';
import type { DebtDTO } from '@/lib/queries/debts';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const createDebtSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    initialValue: z.coerce.number().positive('Valor inicial deve ser maior que zero'),
    currentValue: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? 0 : v),
      z.coerce.number().min(0, 'Valor atual deve ser maior ou igual a zero'),
    ),
    dueDay: z.coerce
      .number({ message: 'Dia do vencimento é obrigatório' })
      .min(1, 'Dia do vencimento deve ser maior que zero')
      .max(31, 'Dia do vencimento deve ser no máximo 31'),
    startDate: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? new Date().toISOString() : v),
      z.string(),
    ),
    installments: z.preprocess(
      (v) => (v === '' || v === undefined ? 1 : v),
      z.coerce
        .number()
        .int('Número de parcelas deve ser um número inteiro')
        .min(1, 'Número de parcelas é obrigatório'),
    ),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    categoryId: z.string().min(1, 'Categoria é obrigatória'),
    supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
    paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
    creditCardId: z.string().nullable().optional(),
    calculationType: z.string().min(1, 'Tipo de cálculo é obrigatório'),
    installmentValue: z.preprocess(
      (v) => (v === '' || v === undefined ? null : v),
      z.coerce.number().positive().nullable().optional(),
    ),
    firstInstallmentMonth: z.string().min(1, 'Primeira parcela é obrigatória'),
  })
  .refine(
    (data) => {
      if (data.calculationType === 'FIXED_INSTALLMENT') {
        return data.installmentValue != null && data.installmentValue > 0;
      }
      return true;
    },
    {
      message: 'Valor da parcela é obrigatório para cálculo de valor fixo',
      path: ['installmentValue'],
    },
  );

export const editDebtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  dueDay: z.string().min(1, { message: 'Dia do vencimento é obrigatório' }),
  installments: z.string().optional(),
  calculationType: z.string().optional(),
  installmentValue: z.string().optional(),
  firstInstallmentMonth: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  initialValue: z.union([z.string(), z.number()]).optional(),
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
    dueDay: 10,
    startDate: new Date().toISOString(),
    installments: 1,
    accountId: '',
    categoryId: '',
    supplierId: '',
    paymentMethodId: '',
    creditCardId: null,
    calculationType: 'TOTAL_DIVIDED',
    installmentValue: null,
    firstInstallmentMonth: 'NEXT',
  };

  const defaultValuesEdit: EditDebtFormValues = debt
    ? {
        name: debt.name,
        description: debt.description || '',
        dueDay: debt.dueDay?.toString() || '10',
        installments: debt.installments?.toString() || '',
        calculationType: debt.calculationType || 'TOTAL_DIVIDED',
        installmentValue: debt.installmentValue?.toString() || '',
        firstInstallmentMonth: debt.firstInstallmentMonth || 'NEXT',
        accountId: debt.accountId || '',
        categoryId: debt.categoryId || '',
        supplierId: debt.supplierId || '',
        paymentMethodId: debt.paymentMethodId || '',
        creditCardId: debt.creditCardId,
        initialValue: debt.initialValue?.toString() || '',
      }
    : {
        name: '',
        description: '',
        dueDay: '10',
        installments: '',
        calculationType: 'TOTAL_DIVIDED',
        installmentValue: '',
        firstInstallmentMonth: 'NEXT',
        accountId: '',
        categoryId: '',
        supplierId: '',
        paymentMethodId: '',
        creditCardId: null,
        initialValue: '',
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
        dueDay: values.dueDay ? parseInt(values.dueDay) : undefined,
        installments: values.installments ? parseInt(values.installments) : undefined,
        calculationType: values.calculationType,
        installmentValue: values.installmentValue ? parseFloat(values.installmentValue) : undefined,
        firstInstallmentMonth: values.firstInstallmentMonth,
        accountId: values.accountId,
        categoryId: values.categoryId,
        supplierId: values.supplierId,
        paymentMethodId: values.paymentMethodId,
        creditCardId: values.creditCardId,
        initialValue: values.initialValue ? parseFloat(String(values.initialValue)) : undefined,
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
