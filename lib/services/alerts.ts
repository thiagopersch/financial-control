import { logger } from '@/lib/logger';
import {
  buildBudgetVars,
  buildCreditCardVars,
  buildGoalVars,
  buildTransactionVars,
  TRANSACTION_VARS_INCLUDE,
} from '@/lib/notification-templates/vars-builder';
import prisma from '@/lib/prisma';
import { getCreditCardsCurrentUsage } from '@/lib/queries/credit-card-usage';
import { deliverNotifications } from '@/lib/services/notification-delivery';
import type { NotificationType as PrismaNotificationType, Prisma } from '@prisma/client';

/**
 * Alertas e notificações automáticas. Fica fora de `'use server'` de propósito:
 * recebe `Actor` explícito (workspace + usuário) e roda tanto dentro de um
 * request quanto em jobs da fila, sem aceitar uma sessão vinda do cliente.
 */
export interface Actor {
  workspaceId: string;
  userId: string;
}

type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NewNotification {
  type: PrismaNotificationType;
  title: string;
  message: string;
  level: AlertLevel;
  link?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Grava as notificações em lote e dispara a entrega (e-mail/WhatsApp) em lote. */
export async function createNotifications(actor: Actor, notifications: NewNotification[]) {
  if (notifications.length === 0) return 0;

  const rows = notifications.map((n) => ({
    type: n.type,
    title: n.title,
    message: n.message,
    level: n.level,
    link: n.link,
    metadata: n.metadata as Prisma.InputJsonValue | undefined,
    workspaceId: actor.workspaceId,
    userId: n.userId || actor.userId,
  }));

  const result = await prisma.notification.createMany({ data: rows });

  await deliverNotifications(
    rows.map((row) => ({
      userId: row.userId,
      workspaceId: row.workspaceId,
      type: row.type,
      title: row.title,
      message: row.message,
      metadata: (row.metadata as Record<string, unknown> | undefined) ?? null,
    })),
  );

  return result.count;
}

/**
 * Deduplicação em lote: uma única consulta traz as notificações já enviadas
 * (por tipo e janela de tempo) e devolve o conjunto de chaves `tipo:id` — antes
 * era um `findFirst` por item dentro de um loop (N+1).
 */
async function existingNotificationKeys(
  actor: Actor,
  types: PrismaNotificationType[],
  metadataKey: string,
  since: Date,
): Promise<Set<string>> {
  const rows = await prisma.notification.findMany({
    where: {
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      type: { in: types },
      createdAt: { gte: since },
    },
    select: { type: true, metadata: true },
  });

  const keys = new Set<string>();
  for (const row of rows) {
    const id = (row.metadata as Record<string, unknown> | null)?.[metadataKey];
    if (typeof id === 'string') keys.add(`${row.type}:${id}`);
  }
  return keys;
}

async function runCheck(name: string, actor: Actor, fn: () => Promise<number>) {
  try {
    return { success: true as const, created: await fn() };
  } catch (error) {
    logger.error('alerts.check_failed', { check: name, workspaceId: actor.workspaceId, error });
    return { success: false as const, error: `Erro ao verificar alertas (${name})` };
  }
}

export function checkBudgetAlerts(actor: Actor) {
  return runCheck('budget', actor, async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const [budgets, spentByCategory, existing] = await Promise.all([
      prisma.budget.findMany({
        where: { workspaceId: actor.workspaceId, month, year },
        include: { category: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          workspaceId: actor.workspaceId,
          type: 'EXPENSE',
          status: 'PAID',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      existingNotificationKeys(
        actor,
        ['BUDGET_EXCEEDED', 'BUDGET_WARNING'],
        'budgetId',
        new Date(Date.now() - DAY_MS),
      ),
    ]);

    const spentMap = new Map(
      spentByCategory.map((g) => [g.categoryId, Number(g._sum.amount || 0)]),
    );
    const notifications: NewNotification[] = [];

    for (const budget of budgets) {
      const spentAmount = spentMap.get(budget.categoryId) ?? 0;
      const budgetAmount = Number(budget.amount);
      const percentage = (spentAmount / budgetAmount) * 100;
      const metadata = {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        spentAmount,
        budgetAmount,
        percentage,
        ...buildBudgetVars(budget),
      };

      if (percentage >= 100 && budget.alertAt100) {
        if (existing.has(`BUDGET_EXCEEDED:${budget.id}`)) continue;
        notifications.push({
          type: 'BUDGET_EXCEEDED',
          title: 'Orçamento Estourado!',
          message: `Você estourou o orçamento de ${budget.category.name}. Gastou R$ ${spentAmount.toFixed(2)} de R$ ${budgetAmount.toFixed(2)}`,
          level: 'CRITICAL',
          metadata,
        });
      } else if (percentage >= 80 && percentage < 100 && budget.alertAt80) {
        if (existing.has(`BUDGET_WARNING:${budget.id}`)) continue;
        notifications.push({
          type: 'BUDGET_WARNING',
          title: 'Atenção: 80% do Orçamento!',
          message: `Você já usou ${percentage.toFixed(0)}% do orçamento de ${budget.category.name}. Restam R$ ${(budgetAmount - spentAmount).toFixed(2)}`,
          level: 'WARNING',
          metadata,
        });
      }
    }

    return createNotifications(actor, notifications);
  });
}

export function checkInvoiceAlerts(actor: Actor) {
  return runCheck('invoice', actor, async () => {
    const now = new Date();
    const dueInThreeDays = new Date(now);
    dueInThreeDays.setDate(dueInThreeDays.getDate() + 3);

    const invoiceInclude = { creditCard: { include: { account: true } } } as const;
    const workspaceFilter = { creditCard: { account: { workspaceId: actor.workspaceId } } };

    const [upcomingInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: { ...workspaceFilter, status: 'OPEN', dueDate: { lte: dueInThreeDays, gte: now } },
        include: invoiceInclude,
      }),
      prisma.invoice.findMany({
        where: { ...workspaceFilter, status: 'OPEN', dueDate: { lt: now } },
        include: invoiceInclude,
      }),
    ]);

    // Fatura atrasada notifica uma única vez: qualquer aviso criado depois do
    // vencimento mais antigo conta como "já notificado".
    const oldestOverdue = overdueInvoices.reduce<Date | null>(
      (min, inv) => (inv.dueDate && (!min || inv.dueDate < min) ? inv.dueDate : min),
      null,
    );

    const [recentDue, everOverdue] = await Promise.all([
      upcomingInvoices.length
        ? existingNotificationKeys(
            actor,
            ['INVOICE_DUE'],
            'invoiceId',
            new Date(Date.now() - DAY_MS),
          )
        : Promise.resolve(new Set<string>()),
      overdueInvoices.length
        ? existingNotificationKeys(
            actor,
            ['INVOICE_OVERDUE'],
            'invoiceId',
            oldestOverdue ?? new Date(0),
          )
        : Promise.resolve(new Set<string>()),
    ]);

    const notifications: NewNotification[] = [];

    for (const invoice of upcomingInvoices) {
      if (recentDue.has(`INVOICE_DUE:${invoice.id}`)) continue;
      notifications.push({
        type: 'INVOICE_DUE',
        title: 'Fatura Próxima do Vencimento',
        message: `A fatura de ${invoice.creditCard.account.name} (${invoice.month}/${invoice.year}) vence em breve: R$ ${Number(invoice.amount).toFixed(2)}`,
        level: 'WARNING',
        metadata: {
          invoiceId: invoice.id,
          creditCardId: invoice.creditCardId,
          amount: Number(invoice.amount),
        },
      });
    }

    for (const invoice of overdueInvoices) {
      if (everOverdue.has(`INVOICE_OVERDUE:${invoice.id}`)) continue;
      notifications.push({
        type: 'INVOICE_OVERDUE',
        title: 'Fatura Atrasada!',
        message: `A fatura de ${invoice.creditCard.account.name} (${invoice.month}/${invoice.year}) está atrasada! Valor: R$ ${Number(invoice.amount).toFixed(2)}`,
        level: 'CRITICAL',
        metadata: {
          invoiceId: invoice.id,
          creditCardId: invoice.creditCardId,
          amount: Number(invoice.amount),
        },
      });
    }

    return createNotifications(actor, notifications);
  });
}

