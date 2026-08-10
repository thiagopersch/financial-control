'use client';

import { createPaymentMethod, updatePaymentMethod } from '@/lib/actions/payment-methods';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().default('#6366f1'),
  isCreditCard: z.boolean().default(false),
  accountIds: z.array(z.string()).default([]),
});

export type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

export interface UsePaymentMethodFormOptions {
  paymentMethod?: PaymentMethodDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePaymentMethodForm({
  paymentMethod,
  onSuccess,
  onError,
}: UsePaymentMethodFormOptions = {}) {
  const isEditing = !!paymentMethod;

  const defaultValues: PaymentMethodFormValues = paymentMethod
    ? {
        name: paymentMethod.name,
        color: paymentMethod.color || '#6366f1',
        isCreditCard: paymentMethod.isCreditCard,
        accountIds: paymentMethod.accountIds,
      }
    : {
        name: '',
        color: '#6366f1',
        isCreditCard: false,
        accountIds: [],
      };

  async function handleSubmit(values: PaymentMethodFormValues) {
    try {
      if (isEditing) {
        const result = await updatePaymentMethod(paymentMethod.id, values);
        if (result.success) {
          showSuccess('Meio de pagamento atualizado', 'Atualizado com sucesso!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar o meio de pagamento!';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createPaymentMethod(values);
        if (result.success) {
          showSuccess('Meio de pagamento criado', 'Criado com sucesso!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar o meio de pagamento!';
          showError('Erro ao criar', error);
          onError?.(error);
          return { success: false, error };
        }
      }
    } catch {
      const errorMessage = 'Ocorreu um erro inesperado!';
      showError('Erro', errorMessage);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  return {
    schema: paymentMethodSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
