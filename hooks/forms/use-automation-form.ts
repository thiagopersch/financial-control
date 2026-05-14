'use client';

import { createConditionalRule, updateConditionalRule } from '@/lib/actions/conditional-rules';
import type { ConditionalRule } from '@/lib/queries/automation';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const automationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  conditionType: z.string().min(1, 'Selecione uma condição'),
  conditionValue: z.string().min(1, 'Valor da condição é obrigatório'),
  actionType: z.string().min(1, 'Selecione uma ação'),
  actionValue: z.string().min(1, 'Parâmetro da ação é obrigatório'),
});

export type AutomationFormValues = z.infer<typeof automationSchema>;

export interface UseAutomationFormOptions {
  rule?: ConditionalRule | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useAutomationForm({ rule, onSuccess, onError }: UseAutomationFormOptions = {}) {
  const isEditing = !!rule;

  const defaultValues: AutomationFormValues = rule
    ? {
        name: rule.name,
        description: rule.description || '',
        conditionType: Array.isArray(rule.conditions) ? rule.conditions[0]?.type || '' : '',
        conditionValue: Array.isArray(rule.conditions)
          ? String(rule.conditions[0]?.value || '')
          : '',
        actionType: Array.isArray(rule.actions) ? rule.actions[0]?.type || '' : '',
        actionValue: Array.isArray(rule.actions) ? String(rule.actions[0]?.value || '') : '',
      }
    : {
        name: '',
        description: '',
        conditionType: '',
        conditionValue: '',
        actionType: '',
        actionValue: '',
      };

  async function handleSubmit(values: AutomationFormValues) {
    try {
      const conditions = [{ type: values.conditionType, value: values.conditionValue }];
      const actions = [{ type: values.actionType, value: values.actionValue }];

      if (isEditing && rule) {
        const result = await updateConditionalRule(rule.id, {
          name: values.name,
          description: values.description || undefined,
          conditions,
          actions,
          priority: 0,
          isActive: rule.isActive,
        });
        if (result.success) {
          showSuccess('Regra atualizada', 'A regra foi atualizada com sucesso!');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar a regra';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createConditionalRule({
          name: values.name,
          description: values.description || undefined,
          conditions,
          actions,
          priority: 0,
          isActive: true,
        });
        if (result.success) {
          showSuccess('Regra criada', 'A regra foi criada com sucesso!');
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
    schema: automationSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
