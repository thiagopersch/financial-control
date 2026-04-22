'use client';

import { createAccount, updateAccount } from '@/lib/actions/accounts';
import type { AccountDTO } from '@/lib/queries/accounts';
import { showError, showSuccess } from '@/lib/utils/toast';
import { AccountType } from '@prisma/client';
import * as z from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(AccountType),
  color: z.string().default('#000000'),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export interface UseAccountFormOptions {
  account?: AccountDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useAccountForm({ account, onSuccess, onError }: UseAccountFormOptions = {}) {
  const isEditing = !!account;

  const defaultValues: AccountFormValues = account
    ? {
        name: account.name,
        type: account.type as AccountType,
        color: account.color || '#000000',
      }
    : {
        name: '',
        type: AccountType.BANK,
        color: '#000000',
      };

  async function handleSubmit(values: AccountFormValues) {
    try {
      if (isEditing) {
        const result = await updateAccount(account.id, values);
        if (result.success) {
          showSuccess('Conta atualizada', 'A conta foi atualizada com sucesso!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar a conta!';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createAccount(values);
        if (result.success) {
          showSuccess('Conta criada', 'A conta foi criada com sucesso!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar a conta!';
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
    schema: accountSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
