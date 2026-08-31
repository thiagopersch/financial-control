'use server';

import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';
import { deliverNotification } from '@/lib/services/notification-delivery';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const notificationSettingsSchema = z.object({
  whatsappApiUrl: z.string().optional().nullable(),
  whatsappApiToken: z.string().optional().nullable(),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.coerce.number().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  smtpFrom: z.string().optional().nullable(),
});

export async function getWorkspaceNotificationSettings() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: {
      whatsappApiUrl: true,
      whatsappApiToken: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPassword: true,
      smtpFrom: true,
    },
  });

  return workspace;
}

export async function updateWorkspaceNotificationSettings(
  data: z.infer<typeof notificationSettingsSchema>,
) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };
  if (!hasPermission(session.user.permissions, 'system-settings', 'UPDATE')) {
    return { success: false, error: 'Apenas administradores podem alterar estas configurações' };
  }

  try {
    const validated = notificationSettingsSchema.parse(data);

    await prisma.workspace.update({
      where: { id: session.user.workspaceId },
      data: validated,
    });

    revalidatePath('/profiles');
    revalidatePath('/system-settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating workspace notification settings:', error);
    return { success: false, error: 'Erro ao salvar configurações' };
  }
}

export async function sendTestNotification(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };
  if (!hasPermission(session.user.permissions, 'system-settings', 'UPDATE')) {
    return { success: false, error: 'Apenas administradores podem enviar notificações de teste' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, workspaceId: session.user.workspaceId },
    include: { profile: true },
  });

  if (!user) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  if (!user.profile?.notifyEmail && !user.profile?.notifyWhatsapp) {
    return {
      success: false,
      error: `${user.name} não está marcado para receber notificações por e-mail ou WhatsApp.`,
    };
  }

  await deliverNotification({
    userId: user.id,
    workspaceId: session.user.workspaceId,
    type: 'SYSTEM',
    title: 'Notificação de teste',
    message: 'Esta é uma mensagem de teste da integração de notificações.',
  });

  const channels = [
    user.profile.notifyEmail && 'e-mail',
    user.profile.notifyWhatsapp && 'WhatsApp',
  ].filter(Boolean);

  return {
    success: true,
    message: `Notificação de teste enviada para ${user.name} (${channels.join(' e ')}).`,
  };
}
