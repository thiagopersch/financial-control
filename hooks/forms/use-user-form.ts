'use client';

import { createUser, updateUser } from '@/lib/actions/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import { passwordSchema } from '@/lib/validations/password';
import * as z from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: passwordSchema(),
  permissionProfileId: z.string().min(1, 'Selecione um perfil de permissão'),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    permissionProfileId: z.string().min(1, 'Selecione um perfil de permissão'),
    phone: z.string().optional().nullable(),
    notifyEmail: z.boolean().default(false),
    notifyWhatsapp: z.boolean().default(false),
    isActive: z.boolean(),
    mustChangePassword: z.boolean(),
  })
  .refine((data) => !data.notifyWhatsapp || !!data.phone, {
    message: 'Informe um telefone para ativar notificações via WhatsApp',
    path: ['phone'],
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
        permissionProfileId: user.permissionProfileId || '',
        phone: user.profile?.phone || '',
        notifyEmail: user.profile?.notifyEmail || false,
        notifyWhatsapp: user.profile?.notifyWhatsapp || false,
        isActive: user.isActive ?? true,
        mustChangePassword: user.mustChangePassword ?? false,
      }
    : {
        name: '',
        email: '',
        password: '',
        permissionProfileId: '',
        isActive: true,
        // Senha definida pelo admin é provisória: por padrão o usuário troca no 1º acesso.
        mustChangePassword: true,
      };

  async function handleSubmit(values: any) {
    try {
      if (isEditing) {
        const result = await updateUser(user.id, {
          name: values.name,
          permissionProfileId: values.permissionProfileId,
          phone: values.phone,
          notifyEmail: values.notifyEmail,
          notifyWhatsapp: values.notifyWhatsapp,
          isActive: values.isActive,
          mustChangePassword: values.mustChangePassword,
        });
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
