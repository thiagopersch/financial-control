'use client';

import { createUser, updateUser } from '@/lib/actions/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Role } from '@prisma/client';
import * as z from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(Role),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export interface UseUserFormOptions {
  user?: any | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useUserForm({ user, onSuccess, onError }: UseUserFormOptions = {}) {
  const isEditing = !!user;

  const defaultValues = isEditing
    ? {
        name: user.name,
        role: user.role as Role,
      }
    : {
        name: '',
        email: '',
        password: '',
        role: Role.VIEWER as Role,
      };

  async function handleSubmit(values: any) {
    try {
      if (isEditing) {
        const result = await updateUser(user.id, { name: values.name, role: values.role });
        if (result.success) {
          showSuccess('Usuário atualizado!', 'O usuário foi atualizado.');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível atualizar o usuário';
          showError('Erro ao atualizar', error);
          onError?.(error);
          return { success: false, error };
        }
      } else {
        const result = await createUser(values);
        if (result.success) {
          showSuccess('Usuário criado com sucesso!', 'O usuário foi criado.');
          onSuccess?.();
          return { success: true };
        } else {
          const error = result.error || 'Não foi possível criar o usuário';
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
    schema: isEditing ? updateUserSchema : createUserSchema,
    defaultValues,
    isEditing,
    handleSubmit,
  };
}
