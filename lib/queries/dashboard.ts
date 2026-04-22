import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionType } from '@prisma/client';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getServerSession } from 'next-auth';

export async function getDashboardStats(start?: Date, end?: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const workspaceId = session.user.workspaceId;

  const allTransactions = await prisma.transaction.findMany({
    where: { workspaceId },
  });

  const accounts = await prisma.account.findMany({
    where: { workspaceId },
    include: { creditCardDetails: true },
  });

  const creditCardAvailableLimit = accounts.reduce(
    (acc, a) =>
      acc +
      (a.creditCardDetails
        ? Number(a.creditCardDetails.limit) - Number(a.creditCardDetails.usedAmount)
        : 0),
    0,
  );

  const totalBalance = creditCardAvailableLimit;

  const filteredTransactions =
    start && end
      ? allTransactions.filter((t) => t.date >= start && t.date <= end)
      : allTransactions;

  const totalIncome = filteredTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

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

  if (start && end) {
    const lastStart = subMonths(start, 1);
    const lastEnd = subMonths(end, 1);

    const lastTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId,
        date: { gte: lastStart, lte: lastEnd },
      },
    });

    lastMonthIncome = lastTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + Number(t.amount), 0);

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

  const creditCardAvailableLimit = accounts.reduce(
    (acc, a) =>
      acc +
      (a.creditCardDetails
        ? Number(a.creditCardDetails.limit) - Number(a.creditCardDetails.usedAmount)
        : 0),
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
      date: {
        gte: startOfMonth(new Date(year, month - 1)),
        lte: endOfMonth(new Date(year, month - 1)),
      },
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

export async function getRecentTransactions(start?: Date, end?: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  return await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      ...(start && end
        ? {
            date: {
              gte: start,
              lte: end,
            },
          }
        : {}),
    },
    take: 10,
    orderBy: {
      date: 'desc',
    },
    include: {
      category: true,
      supplier: true,
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
      _min: { date: true },
      _max: { date: true },
    });
    if (result._min.date && result._max.date) {
      const minDate = new Date(result._min.date);
      const maxDate = new Date(result._max.date);
      const diffMonths =
        (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        (maxDate.getMonth() - minDate.getMonth()) +
        1;
      monthsToFetch = Math.max(diffMonths, 12);
      baseDate = maxDate;
    } else {
      monthsToFetch = 12;
      baseDate = new Date();
    }
  }

  const periods = Array.from({ length: monthsToFetch })
    .map((_, i) => {
      const date = subMonths(baseDate, i);
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, 'MMM', { locale: ptBR }),
      };
    })
    .reverse();

  const chartData = await Promise.all(
    periods.map(async (m) => {
      const transactions = await prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          date: {
            gte: m.start,
            lte: m.end,
          },
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

export async function getCategoryData(start?: Date, end?: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      type: TransactionType.EXPENSE,
      ...(start && end
        ? {
            date: {
              gte: start,
              lte: end,
            },
          }
        : {}),
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
    select: { date: true },
  });

  const counts: Record<string, number> = {};
  transactions.forEach((t) => {
    const year = new Date(t.date).getFullYear().toString();
    counts[year] = (counts[year] || 0) + 1;
  });

  return counts;
}

export async function getDebtsData() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const debts = await prisma.debt.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      isActive: true,
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
      minimumPayment: Number(d.minimumPayment),
      installments: d.installments,
    })),
    totalDebt,
  };
}
