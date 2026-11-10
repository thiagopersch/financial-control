'use server';

import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';
import {
  type WorkspaceSettingsInput,
  workspaceSettingsSchema,
} from '@/lib/schemas/workspace-settings';
import { createAuditLog } from '@/lib/services/audit';
import { deliverNotification } from '@/lib/services/notification-delivery';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

export async function getWorkspaceNotificationSettings() {
  const session = await getSession();
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
      externalApiTimeoutMs: true,
    },
  });

  return workspace;
}

export async function updateWorkspaceNotificationSettings(data: WorkspaceSettingsInput) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Não autorizado' };
  if (!hasPermission(session.user.permissions, 'system-settings', 'UPDATE')) {
    return { success: false, error: 'Apenas administradores podem alterar estas configurações' };
  }

  try {
    const validated = workspaceSettingsSchema.parse(data);

    const previous = await prisma.workspace.update({
      where: { id: session.user.workspaceId },
      data: validated,
      select: { externalApiTimeoutMs: true, smtpHost: true, whatsappApiUrl: true },
    });

    // Auditoria sem segredos (senha SMTP/token do WhatsApp ficam de fora).
    await createAuditLog({
      action: 'UPDATE_WORKSPACE_SETTINGS',
      entity: 'Workspace',
      entityId: session.user.workspaceId,
      newValue: {
        smtpHost: previous.smtpHost,
        whatsappApiUrl: previous.whatsappApiUrl,
        externalApiTimeoutMs: previous.externalApiTimeoutMs,
      },
    });

    revalidatePath('/profiles');
    revalidatePath('/system-settings');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error updating workspace notification settings:', error);
    return { success: false, error: 'Erro ao salvar configurações' };
  }
}

export async function sendTestNotification(userId: string) {
  const session = await getSession();
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
