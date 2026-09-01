'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { blockTreeSchema } from '@/lib/notification-templates/block-schema';

const notificationTemplateSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(NotificationType).default(NotificationType.SYSTEM),
    channel: z.enum(NotificationChannel).default(NotificationChannel.EMAIL),
    subject: z.string().optional().default(''),
    bodyHtml: z.string().optional().default(''),
    bodyWhatsapp: z.string().optional().default(''),
    content: blockTreeSchema.nullable().optional().default(null),
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

export type NotificationTemplateFormValues = z.infer<typeof notificationTemplateSchema>;

export async function createNotificationTemplate(data: NotificationTemplateFormValues) {
  try {
    const session = await requirePermission('notification-templates', 'CREATE');
    const validated = notificationTemplateSchema.parse(data);

    const template = await prisma.notificationTemplate.create({
      data: {
        ...validated,
        content: validated.content ?? undefined,
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    });

    await createAuditLog({
      action: 'CREATE_NOTIFICATION_TEMPLATE',
      entity: 'NotificationTemplate',
      entityId: template.id,
      newValue: template,
    });

    revalidatePath('/notification-templates');
    return { success: true, data: template };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error creating notification template:', error);
    return { success: false, error: 'Erro ao criar template de notificação' };
  }
}

export async function updateNotificationTemplate(
  id: string,
  data: Partial<NotificationTemplateFormValues>,
) {
  try {
    const session = await requirePermission('notification-templates', 'UPDATE');

    const current = await prisma.notificationTemplate.findFirst({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });
    if (!current) return { success: false, error: 'Template não encontrado' };

    const template = await prisma.notificationTemplate.update({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
      data: {
        ...data,
        content: data.content === undefined ? undefined : (data.content ?? undefined),
      },
    });

    await createAuditLog({
      action: 'UPDATE_NOTIFICATION_TEMPLATE',
      entity: 'NotificationTemplate',
      entityId: template.id,
      oldValue: current,
      newValue: template,
    });

    revalidatePath('/notification-templates');
    return { success: true, data: template };
  } catch (error) {
    console.error('Error updating notification template:', error);
    return { success: false, error: 'Erro ao atualizar template de notificação' };
  }
}

export async function deleteNotificationTemplate(id: string) {
  try {
    const session = await requirePermission('notification-templates', 'DELETE');

    const template = await prisma.notificationTemplate.findFirst({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });
    if (!template) return { success: false, error: 'Template não encontrado' };

    await prisma.notificationTemplate.delete({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });

    await createAuditLog({
      action: 'DELETE_NOTIFICATION_TEMPLATE',
      entity: 'NotificationTemplate',
      entityId: id,
      oldValue: template,
    });

    revalidatePath('/notification-templates');
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return { success: false, error: 'Erro ao excluir template de notificação' };
  }
}

export async function toggleNotificationTemplate(id: string, isActive: boolean) {
  try {
    const session = await requirePermission('notification-templates', 'UPDATE');
    const template = await prisma.notificationTemplate.update({
      where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
      data: { isActive },
    });

    await createAuditLog({
      action: 'TOGGLE_NOTIFICATION_TEMPLATE',
      entity: 'NotificationTemplate',
      entityId: id,
      oldValue: { isActive: !isActive },
      newValue: { isActive: template.isActive },
    });

    revalidatePath('/notification-templates');
    return { success: true };
  } catch (error) {
    console.error('Error toggling notification template:', error);
    return { success: false, error: 'Erro ao atualizar template de notificação' };
  }
}
