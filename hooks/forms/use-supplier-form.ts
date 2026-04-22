'use client';

import { createSupplier, updateSupplier } from '@/lib/actions/suppliers';
import type { SupplierDTO } from '@/lib/queries/suppliers';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export interface UseSupplierFormOptions {
  supplier?: SupplierDTO | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useSupplierForm({ supplier, onSuccess, onError }: UseSupplierFormOptions = {}) {
  const isEditing = !!supplier;

  const defaultValues: SupplierFormValues = supplier
    ? {
        name: supplier.name,
        document: supplier.document || null,
        contact: supplier.contact || null,
        address: supplier.address || null,
      }
    : {
        name: '',
        document: null,
        contact: null,
        address: null,
      };

  async function handleSubmit(values: SupplierFormValues) {
    try {
      if (isEditing) {
        const result = await updateSupplier(supplier.id, values);
        if (result.success) {
          showSuccess('Fornecedor atualizado', 'O fornecedor foi atualizado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar o fornecedor';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createSupplier(values);
        if (result.success) {
          showSuccess('Fornecedor criado', 'O fornecedor foi criado com sucesso');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar o fornecedor';
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
    schema: supplierSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
