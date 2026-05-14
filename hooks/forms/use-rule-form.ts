'use client';

import { createRule, updateRule } from '@/lib/actions/rules';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const ruleSchema = z.object({
  keyword: z.string().min(2, 'Palavra-chave deve ter pelo menos 2 caracteres'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
});

export type RuleFormValues = z.infer<typeof ruleSchema>;

export interface UseRuleFormOptions {
  rule?: any | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useRuleForm({ rule, onSuccess, onError }: UseRuleFormOptions = {}) {
  const isEditing = !!rule;

  const defaultValues: RuleFormValues = rule
    ? {
        keyword: rule.keyword,
        categoryId: rule.categoryId,
      }
    : {
        keyword: '',
        categoryId: '',
      };

  async function handleSubmit(values: RuleFormValues) {
    try {
      if (isEditing) {
        const result = await updateRule(rule.id, values);
        if (result.success) {
          showSuccess('Regra atualizada!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar a regra';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createRule(values);
        if (result.success) {
          showSuccess('Regra criada com sucesso!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar a regra';
          showError('Erro ao criar', error);
          onError?.(error);
          return { success: false, error };
        }
      }
    } catch {
      const errorMessage = 'Ocorreu um erro inesperado';
      showError('Erro', errorMessage);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  return {
    schema: ruleSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
