'use server';

// Ações do usuário sobre as próprias notificações. Os alertas automáticos
// (orçamento, faturas, metas…) ficam em `lib/services/alerts.ts`.

import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { deliverNotification } from '@/lib/services/notification-delivery';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const createNotificationSchema = z.object({
  type: z.enum([
    'BUDGET_WARNING',
    'BUDGET_EXCEEDED',
    'INVOICE_DUE',
    'INVOICE_OVERDUE',
    'GOAL_PROGRESS',
    'DEBT_ALERT',
    'DEBT_DUE_SOON',
    'DEBT_OVERDUE',
    'RECURRING_REMINDER',
    'TRANSACTION_CREATED',
    'TRANSACTION_PENDING',
    'TRANSACTION_DUE_SOON',
    'TRANSACTION_PAID',
    'TRANSACTION_OVERDUE',
    'ANOMALY_DETECTED',
    'CARD_LIMIT_WARNING',
    'CARD_LIMIT_EXCEEDED',
    'PENDING_ITEMS_DIGEST',
    'EXPENSE_SUMMARY',
    'SYSTEM',
  ] as const),
  title: z.string().min(1),
  message: z.string().min(1),
  level: z
    .enum(['INFO', 'WARNING', 'CRITICAL'] as const)
    .optional()
    .default('INFO'),
  link: z.string().optional(),
  metadata: z.any().optional(),
  userId: z.string().optional(),
});

export async function createNotification(data: z.infer<typeof createNotificationSchema>) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Não autorizado' };

    const validated = createNotificationSchema.parse(data);

    const notification = await prisma.notification.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
        userId: validated.userId || session.user.id,
      },
    });

    await deliverNotification({
      userId: notification.userId,
      workspaceId: notification.workspaceId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata as Record<string, unknown> | null,
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Erro ao criar notificação' };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Não autorizado' };

    await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Erro ao marcar notificação como lida' };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Não autorizado' };

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Erro ao marcar notificações como lidas' };
  }
}

export async function deleteNotification(id: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Não autorizado' };

    await prisma.notification.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Erro ao excluir notificação' };
  }
}

export async function deleteOldNotifications(daysOld: number = 30) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Não autorizado' };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return { success: true, deleted: result.count };
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return { success: false, error: 'Erro ao excluir notificações antigas' };
  }
}
