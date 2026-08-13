'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { deliverNotification } from '@/lib/services/notification-delivery';
import { getServerSession, type Session } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const NotificationType = {
  BUDGET_WARNING: 'BUDGET_WARNING',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  INVOICE_DUE: 'INVOICE_DUE',
  INVOICE_OVERDUE: 'INVOICE_OVERDUE',
  GOAL_PROGRESS: 'GOAL_PROGRESS',
  DEBT_ALERT: 'DEBT_ALERT',
  RECURRING_REMINDER: 'RECURRING_REMINDER',
  ANOMALY_DETECTED: 'ANOMALY_DETECTED',
  CARD_LIMIT_WARNING: 'CARD_LIMIT_WARNING',
  CARD_LIMIT_EXCEEDED: 'CARD_LIMIT_EXCEEDED',
  SYSTEM: 'SYSTEM',
} as const;

const AlertLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;

type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel];

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
    'TRANSACTION_DUE_SOON',
    'TRANSACTION_OVERDUE',
    'ANOMALY_DETECTED',
    'CARD_LIMIT_WARNING',
    'CARD_LIMIT_EXCEEDED',
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
    const session = await getServerSession(authOptions);
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

export async function createBulkNotifications(
  notifications: Array<z.infer<typeof createNotificationSchema>>,
  session: Session,
) {
  try {
    if (!session) return { success: false, error: 'Não autorizado' };

    const results = await prisma.notification.createMany({
      data: notifications.map((n) => ({
        ...n,
        workspaceId: session.user.workspaceId,
        userId: n.userId || session.user.id,
      })),
    });

    await Promise.all(
      notifications.map((n) =>
        deliverNotification({
          userId: n.userId || session.user.id,
          workspaceId: session.user.workspaceId,
          type: n.type,
          title: n.title,
          message: n.message,
          metadata: n.metadata as Record<string, unknown> | null,
        }),
      ),
    );

    return { success: true, count: results.count };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { success: false, error: 'Erro ao criar notificações' };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
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

export async function checkBudgetAlerts(session: Session) {
  try {
    if (!session) return { success: false, error: 'Não autorizado' };

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
          type: 'EXPENSE',
          status: 'PAID',
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
              path: ['budgetId'],
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
            title: 'Orçamento Estourado!',
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
              path: ['budgetId'],
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
            title: 'Atenção: 80% do Orçamento!',
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
      await createBulkNotifications(notifications, session);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error('Error checking budget alerts:', error);
    return { success: false, error: 'Erro ao verificar alertas de orçamento' };
  }
}

export async function checkInvoiceAlerts(session: Session) {
  try {
    if (!session) return { success: false, error: 'Não autorizado' };

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
        status: 'OPEN',
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
            path: ['invoiceId'],
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
          title: 'Fatura Próxima do Vencimento',
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
        status: 'OPEN',
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
            path: ['invoiceId'],
            equals: invoice.id,
          },
        },
      });

      if (!existing) {
        notifications.push({
          type: NotificationType.INVOICE_OVERDUE,
          title: 'Fatura Atrasada!',
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
      await createBulkNotifications(notifications, session);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error('Error checking invoice alerts:', error);
    return { success: false, error: 'Erro ao verificar alertas de fatura' };
  }
}

export async function checkGoalAlerts(session: Session) {
  try {
    if (!session) return { success: false, error: 'Não autorizado' };

    const goals = await prisma.goal.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        isActive: true,
      },
    });

    const notifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      level: AlertLevel;
      metadata: any;
    }> = [];

    for (const goal of goals) {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      if (target <= 0) continue;
      const percentage = (current / target) * 100;
      if (percentage < 80) continue;

      const isReached = percentage >= 100;
      const type = NotificationType.GOAL_PROGRESS;

      const existing = await prisma.notification.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          userId: session.user.id,
          type,
          metadata: {
            path: ['goalId'],
            equals: goal.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existing) continue;

      notifications.push({
        type,
        title: isReached ? 'Meta Atingida! 🎉' : 'Quase lá!',
        message: isReached
          ? `Você atingiu a meta "${goal.name}"! Total: R$ ${current.toFixed(2)}`
          : `Você já alcançou ${percentage.toFixed(0)}% da meta "${goal.name}". Faltam R$ ${(target - current).toFixed(2)}`,
        level: isReached ? AlertLevel.INFO : AlertLevel.WARNING,
        metadata: { goalId: goal.id, current, target, percentage },
      });
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications, session);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error('Error checking goal alerts:', error);
    return { success: false, error: 'Erro ao verificar alertas de metas' };
  }
}

