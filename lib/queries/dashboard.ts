import { authOptions } from '@/lib/auth-options';
import { CHART_STATUS_COLORS, getCategoricalColor } from '@/lib/chart-colors';
import { DEBT_OPEN_STATUSES } from '@/lib/constants/debt-status';
import prisma from '@/lib/prisma';
import { getCreditCardsCurrentUsage } from '@/lib/queries/credit-card-usage';
import {
  addCompetenceMonths,
  competenceFromYearMonth,
  competenceRange,
} from '@/lib/utils/competence';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getServerSession } from 'next-auth';

/** Intervalo de competência (`{ gte, lte }` na coluna `competence`); `undefined` = todos os períodos. */
export type CompetenceFilter = { gte: Date; lte: Date } | undefined;

function competenceWhere(competence: CompetenceFilter): Prisma.TransactionWhereInput {
  return competence ? { competence } : {};
}

export async function getDashboardStats(competence?: CompetenceFilter) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const workspaceId = session.user.workspaceId;

  const [allTransactions, cardLimitAggregate] = await Promise.all([
    prisma.transaction.findMany({ where: { workspaceId } }),
    prisma.creditCard.aggregate({
      where: { account: { workspaceId } },
      _sum: { limit: true },
    }),
  ]);

  // Limite total dos cartões entra como recurso disponível no patrimônio e nas receitas.
  const totalCardLimit = Number(cardLimitAggregate._sum.limit || 0);

  // Patrimônio = todas as receitas cadastradas (pagas ou não) + limite dos cartões
  // − despesas já pagas. Compras no cartão ficam de fora: o pagamento da fatura é
  // registrado como uma despesa própria (sem creditCardId) e contar as duas duplicaria.
  const allIncome = allTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const paidExpenses = allTransactions
    .filter((t) => t.type === TransactionType.EXPENSE && t.status === 'PAID' && !t.creditCardId)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalBalance = allIncome + totalCardLimit - paidExpenses;

  const filteredTransactions = competence
    ? allTransactions.filter(
        (t) => t.competence >= competence.gte && t.competence <= competence.lte,
      )
    : allTransactions;

  const totalIncome =
    filteredTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + Number(t.amount), 0) + totalCardLimit;

  const totalExpense = filteredTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const pendingToPay = filteredTransactions
    .filter((t) => t.type === TransactionType.EXPENSE && t.status === 'PENDING')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // Last Month Stats for Comparison
  let lastMonthIncome = 0;
  let lastMonthExpense = 0;

  if (competence) {
    const lastTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId,
        competence: {
          gte: addCompetenceMonths(competence.gte, -1),
          lte: addCompetenceMonths(competence.lte, -1),
        },
      },
    });

    lastMonthIncome =
      lastTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + Number(t.amount), 0) + totalCardLimit;

    lastMonthExpense = lastTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }

  const incomeGrowth =
    lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
  const expenseGrowth =
    lastMonthExpense > 0 ? ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    totalBalance,
    cardLimit: totalCardLimit,
    balance,
    pendingToPay,
    incomeGrowth,
    expenseGrowth,
  };
}

export async function getCashFlowProjection(days: number = 30) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      date: {
        gte: startOfMonth(today),
        lte: futureDate,
      },
      status: { in: ['PENDING', 'PAID'] },
    },
    orderBy: { date: 'asc' },
  });

  const accounts = await prisma.account.findMany({
    where: { workspaceId: session.user.workspaceId },
    include: { creditCardDetails: true },
  });

  const allCards = accounts.flatMap((a) => a.creditCardDetails);
  const usageByCard = await getCreditCardsCurrentUsage(allCards.map((c) => c.id));
  const creditCardAvailableLimit = allCards.reduce(
    (sum, card) => sum + (Number(card.limit) - (usageByCard[card.id] || 0)),
    0,
  );

  const currentBalance = creditCardAvailableLimit;

  const projection = [];
  let tempBalance = currentBalance;

  // Group by date
  const groupedDates: Record<string, any[]> = {};
  transactions.forEach((t) => {
    if (t.status === 'PAID' && t.date < today) return; // Only future or current balance impact
    const dStr = format(t.date, 'yyyy-MM-dd');
    if (!groupedDates[dStr]) groupedDates[dStr] = [];
    groupedDates[dStr].push(t);
  });

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dStr = format(d, 'yyyy-MM-dd');

    const dayTransactions = groupedDates[dStr] || [];
    dayTransactions.forEach((t) => {
      if (t.status === 'PENDING') {
        const amt = Number(t.amount);
        tempBalance += t.type === 'INCOME' ? amt : -amt;
      }
    });

    projection.push({
      date: dStr,
      balance: tempBalance,
      label: format(d, 'dd/MM'),
    });
  }

  return projection;
}

