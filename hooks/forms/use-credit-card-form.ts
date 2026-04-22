'use client';

import { createCreditCard, updateCreditCard } from '@/lib/actions/credit-cards';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const creditCardSchema = z.object({
  limit: z.coerce.number().positive('Limite deve ser maior que zero'),
  initialBalance: z.coerce.number().default(0),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  accountId: z.string().min(1, 'Conta vinculada é obrigatória'),
  color: z.string().optional().default('#6366f1'),
});

export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export interface UseCreditCardFormOptions {
  creditCard?: CreditCardDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCreditCardForm({
  creditCard,
  onSuccess,
  onError,
}: UseCreditCardFormOptions = {}) {
  const isEditing = !!creditCard;

  const defaultValues: CreditCardFormValues = creditCard
    ? {
        limit: creditCard.limit,
        initialBalance: creditCard.initialBalance,
        closingDay: creditCard.closingDay,
        dueDay: creditCard.dueDay,
        accountId: creditCard.accountId,
        color: creditCard.color || '#6366f1',
      }
    : {
        limit: 0,
        initialBalance: 0,
        closingDay: 15,
        dueDay: 25,
        accountId: '',
        color: '#6366f1',
      };

  async function handleSubmit(values: CreditCardFormValues) {
    try {
      if (isEditing) {
        const result = await updateCreditCard(creditCard.accountId, values);
        if (result.success) {
          showSuccess('Cartão atualizado', 'O cartão foi atualizado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar o cartão';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createCreditCard(values);
        if (result.success) {
          showSuccess('Cartão criado', 'O cartão foi criado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar o cartão';
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
    schema: creditCardSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