export function checkGoalAlerts(actor: Actor) {
  return runCheck('goal', actor, async () => {
    const [goals, existing] = await Promise.all([
      prisma.goal.findMany({ where: { workspaceId: actor.workspaceId, isActive: true } }),
      existingNotificationKeys(actor, ['GOAL_PROGRESS'], 'goalId', new Date(Date.now() - DAY_MS)),
    ]);

    const notifications: NewNotification[] = [];

    for (const goal of goals) {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      if (target <= 0) continue;
      const percentage = (current / target) * 100;
      if (percentage < 80) continue;
      if (existing.has(`GOAL_PROGRESS:${goal.id}`)) continue;

      const isReached = percentage >= 100;
      notifications.push({
        type: 'GOAL_PROGRESS',
        title: isReached ? 'Meta Atingida! 🎉' : 'Quase lá!',
        message: isReached
          ? `Você atingiu a meta "${goal.name}"! Total: R$ ${current.toFixed(2)}`
          : `Você já alcançou ${percentage.toFixed(0)}% da meta "${goal.name}". Faltam R$ ${(target - current).toFixed(2)}`,
        level: isReached ? 'INFO' : 'WARNING',
        metadata: buildGoalVars(goal),
      });
    }

    return createNotifications(actor, notifications);
  });
}

