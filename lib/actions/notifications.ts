"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const NotificationType = {
  BUDGET_WARNING: "BUDGET_WARNING",
  BUDGET_EXCEEDED: "BUDGET_EXCEEDED",
  INVOICE_DUE: "INVOICE_DUE",
  INVOICE_OVERDUE: "INVOICE_OVERDUE",
  GOAL_PROGRESS: "GOAL_PROGRESS",
  DEBT_ALERT: "DEBT_ALERT",
  RECURRING_REMINDER: "RECURRING_REMINDER",
  ANOMALY_DETECTED: "ANOMALY_DETECTED",
  SYSTEM: "SYSTEM",
} as const;

const AlertLevel = {
  INFO: "INFO",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
} as const;

type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel];

const createNotificationSchema = z.object({
  type: z.enum([
    "BUDGET_WARNING",
    "BUDGET_EXCEEDED",
    "INVOICE_DUE",
    "INVOICE_OVERDUE",
    "GOAL_PROGRESS",
    "DEBT_ALERT",
    "RECURRING_REMINDER",
    "ANOMALY_DETECTED",
    "SYSTEM",
  ] as const),
  title: z.string().min(1),
  message: z.string().min(1),
  level: z
    .enum(["INFO", "WARNING", "CRITICAL"] as const)
    .optional()
    .default("INFO"),
  link: z.string().optional(),
  metadata: z.any().optional(),
  userId: z.string().optional(),
});

export async function createNotification(data: z.infer<typeof createNotificationSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    const validated = createNotificationSchema.parse(data);

    const notification = await prisma.notification.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
        userId: validated.userId || session.user.id,
      },
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Erro ao criar notificação" };
  }
}

export async function createBulkNotifications(
  notifications: Array<z.infer<typeof createNotificationSchema>>,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    const results = await prisma.notification.createMany({
      data: notifications.map((n) => ({
        ...n,
        workspaceId: session.user.workspaceId,
        userId: n.userId || session.user.id,
      })),
    });

    return { success: true, count: results.count };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, error: "Erro ao criar notificações" };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Erro ao marcar notificação como lida" };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Erro ao marcar notificações como lidas" };
  }
}

export async function deleteNotification(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    await prisma.notification.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Erro ao excluir notificação" };
  }
}

export async function deleteOldNotifications(daysOld: number = 30) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

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
    console.error("Error deleting old notifications:", error);
    return { success: false, error: "Erro ao excluir notificações antigas" };
  }
}

export async function checkBudgetAlerts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        month,
        year,
      },
      include: {
        category: true,
      },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const notifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      level: AlertLevel;
      metadata: any;
    }> = [];

    for (const budget of budgets) {
      const spent = await prisma.transaction.aggregate({
        where: {
          workspaceId: session.user.workspaceId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          status: "PAID",
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const spentAmount = Number(spent._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const percentage = (spentAmount / budgetAmount) * 100;

      if (percentage >= 100 && budget.alertAt100) {
        const existing = await prisma.notification.findFirst({
          where: {
            workspaceId: session.user.workspaceId,
            userId: session.user.id,
            type: NotificationType.BUDGET_EXCEEDED,
            metadata: {
              path: ["budgetId"],
              equals: budget.id,
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existing) {
          notifications.push({
            type: NotificationType.BUDGET_EXCEEDED,
            title: "Orçamento Estourado!",
            message: `Você estourou o orçamento de ${budget.category.name}. Gastou R$ ${spentAmount.toFixed(2)} de R$ ${budgetAmount.toFixed(2)}`,
            level: AlertLevel.CRITICAL,
            metadata: {
              budgetId: budget.id,
              categoryId: budget.categoryId,
              spentAmount,
              budgetAmount,
              percentage,
            },
          });
        }
      } else if (percentage >= 80 && percentage < 100 && budget.alertAt80) {
        const existing = await prisma.notification.findFirst({
          where: {
            workspaceId: session.user.workspaceId,
            userId: session.user.id,
            type: NotificationType.BUDGET_WARNING,
            metadata: {
              path: ["budgetId"],
              equals: budget.id,
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existing) {
          notifications.push({
            type: NotificationType.BUDGET_WARNING,
            title: "Atenção: 80% do Orçamento!",
            message: `Você já usou ${percentage.toFixed(0)}% do orçamento de ${budget.category.name}. Restam R$ ${(budgetAmount - spentAmount).toFixed(2)}`,
            level: AlertLevel.WARNING,
            metadata: {
              budgetId: budget.id,
              categoryId: budget.categoryId,
              spentAmount,
              budgetAmount,
              percentage,
            },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error("Error checking budget alerts:", error);
    return { success: false, error: "Erro ao verificar alertas de orçamento" };
  }
}

export async function checkInvoiceAlerts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Não autorizado" };

    const now = new Date();
    const notifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      level: AlertLevel;
      metadata: any;
    }> = [];

    const dueInThreeDays = new Date(now);
    dueInThreeDays.setDate(dueInThreeDays.getDate() + 3);

    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        creditCard: {
          account: {
            workspaceId: session.user.workspaceId,
          },
        },
        status: "OPEN",
        dueDate: {
          lte: dueInThreeDays,
          gte: now,
        },
      },
      include: {
        creditCard: {
          include: {
            account: true,
          },
        },
      },
    });

    for (const invoice of upcomingInvoices) {
      const existing = await prisma.notification.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          userId: session.user.id,
          type: NotificationType.INVOICE_DUE,
          metadata: {
            path: ["invoiceId"],
            equals: invoice.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        notifications.push({
          type: NotificationType.INVOICE_DUE,
          title: "Fatura Próxima do Vencimento",
          message: `A fatura de ${invoice.creditCard.account.name} (${invoice.month}/${invoice.year}) vence em breve: R$ ${Number(invoice.amount).toFixed(2)}`,
          level: AlertLevel.WARNING,
          metadata: {
            invoiceId: invoice.id,
            creditCardId: invoice.creditCardId,
            amount: Number(invoice.amount),
          },
        });
      }
    }

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        creditCard: {
          account: {
            workspaceId: session.user.workspaceId,
          },
        },
        status: "OPEN",
        dueDate: {
          lt: now,
        },
      },
      include: {
        creditCard: {
          include: {
            account: true,
          },
        },
      },
    });

    for (const invoice of overdueInvoices) {
      const existing = await prisma.notification.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          userId: session.user.id,
          type: NotificationType.INVOICE_OVERDUE,
          metadata: {
            path: ["invoiceId"],
            equals: invoice.id,
          },
        },
      });

      if (!existing) {
        notifications.push({
          type: NotificationType.INVOICE_OVERDUE,
          title: "Fatura Atrasada!",
          message: `A fatura de ${invoice.creditCard.account.name} (${invoice.month}/${invoice.year}) está atrasada! Valor: R$ ${Number(invoice.amount).toFixed(2)}`,
          level: AlertLevel.CRITICAL,
          metadata: {
            invoiceId: invoice.id,
            creditCardId: invoice.creditCardId,
            amount: Number(invoice.amount),
          },
        });
      }
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error("Error checking invoice alerts:", error);
    return { success: false, error: "Erro ao verificar alertas de fatura" };
  }
}
