'use server';

import { authOptions } from '@/lib/auth-options';
import { getFirstAllowedRoute } from '@/lib/permissions/first-allowed-route';
import { loadPermissionsForUser } from '@/lib/permissions/load-permissions';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { passwordSchema, resetPasswordSchema } from '@/lib/validations/password';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const profileSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    bio: z.string().max(300, 'Bio deve ter no máximo 300 caracteres').optional().nullable(),
    phone: z.string().optional().nullable(),
    notifyEmail: z.boolean().default(false),
    notifyWhatsapp: z.boolean().default(false),
  })
  .refine((data) => !data.notifyWhatsapp || !!data.phone, {
    message: 'Informe um telefone para receber notificações via WhatsApp',
    path: ['phone'],
  });

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = profileSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validated.name },
    });

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bio: validated.bio,
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
      update: {
        bio: validated.bio,
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
    });

    revalidatePath('/profiles');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    return { success: false, error: 'Erro ao atualizar perfil' };
  }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, error: 'Usuário não encontrado' };

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) return { success: false, error: 'Senha atual incorreta' };

  const parsed = passwordSchema().safeParse(data.newPassword);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Senha inválida' };
  }

  const hashed = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return { success: true };
}

/**
 * Conclui a redefinição obrigatória (senha provisória/temporária). O usuário é sempre
 * o da sessão; devolve a primeira página que ele pode visualizar para o redirecionamento.
 */
export async function completeForcedPasswordReset(data: {
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false as const, error: 'Sessão inválida' };

    const parsed = resetPasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, mustChangePassword: true, isActive: true },
    });
    if (!user || !user.isActive) return { success: false as const, error: 'Sessão inválida' };
    if (!user.mustChangePassword) {
      return { success: false as const, error: 'Não há redefinição de senha pendente' };
    }

    if (await bcrypt.compare(parsed.data.newPassword, user.password)) {
      return {
        success: false as const,
        error: 'A nova senha deve ser diferente da senha provisória',
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(parsed.data.newPassword, 10),
        mustChangePassword: false,
      },
    });

    await createAuditLog({ action: 'COMPLETE_PASSWORD_RESET', entity: 'User', entityId: user.id });

    const { permissions } = await loadPermissionsForUser(user.id);
    return { success: true as const, redirectTo: getFirstAllowedRoute(permissions) };
  } catch (error) {
    console.error('Error completing forced password reset:', error);
    return { success: false as const, error: 'Erro ao redefinir a senha' };
  }
}
