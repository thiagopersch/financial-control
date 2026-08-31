'use server';

import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions/require-permission';
import { createAuditLog } from '@/lib/services/audit';
import { assertPermissionProfileDeletable } from '@/lib/services/permission-profiles';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

export const permissionProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão'),
});

export type PermissionProfileFormValues = z.infer<typeof permissionProfileSchema>;

export async function createPermissionProfile(data: PermissionProfileFormValues) {
  try {
    const session = await requirePermission('permission-profiles', 'CREATE');
    const validated = permissionProfileSchema.parse(data);

    const existing = await prisma.permissionProfile.findUnique({
      where: { workspaceId_name: { workspaceId: session.user.workspaceId, name: validated.name } },
    });
    if (existing) return { success: false, error: 'Já existe um perfil com este nome' };

    const profile = await prisma.permissionProfile.create({
      data: {
        name: validated.name,
        description: validated.description,
        workspaceId: session.user.workspaceId,
        permissions: {
          create: validated.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
    });

    await createAuditLog({
      action: 'CREATE_PERMISSION_PROFILE',
      entity: 'PermissionProfile',
      entityId: profile.id,
      newValue: { name: validated.name, description: validated.description },
    });

    revalidatePath('/permission-profiles');
    return { success: true, data: profile };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error creating permission profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar perfil de permissão',
    };
  }
}

export async function updatePermissionProfile(id: string, data: PermissionProfileFormValues) {
  try {
    const session = await requirePermission('permission-profiles', 'UPDATE');
    const validated = permissionProfileSchema.parse(data);

    const current = await prisma.permissionProfile.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!current) return { success: false, error: 'Perfil de permissão não encontrado' };

    const profile = await prisma.$transaction(async (tx) => {
      await tx.permissionProfilePermission.deleteMany({ where: { permissionProfileId: id } });
      return tx.permissionProfile.update({
        where: { id },
        data: {
          name: current.isSystem ? current.name : validated.name,
          description: validated.description,
          permissions: {
            create: validated.permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
      });
    });

    await createAuditLog({
      action: 'UPDATE_PERMISSION_PROFILE',
      entity: 'PermissionProfile',
      entityId: profile.id,
      oldValue: { name: current.name, description: current.description },
      newValue: { name: profile.name, description: profile.description },
    });

    revalidatePath('/permission-profiles');
    return { success: true, data: profile };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error updating permission profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar perfil de permissão',
    };
  }
}

export async function deletePermissionProfile(id: string) {
  try {
    const session = await requirePermission('permission-profiles', 'DELETE');

    const profile = await prisma.permissionProfile.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!profile) return { success: false, error: 'Perfil de permissão não encontrado' };

    await assertPermissionProfileDeletable(prisma, id);

    await prisma.permissionProfile.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_PERMISSION_PROFILE',
      entity: 'PermissionProfile',
      entityId: id,
      oldValue: { name: profile.name },
    });

    revalidatePath('/permission-profiles');
    return { success: true };
  } catch (error) {
    console.error('Error deleting permission profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir perfil de permissão',
    };
  }
}