export async function getBudgetData(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

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

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      type: TransactionType.EXPENSE,
      competence: competenceRange(year, month),
    },
  });

  return budgets.map((budget) => {
    const spent = transactions
      .filter((t) => t.categoryId === budget.categoryId)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
      ...budget,
      amount: Number(budget.amount),
      spent,
      percent: (spent / Number(budget.amount)) * 100,
    };
  });
}

export async function getGoalsData() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const goals = await prisma.goal.findMany({
    where: {
      workspaceId: session.user.workspaceId,
    },
  });

  return goals.map((goal) => ({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    percent: (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
  }));
}

export async function getFinancialInsights() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      date: { gte: start, lte: end },
    },
    include: { category: true },
  });

  // Calculate top spending category
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .forEach((t) => {
      categorySpending[t.category.name] =
        (categorySpending[t.category.name] || 0) + Number(t.amount);
    });

  const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

  return {
    topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
    totalCount: transactions.length,
  };
}

export async function getRecentTransactions(competence?: CompetenceFilter) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  return await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      ...competenceWhere(competence),
    },
    take: 8,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      category: true,
      supplier: true,
      account: true,
    },
  });
}

export async function getChartData(
  month: Date,
  isFullYear: boolean = false,
  isAllPeriod: boolean = false,
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  let monthsToFetch = isFullYear ? 12 : 6;
  let baseDate = isFullYear ? new Date(month.getFullYear(), 11, 1) : month;

  if (isAllPeriod) {
    const result = await prisma.transaction.aggregate({
      where: { workspaceId: session.user.workspaceId },
      _min: { competence: true },
      _max: { competence: true },
    });
    if (result._min.competence && result._max.competence) {
      const minDate = new Date(result._min.competence);
      const maxDate = new Date(result._max.competence);
      const diffMonths =
        (maxDate.getUTCFullYear() - minDate.getUTCFullYear()) * 12 +
        (maxDate.getUTCMonth() - minDate.getUTCMonth()) +
        1;
      monthsToFetch = Math.max(diffMonths, 12);
      baseDate = new Date(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1);
    } else {
      monthsToFetch = 12;
      baseDate = new Date();
    }
  }

  const periods = Array.from({ length: monthsToFetch })
    .map((_, i) => {
      const date = subMonths(baseDate, i);
      return {
        competence: competenceFromYearMonth(date.getFullYear(), date.getMonth() + 1),
        label: format(date, 'MMM', { locale: ptBR }),
      };
    })
    .reverse();

  const chartData = await Promise.all(
    periods.map(async (m) => {
      const transactions = await prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          competence: m.competence,
        },
      });

      const income = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const expense = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + Number(t.amount), 0);

      return {
        name: m.label,
        receitas: income,
        despesas: expense,
      };
    }),
  );

  return chartData;
}

export async function getCategoryData(competence?: CompetenceFilter) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      type: TransactionType.EXPENSE,
      ...competenceWhere(competence),
    },
    include: {
      category: true,
    },
  });

  const categoryMap: Record<string, { value: number; color: string }> = {};

  transactions.forEach((t) => {
    const catName = t.category.name;
    if (!categoryMap[catName]) {
      categoryMap[catName] = { value: 0, color: t.category.color };
    }
    categoryMap[catName].value += Number(t.amount);
  });

  return Object.entries(categoryMap).map(([name, data]) => ({
    name,
    value: data.value,
    color: data.color,
  }));
}

export async function getStatusData(competence?: CompetenceFilter) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const transactions = await prisma.transaction.groupBy({
    by: ['status'],
    where: {
      workspaceId: session.user.workspaceId,
      type: TransactionType.EXPENSE,
      ...competenceWhere(competence),
    },
    _sum: { amount: true },
    _count: true,
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Pago', color: CHART_STATUS_COLORS.PAID },
    PENDING: { label: 'Pendente', color: CHART_STATUS_COLORS.PENDING },
    OVERDUE: { label: 'Atrasado', color: CHART_STATUS_COLORS.OVERDUE },
  };

  return transactions.map((t) => ({
    name: statusLabels[t.status]?.label || t.status,
    value: Number(t._sum.amount || 0),
    count: t._count,
    color: statusLabels[t.status]?.color || '#94a3b8',
  }));
}