export async function checkTransactionDueAlerts(session: Session) {
  try {
    if (!session) return { success: false, error: 'Não autorizado' };

    const now = new Date();
    const dueInThreeDays = new Date(now);
    dueInThreeDays.setDate(dueInThreeDays.getDate() + 3);

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        type: 'EXPENSE',
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lte: dueInThreeDays },
      },
      include: { category: true, debt: { select: { name: true } } },
      take: 50,
    });

    const notifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      level: AlertLevel;
      metadata: any;
    }> = [];

    for (const transaction of transactions) {
      const dueDate = transaction.dueDate || transaction.date;
      const isOverdue = dueDate < now;
      const type = isOverdue ? NotificationType.INVOICE_OVERDUE : NotificationType.INVOICE_DUE;

      const existing = await prisma.notification.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          userId: session.user.id,
          type,
          metadata: {
            path: ['transactionId'],
            equals: transaction.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existing) continue;

      notifications.push({
        type,
        title: isOverdue ? 'Transação Vencida!' : 'Transação Próxima do Vencimento',
        message: `${transaction.description || transaction.category.name}: R$ ${Number(transaction.amount).toFixed(2)} ${isOverdue ? 'venceu' : 'vence'} em ${dueDate.toLocaleDateString('pt-BR')}`,
        level: isOverdue ? AlertLevel.CRITICAL : AlertLevel.WARNING,
        metadata: {
          transactionId: transaction.id,
          name: transaction.description || transaction.category.name,
          amount: Number(transaction.amount),
          dueDate: dueDate.toISOString(),
          isRecurring: transaction.isRecurring,
          debtName: transaction.debt?.name ?? null,
        },
      });
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications, session);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error('Error checking transaction due alerts:', error);
    return { success: false, error: 'Erro ao verificar alertas de transações' };
  }
}

async function getDebtName(debtId?: string | null): Promise<string | null> {
  if (!debtId) return null;
  const debt = await prisma.debt.findUnique({ where: { id: debtId }, select: { name: true } });
  return debt?.name ?? null;
}

export async function notifyNewTransaction(transaction: {
  id: string;
  description?: string | null;
  amount: number;
  type: string;
  categoryName: string;
  dueDate?: Date | string | null;
  isRecurring?: boolean;
  debtId?: string | null;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return;

    const debtName = await getDebtName(transaction.debtId);

    await createNotification({
      type: 'SYSTEM',
      title: 'Nova Transação',
      message: `${transaction.type === 'INCOME' ? 'Receita' : 'Despesa'} adicionada: ${transaction.description || transaction.categoryName} - R$ ${transaction.amount.toFixed(2)}`,
      level: 'INFO',
      link: '/transactions',
      metadata: {
        transactionId: transaction.id,
        name: transaction.description || transaction.categoryName,
        amount: transaction.amount,
        dueDate: transaction.dueDate ? new Date(transaction.dueDate).toISOString() : null,
        isRecurring: !!transaction.isRecurring,
        debtName,
      },
    });
  } catch (error) {
    console.error('Error notifying new transaction:', error);
  }
}

export async function notifyTransactionStatusChange(transaction: {
  id: string;
  description?: string | null;
  amount: number;
  categoryName: string;
  oldStatus: string;
  newStatus: string;
  dueDate?: Date | string | null;
  isRecurring?: boolean;
  debtId?: string | null;
}) {
  try {
    if (transaction.oldStatus === transaction.newStatus) return;

    const session = await getServerSession(authOptions);
    if (!session) return;

    const label = transaction.description || transaction.categoryName;
    const amount = transaction.amount.toFixed(2);
    const debtName = await getDebtName(transaction.debtId);

    let title = 'Status da transação atualizado';
    let message = `${label} mudou de status: R$ ${amount}`;
    let level: AlertLevel = AlertLevel.INFO;

    if (transaction.newStatus === 'PAID') {
      title = 'Transação paga';
      message = `${label} foi marcada como paga: R$ ${amount}`;
      level = AlertLevel.INFO;
    } else if (transaction.newStatus === 'OVERDUE') {
      title = 'Transação em atraso';
      message = `${label} está atrasada: R$ ${amount}`;
      level = AlertLevel.CRITICAL;
    } else if (transaction.newStatus === 'PENDING') {
      title = 'Transação pendente';
      message = `${label} voltou a ficar pendente: R$ ${amount}`;
      level = AlertLevel.WARNING;
    }

    await createNotification({
      type: NotificationType.SYSTEM,
      title,
      message,
      level,
      link: '/transactions',
      metadata: {
        transactionId: transaction.id,
        name: label,
        amount: transaction.amount,
        dueDate: transaction.dueDate ? new Date(transaction.dueDate).toISOString() : null,
        isRecurring: !!transaction.isRecurring,
        debtName,
      },
    });
  } catch (error) {
    console.error('Error notifying transaction status change:', error);
  }
}