export function checkTransactionDueAlerts(actor: Actor) {
  return runCheck('transaction-due', actor, async () => {
    const now = new Date();
    const dueInThreeDays = new Date(now);
    dueInThreeDays.setDate(dueInThreeDays.getDate() + 3);

    const [transactions, existing] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          workspaceId: actor.workspaceId,
          type: 'EXPENSE',
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { lte: dueInThreeDays },
        },
        include: TRANSACTION_VARS_INCLUDE,
        take: 50,
      }),
      existingNotificationKeys(
        actor,
        ['TRANSACTION_OVERDUE', 'TRANSACTION_DUE_SOON'],
        'transactionId',
        new Date(Date.now() - DAY_MS),
      ),
    ]);

    const notifications: NewNotification[] = [];

    for (const transaction of transactions) {
      const dueDate = transaction.dueDate || transaction.date;
      const isOverdue = dueDate < now;
      const type = isOverdue ? 'TRANSACTION_OVERDUE' : 'TRANSACTION_DUE_SOON';
      if (existing.has(`${type}:${transaction.id}`)) continue;

      notifications.push({
        type,
        title: isOverdue ? 'Transação Vencida!' : 'Transação Próxima do Vencimento',
        message: `${transaction.description || transaction.category.name}: R$ ${Number(transaction.amount).toFixed(2)} ${isOverdue ? 'venceu' : 'vence'} em ${dueDate.toLocaleDateString('pt-BR')}`,
        level: isOverdue ? 'CRITICAL' : 'WARNING',
        metadata: buildTransactionVars(transaction),
      });
    }

    return createNotifications(actor, notifications);
  });
}

