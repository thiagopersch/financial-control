import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getServerSession } from "next-auth";

export async function getDashboardStats(start?: Date, end?: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const transactions = await prisma.transaction.findMany({
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
  });

  const accounts = await prisma.account.findMany({
    where: { workspaceId: session.user.workspaceId },
  });

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

  const totalIncome = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const pendingToPay = transactions
    .filter((t) => t.type === TransactionType.EXPENSE && t.status === "PENDING")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    totalBalance,
    balance,
    pendingToPay,
  };
}

export async function getBudgetData(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

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
  if (!session) throw new Error("Unauthorized");

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

export async function getRecentTransactions(start?: Date, end?: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

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
      date: "desc",
    },
    include: {
      category: true,
      supplier: true,
    },
  });
}

export async function getChartData(month: Date, isFullYear: boolean = false) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const monthsToFetch = isFullYear ? 12 : 6;
  const baseDate = isFullYear ? new Date(month.getFullYear(), 11, 1) : month;

  const periods = Array.from({ length: monthsToFetch })
    .map((_, i) => {
      const date = subMonths(baseDate, i);
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, "MMM", { locale: ptBR }),
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
  if (!session) throw new Error("Unauthorized");

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
