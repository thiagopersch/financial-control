'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { assertKeepsSystemProfileUser } from '@/lib/services/permission-profiles';
import { generateTemporaryPassword } from '@/lib/utils/password-generator';
import { passwordSchema } from '@/lib/validations/password';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.email('E-mail inválido'),
  password: passwordSchema(),
  permissionProfileId: z.string().min(1, 'Selecione um perfil de permissão'),
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean().default(true),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    permissionProfileId: z.string().min(1, 'Selecione um perfil de permissão'),
    phone: z.string().optional().nullable(),
    notifyEmail: z.boolean().default(false),
    notifyWhatsapp: z.boolean().default(false),
    isActive: z.boolean().default(true),
    mustChangePassword: z.boolean().default(false),
  })
  .refine((data) => !data.notifyWhatsapp || !!data.phone, {
    message: 'Informe um telefone para ativar notificações via WhatsApp',
    path: ['phone'],
  });

/**
 * Travas de desativação: ninguém desativa a própria conta e o workspace precisa manter
 * ao menos um usuário ativo com perfil de sistema (admin).
 */
async function assertCanDeactivate(workspaceId: string, sessionUserId: string, userId: string) {
  if (userId === sessionUserId) throw new Error('Você não pode desativar sua própria conta');
  await assertKeepsSystemProfileUser(prisma, workspaceId, userId, null);
}

/** Só um admin (perfil de sistema) pode mexer na senha/acesso de outro admin. */
async function assertCanManageCredentials(
  workspaceId: string,
  sessionProfileId: string | null,
  userId: string,
) {
  const [caller, target] = await Promise.all([
    sessionProfileId
      ? prisma.permissionProfile.findFirst({
          where: { id: sessionProfileId, workspaceId },
          select: { isSystem: true },
        })
      : null,
    prisma.user.findFirst({
      where: { id: userId, workspaceId },
      select: { permissionProfile: { select: { isSystem: true } } },
    }),
  ]);
  if (!target) throw new Error('Usuário não encontrado');
  if (target.permissionProfile.isSystem && !caller?.isSystem) {
    throw new Error('Apenas administradores podem alterar o acesso de outro administrador');
  }
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    const session = await requirePermission('users', 'CREATE');
    const validated = createUserSchema.parse(data);

    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) return { success: false, error: 'Já existe um usuário com este e-mail' };

    const profile = await prisma.permissionProfile.findFirst({
      where: { id: validated.permissionProfileId, workspaceId: session.user.workspaceId },
    });
    if (!profile) return { success: false, error: 'Perfil de permissão inválido' };

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        permissionProfileId: validated.permissionProfileId,
        workspaceId: session.user.workspaceId,
        isActive: validated.isActive,
        mustChangePassword: validated.mustChangePassword,
      },
      select: { id: true, name: true, email: true },
    });

    await prisma.profile.create({ data: { userId: user.id } });

    await createAuditLog({
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      newValue: {
        name: user.name,
        email: user.email,
        permissionProfileId: validated.permissionProfileId,
        isActive: validated.isActive,
        mustChangePassword: validated.mustChangePassword,
      },
    });

    revalidatePath('/users');
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar usuário',
    };
  }
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  try {
    const session = await requirePermission('users', 'UPDATE');
    const validated = updateUserSchema.parse(data);

    const profile = await prisma.permissionProfile.findFirst({
      where: { id: validated.permissionProfileId, workspaceId: session.user.workspaceId },
    });
    if (!profile) return { success: false, error: 'Perfil de permissão inválido' };

    const current = await prisma.user.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
      select: { isActive: true, mustChangePassword: true, permissionProfileId: true },
    });
    if (!current) return { success: false, error: 'Usuário não encontrado' };

    await assertKeepsSystemProfileUser(
      prisma,
      session.user.workspaceId,
      id,
      validated.permissionProfileId,
    );

    if (current.isActive && !validated.isActive) {
      await assertCanDeactivate(session.user.workspaceId, session.user.id, id);
    }

    const accessChanged =
      current.isActive !== validated.isActive ||
      current.mustChangePassword !== validated.mustChangePassword;
    if (accessChanged) {
      if (id === session.user.id && validated.mustChangePassword) {
        return { success: false, error: 'Você não pode forçar a redefinição da sua própria senha' };
      }
      await assertCanManageCredentials(
        session.user.workspaceId,
        session.user.permissionProfileId,
        id,
      );
    }

    const user = await prisma.user.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: {
        name: validated.name,
        permissionProfileId: validated.permissionProfileId,
        isActive: validated.isActive,
        mustChangePassword: validated.mustChangePassword,
      },
      select: { id: true, name: true },
    });

    await createAuditLog({
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      oldValue: current,
      newValue: {
        permissionProfileId: validated.permissionProfileId,
        isActive: validated.isActive,
        mustChangePassword: validated.mustChangePassword,
      },
    });

    await prisma.profile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
      update: {
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
    });

    revalidatePath('/users');
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
    };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await requirePermission('users', 'DELETE');

    if (id === session.user.id)
      return { success: false, error: 'Você não pode excluir sua própria conta' };

    await assertKeepsSystemProfileUser(prisma, session.user.workspaceId, id, null);

    await prisma.user.delete({ where: { id, workspaceId: session.user.workspaceId } });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir usuário',
    };
  }
}

/**
 * Ativa/desativa um usuário. Inativos não conseguem logar (nem manter a sessão),
 * não aparecem no "Pago por" de novas transações e não contam como admin do workspace.
 */
export async function toggleUserActive(id: string, isActive: boolean) {
  try {
    const session = await requirePermission('users', 'UPDATE');
    const validated = z.object({ id: z.string().min(1), isActive: z.boolean() }).parse({
      id,
      isActive,
    });

    if (!validated.isActive) {
      await assertCanDeactivate(session.user.workspaceId, session.user.id, validated.id);
    }

    const user = await prisma.user.update({
      where: { id: validated.id, workspaceId: session.user.workspaceId },
      data: { isActive: validated.isActive },
      select: { id: true, isActive: true },
    });

    await createAuditLog({
      action: validated.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entity: 'User',
      entityId: validated.id,
      newValue: { isActive: user.isActive },
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Error toggling user active state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
    };
  }
}

/**
 * Gera uma senha temporária (seguindo a regra de senha) e obriga o usuário a redefini-la
 * no próximo acesso. A senha é devolvida uma única vez para o admin repassar.
 */
export async function resetUserPassword(id: string) {
  try {
    const session = await requirePermission('users', 'UPDATE');
    const userId = z.string().min(1).parse(id);

    if (userId === session.user.id) {
      return {
        success: false as const,
        error: 'Use a página de perfil para alterar a sua própria senha',
      };
    }

    await assertCanManageCredentials(
      session.user.workspaceId,
      session.user.permissionProfileId,
      userId,
    );

    const temporaryPassword = generateTemporaryPassword();
    await prisma.user.update({
      where: { id: userId, workspaceId: session.user.workspaceId },
      data: { password: await bcrypt.hash(temporaryPassword, 10), mustChangePassword: true },
      select: { id: true },
    });

    await createAuditLog({ action: 'RESET_USER_PASSWORD', entity: 'User', entityId: userId });

    revalidatePath('/users');
    return { success: true as const, temporaryPassword };
  } catch (error) {
    console.error('Error resetting user password:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Erro ao gerar senha temporária',
    };
  }
}
