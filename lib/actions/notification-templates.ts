'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const notificationTemplateSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(NotificationType).default(NotificationType.SYSTEM),
    channel: z.enum(NotificationChannel).default(NotificationChannel.EMAIL),
    subject: z.string().optional().default(''),
    bodyHtml: z.string().optional().default(''),
    bodyWhatsapp: z.string().optional().default(''),
    imageUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine((data) => data.channel !== NotificationChannel.EMAIL || data.subject.length > 0, {
    message: 'Assunto é obrigatório',
    path: ['subject'],
  })
  .refine((data) => data.channel !== NotificationChannel.EMAIL || data.bodyHtml.length > 0, {
    message: 'Corpo do e-mail é obrigatório',
    path: ['bodyHtml'],
  })
  .refine((data) => data.channel !== NotificationChannel.WHATSAPP || data.bodyWhatsapp.length > 0, {
    message: 'Mensagem do WhatsApp é obrigatória',
    path: ['bodyWhatsapp'],
  });

export async function createNotificationTemplate(data: z.infer<typeof notificationTemplateSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = notificationTemplateSchema.parse(data);

    const template = await prisma.notificationTemplate.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });

    revalidatePath('/system-settings');
    return { success: true, data: template };
  } catch (error) {
    console.error('Error creating notification template:', error);
    return { success: false, error: 'Erro ao criar template de notificação' };
  }
}

export async function updateNotificationTemplate(
  id: string,
  data: Partial<z.infer<typeof notificationTemplateSchema>>,
) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const template = await prisma.notificationTemplate.update({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
      data,
    });

    revalidatePath('/system-settings');
    return { success: true, data: template };
  } catch (error) {
    console.error('Error updating notification template:', error);
    return { success: false, error: 'Erro ao atualizar template de notificação' };
  }
}

export async function deleteNotificationTemplate(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.notificationTemplate.delete({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });

    revalidatePath('/system-settings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return { success: false, error: 'Erro ao excluir template de notificação' };
  }
}

export async function toggleNotificationTemplate(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.notificationTemplate.update({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
      data: { isActive },
    });

    revalidatePath('/system-settings');
    return { success: true };
  } catch (error) {
    console.error('Error toggling notification template:', error);
    return { success: false, error: 'Erro ao atualizar template de notificação' };
  }
}
