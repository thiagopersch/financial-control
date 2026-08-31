'use client';

import {
  createPermissionProfile,
  updatePermissionProfile,
} from '@/lib/actions/permission-profiles';
import { showError, showSuccess } from '@/lib/utils/toast';
import * as z from 'zod';

export const permissionProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão'),
});

export type PermissionProfileFormValues = z.infer<typeof permissionProfileSchema>;

export interface UsePermissionProfileFormOptions {
  profile?: { id: string } | null;
  onSuccess?: () => void;
}

export function usePermissionProfileForm({
  profile,
  onSuccess,
}: UsePermissionProfileFormOptions = {}) {
  const isEditing = !!profile;

  async function handleSubmit(values: PermissionProfileFormValues) {
    const result = isEditing
      ? await updatePermissionProfile(profile.id, values)
      : await createPermissionProfile(values);

    if (result.success) {
      showSuccess(isEditing ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!');
      onSuccess?.();
      return { success: true };
    }

    const error = result.error || 'Não foi possível salvar o perfil de permissão';
    showError(error);
    return { success: false, error };
  }

  return { isEditing, handleSubmit };
}