export async function getSupplierData(competence?: CompetenceFilter) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      type: TransactionType.EXPENSE,
      supplierId: { not: null },
      ...competenceWhere(competence),
    },
    include: { supplier: true },
  });

  const supplierMap: Record<string, number> = {};
  transactions.forEach((t) => {
    if (!t.supplier) return;
    supplierMap[t.supplier.name] = (supplierMap[t.supplier.name] || 0) + Number(t.amount);
  });

  return Object.entries(supplierMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((entry, index) => ({ ...entry, color: getCategoricalColor(index) }));
}

/**
 * Despesas pagas agrupadas por "Pago por" no período (competência). Transações
 * sem usuário vinculado entram no grupo "Não informado".
 */
export async function getPaidByData(competence?: CompetenceFilter) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const groups = await prisma.transaction.groupBy({
    by: ['paidById'],
    where: {
      workspaceId: session.user.workspaceId,
      type: TransactionType.EXPENSE,
      status: TransactionStatus.PAID,
      ...competenceWhere(competence),
    },
    _sum: { amount: true },
    _count: true,
  });

  const userIds = groups.map((g) => g.paidById).filter((id): id is string => !!id);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds }, workspaceId: session.user.workspaceId },
        select: { id: true, name: true, email: true },
      })
    : [];
  const userNames = new Map(users.map((u) => [u.id, u.name || u.email]));

  return groups
    .map((g) => ({
      name: g.paidById ? (userNames.get(g.paidById) ?? 'Usuário removido') : 'Não informado',
      value: Number(g._sum.amount || 0),
      count: g._count,
      isUnassigned: !g.paidById,
    }))
    .sort((a, b) => Number(a.isUnassigned) - Number(b.isUnassigned) || b.value - a.value)
    .map(({ isUnassigned, ...entry }, index) => ({
      ...entry,
      color: isUnassigned ? '#94a3b8' : getCategoricalColor(index),
    }));
}

export async function getAvailableRange() {
  const session = await getServerSession(authOptions);
  if (!session) return { minDate: null, maxDate: null };

  const result = await prisma.transaction.aggregate({
    where: {
      workspaceId: session.user.workspaceId,
    },
    _min: {
      date: true,
    },
    _max: {
      date: true,
    },
  });

  return {
    minDate: result._min.date?.toISOString() || null,
    maxDate: result._max.date?.toISOString() || null,
  };
}

export async function getTransactionCountsByYear() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const transactions = await prisma.transaction.findMany({
    where: { workspaceId: session.user.workspaceId },
    select: { competence: true },
  });

  const counts: Record<string, number> = {};
  transactions.forEach((t) => {
    const year = t.competence.getUTCFullYear().toString();
    counts[year] = (counts[year] || 0) + 1;
  });

  return counts;
}

export async function getSummaryCount(
  startDate: Date | undefined,
  endDate: Date | undefined,
  month: number,
  year: number,
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const workspaceId = session.user.workspaceId;

  const budgetCount = await prisma.budget.count({
    where: { workspaceId, month, year },
  });

  const goalWhere: Prisma.GoalWhereInput = { workspaceId };
  if (startDate && endDate) {
    goalWhere.OR = [{ deadline: null }, { deadline: { gte: startDate, lte: endDate } }];
  }
  const goalCount = await prisma.goal.count({ where: goalWhere });

  const debtWhere: Prisma.DebtWhereInput = { workspaceId, status: { in: DEBT_OPEN_STATUSES } };
  if (startDate && endDate) {
    debtWhere.startDate = { lte: endDate };
    debtWhere.OR = [{ endDate: null }, { endDate: { gte: startDate } }];
  }
  const debtCount = await prisma.debt.count({ where: debtWhere });

  return { goalsCount: goalCount, budgetsCount: budgetCount, debtsCount: debtCount };
}

export async function getDebtsData() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const debts = await prisma.debt.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      status: { in: DEBT_OPEN_STATUSES },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 4,
  });

  const totalDebt = debts.reduce((acc, d) => acc + Number(d.currentValue), 0);

  return {
    debts: debts.map((d) => ({
      id: d.id,
      name: d.name,
      currentValue: Number(d.currentValue),
      initialValue: Number(d.initialValue),
      minimumPayment: Number(d.minimumPayment),
      installments: d.installments,
    })),
    totalDebt,
  };
}