export function checkCreditCardLimitAlerts(actor: Actor) {
  return runCheck('credit-card-limit', actor, async () => {
    const [creditCards, existing] = await Promise.all([
      prisma.creditCard.findMany({
        where: { account: { workspaceId: actor.workspaceId } },
        include: { account: true },
      }),
      existingNotificationKeys(
        actor,
        ['CARD_LIMIT_EXCEEDED', 'CARD_LIMIT_WARNING'],
        'creditCardId',
        new Date(Date.now() - DAY_MS),
      ),
    ]);
    if (creditCards.length === 0) return 0;

    const usageByCard = await getCreditCardsCurrentUsage(creditCards.map((c) => c.id));

    const flagged = creditCards.flatMap((card) => {
      const limit = Number(card.limit);
      const used = usageByCard[card.id] || 0;
      if (limit <= 0) return [];
      const percentage = (used / limit) * 100;
      if (percentage < 80) return [];
      const type = percentage >= 100 ? 'CARD_LIMIT_EXCEEDED' : 'CARD_LIMIT_WARNING';
      if (existing.has(`${type}:${card.id}`)) return [];
      return [{ card, limit, used, percentage, type } as const];
    });

    // Só os cartões que vão notificar precisam do detalhe por categoria — em paralelo.
    const notifications = await Promise.all(
      flagged.map(async ({ card, limit, used, percentage, type }): Promise<NewNotification> => {
        const cardTransactions = await prisma.transaction.findMany({
          where: { creditCardId: card.id, type: 'EXPENSE' },
          select: { amount: true, category: { select: { name: true } } },
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
        const isExceeded = type === 'CARD_LIMIT_EXCEEDED';
        const available = Math.max(limit - used, 0);

        return {
          type,
          title: isExceeded ? 'Limite do Cartão Estourado!' : 'Atenção: Cartão Perto do Limite!',
          message: isExceeded
            ? `O cartão ${card.account.name} estourou o limite. Usado R$ ${used.toFixed(2)} de R$ ${limit.toFixed(2)}.${detail}`
            : `O cartão ${card.account.name} já usou ${percentage.toFixed(0)}% do limite. Disponível R$ ${available.toFixed(2)} de R$ ${limit.toFixed(2)}.${detail}`,
          level: isExceeded ? 'CRITICAL' : 'WARNING',
          metadata: {
            ...buildCreditCardVars(card, used),
            topCategory: topCategory?.[0] ?? null,
            topCategoryAmount: topCategory?.[1] ?? null,
            closingDay: card.closingDay,
            dueDay: card.dueDay,
          },
        };
      }),
    );

    return createNotifications(actor, notifications);
  });
}

export async function runAllAlertChecks(actor: Actor) {
  const [budget, invoice, goal, dueDate, creditCardLimit] = await Promise.all([
    checkBudgetAlerts(actor),
    checkInvoiceAlerts(actor),
    checkGoalAlerts(actor),
    checkTransactionDueAlerts(actor),
    checkCreditCardLimitAlerts(actor),
  ]);
  return { budget, invoice, goal, dueDate, creditCardLimit };
}

export async function notifyNewTransaction(actor: Actor, transactionId: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, workspaceId: actor.workspaceId },
      include: TRANSACTION_VARS_INCLUDE,
    });
    if (!transaction) return;

    const label = transaction.description || transaction.category.name;
    const amount = Number(transaction.amount);

    await createNotifications(actor, [
      {
        type: 'TRANSACTION_CREATED',
        title: 'Nova Transação',
        message: `${transaction.type === 'INCOME' ? 'Receita' : 'Despesa'} adicionada: ${label} - R$ ${amount.toFixed(2)}`,
        level: 'INFO',
        link: '/transactions',
        metadata: buildTransactionVars(transaction),
      },
    ]);
  } catch (error) {
    logger.error('alerts.notify_new_transaction_failed', { transactionId, error });
  }
}

export async function notifyTransactionStatusChange(
  actor: Actor,
  input: { id: string; oldStatus: string; newStatus: string },
) {
  try {
    if (input.oldStatus === input.newStatus) return;
    // checkTransactionDueAlerts já cria a notificação TRANSACTION_OVERDUE templável
    // para este evento — não duplicar aqui.
    if (input.newStatus === 'OVERDUE') return;

    const transaction = await prisma.transaction.findUnique({
      where: { id: input.id, workspaceId: actor.workspaceId },
      include: TRANSACTION_VARS_INCLUDE,
    });
    if (!transaction) return;

    const label = transaction.description || transaction.category.name;
    const amount = Number(transaction.amount).toFixed(2);

    let notification: NewNotification = {
      type: 'SYSTEM',
      title: 'Status da transação atualizado',
      message: `${label} mudou de status: R$ ${amount}`,
      level: 'INFO',
    };
    if (input.newStatus === 'PAID') {
      notification = {
        type: 'TRANSACTION_PAID',
        title: 'Transação paga',
        message: `${label} foi marcada como paga: R$ ${amount}`,
        level: 'INFO',
      };
    } else if (input.newStatus === 'PENDING') {
      notification = {
        type: 'TRANSACTION_PENDING',
        title: 'Transação pendente',
        message: `${label} voltou a ficar pendente: R$ ${amount}`,
        level: 'WARNING',
      };
    }

    await createNotifications(actor, [
      { ...notification, link: '/transactions', metadata: buildTransactionVars(transaction) },
    ]);
  } catch (error) {
    logger.error('alerts.notify_status_change_failed', { transactionId: input.id, error });
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
    await createNotifications({ workspaceId: input.workspaceId, userId: input.userId }, [
      {
        type: 'SYSTEM',
        title: input.success
          ? `${sourceLabel} executado(a) com sucesso`
          : `Falha ao executar ${sourceLabel.toLowerCase()}`,
        message: input.detail,
        level: input.success ? 'INFO' : 'CRITICAL',
        link: input.source === 'CONDITIONAL_RULE' ? '/rules' : '/scheduled',
      },
    ]);
  } catch (error) {
    logger.error('alerts.notify_automation_failed', { error });
  }
}