export async function checkCreditCardLimitAlerts(session: Session) {
  try {
    if (!session) return { success: false, error: 'Não autorizado' };

    const creditCards = await prisma.creditCard.findMany({
      where: { account: { workspaceId: session.user.workspaceId } },
      include: { account: true },
    });

    const notifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      level: AlertLevel;
      metadata: any;
    }> = [];

    for (const card of creditCards) {
      const limit = Number(card.limit);
      const used = Number(card.usedAmount);
      if (limit <= 0) continue;
      const percentage = (used / limit) * 100;
      if (percentage < 80) continue;

      const isExceeded = percentage >= 100;
      const type = isExceeded
        ? NotificationType.CARD_LIMIT_EXCEEDED
        : NotificationType.CARD_LIMIT_WARNING;

      const existing = await prisma.notification.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          userId: session.user.id,
          type,
          metadata: {
            path: ['creditCardId'],
            equals: card.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existing) continue;

      const available = Math.max(limit - used, 0);

      const cardTransactions = await prisma.transaction.findMany({
        where: { creditCardId: card.id, type: 'EXPENSE' },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 30,
      });
      const categoryTotals = new Map<string, number>();
      for (const t of cardTransactions) {
        const name = t.category?.name || 'Outros';
        categoryTotals.set(name, (categoryTotals.get(name) || 0) + Number(t.amount));
      }
      const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

      const detail = topCategory
        ? ` A categoria que mais contribuiu foi "${topCategory[0]}" (R$ ${topCategory[1].toFixed(2)}).`
        : '';

      notifications.push({
        type,
        title: isExceeded ? 'Limite do Cartão Estourado!' : 'Atenção: Cartão Perto do Limite!',
        message: isExceeded
          ? `O cartão ${card.account.name} estourou o limite. Usado R$ ${used.toFixed(2)} de R$ ${limit.toFixed(2)}.${detail}`
          : `O cartão ${card.account.name} já usou ${percentage.toFixed(0)}% do limite. Disponível R$ ${available.toFixed(2)} de R$ ${limit.toFixed(2)}.${detail}`,
        level: isExceeded ? AlertLevel.CRITICAL : AlertLevel.WARNING,
        metadata: {
          creditCardId: card.id,
          accountId: card.accountId,
          cardName: card.account.name,
          used,
          limit,
          available,
          percentage,
          topCategory: topCategory?.[0] ?? null,
          topCategoryAmount: topCategory?.[1] ?? null,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
        },
      });
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications, session);
    }

    return { success: true, created: notifications.length };
  } catch (error) {
    console.error('Error checking credit card limit alerts:', error);
    return { success: false, error: 'Erro ao verificar alertas de limite de cartão' };
  }
}

export async function notifyAutomationResult(input: {
  source: 'CONDITIONAL_RULE' | 'SCHEDULED_TRANSACTION';
  success: boolean;
  detail: string;
  userId: string;
  workspaceId: string;
}) {
  try {
    const sourceLabel = input.source === 'CONDITIONAL_RULE' ? 'Regra de automação' : 'Agendamento';

    const notification = await prisma.notification.create({
      data: {
        type: NotificationType.SYSTEM,
        title: input.success
          ? `${sourceLabel} executado(a) com sucesso`
          : `Falha ao executar ${sourceLabel.toLowerCase()}`,
        message: input.detail,
        level: input.success ? AlertLevel.INFO : AlertLevel.CRITICAL,
        link: input.source === 'CONDITIONAL_RULE' ? '/rules' : '/scheduled',
        userId: input.userId,
        workspaceId: input.workspaceId,
      },
    });

    await deliverNotification({
      userId: notification.userId,
      workspaceId: notification.workspaceId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });
  } catch (error) {
    console.error('Error notifying automation result:', error);
  }
}

export async function runAllAlertChecks(session: Session) {
  const [budget, invoice, goal, dueDate, creditCardLimit] = await Promise.all([
    checkBudgetAlerts(session),
    checkInvoiceAlerts(session),
    checkGoalAlerts(session),
    checkTransactionDueAlerts(session),
    checkCreditCardLimitAlerts(session),
  ]);

  return { budget, invoice, goal, dueDate, creditCardLimit };
}
