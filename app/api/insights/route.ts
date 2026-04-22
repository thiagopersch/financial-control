import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const [currentMonthTransactions, previousMonthTransactions, categories] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
        include: { category: true },
      }),
      prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          date: { gte: previousMonthStart, lte: previousMonthEnd },
        },
        include: { category: true },
      }),
      prisma.category.findMany({
        where: {
          workspaceId: session.user.workspaceId,
        },
      }),
    ]);

    const calculateTotals = (transactions: typeof currentMonthTransactions) => {
      return transactions.reduce(
        (acc, t) => {
          if (t.type === 'INCOME') {
            acc.income += Number(t.amount);
          } else if (t.type === 'EXPENSE') {
            acc.expense += Number(t.amount);
          }
          return acc;
        },
        { income: 0, expense: 0 },
      );
    };

    const currentTotals = calculateTotals(currentMonthTransactions);
    const previousTotals = calculateTotals(previousMonthTransactions);

    const summary = {
      totalIncome: currentTotals.income,
      totalExpense: currentTotals.expense,
      netResult: currentTotals.income - currentTotals.expense,
      previousIncome: previousTotals.income,
      previousExpense: previousTotals.expense,
      previousNetResult: previousTotals.income - previousTotals.expense,
    };

    const categoryExpenses = currentMonthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce(
        (acc, t) => {
          const catId = t.categoryId;
          if (!acc[catId]) {
            acc[catId] = { category: t.category.name, color: t.category.color, amount: 0 };
          }
          acc[catId].amount += Number(t.amount);
          return acc;
        },
        {} as Record<string, { category: string; color: string; amount: number }>,
      );

    const previousCategoryExpenses = previousMonthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce(
        (acc, t) => {
          const catId = t.categoryId;
          if (!acc[catId]) {
            acc[catId] = { amount: 0 };
          }
          acc[catId].amount += Number(t.amount);
          return acc;
        },
        {} as Record<string, { amount: number }>,
      );

    const comparisons = Object.values(categoryExpenses).map((cat) => {
      const catId = Object.keys(categoryExpenses).find((k) => categoryExpenses[k] === cat);
      const prevAmount = catId ? previousCategoryExpenses[catId]?.amount || 0 : 0;
      const change = prevAmount > 0 ? ((cat.amount - prevAmount) / prevAmount) * 100 : 0;

      return {
        category: cat.category,
        currentMonth: cat.amount,
        previousMonth: prevAmount,
        change,
        color: cat.color,
      };
    });

    const totalExpense = Object.values(categoryExpenses).reduce((sum, c) => sum + c.amount, 0);

    const highlights = Object.values(categoryExpenses)
      .map((cat) => {
        const catId = Object.keys(categoryExpenses).find((k) => categoryExpenses[k] === cat);
        const prevAmount = catId ? previousCategoryExpenses[catId]?.amount || 0 : 0;
        const trend = cat.amount > prevAmount ? 'up' : cat.amount < prevAmount ? 'down' : 'stable';

        return {
          category: cat.category,
          amount: cat.amount,
          percentage: totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0,
          trend,
          color: cat.color,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const insights: Array<{
      type: 'increase' | 'decrease' | 'warning' | 'info';
      title: string;
      description: string;
    }> = [];

    if (summary.netResult < 0) {
      insights.push({
        type: 'warning',
        title: 'Despesas superiores às receitas',
        description: `Neste mês você gastou R$ ${Math.abs(summary.netResult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais do que recebeu.`,
      });
    }

    if (summary.totalExpense > previousTotals.expense) {
      const increase = (
        ((summary.totalExpense - previousTotals.expense) / previousTotals.expense) *
        100
      ).toFixed(1);
      insights.push({
        type: 'decrease',
        title: 'Aumento nas despesas',
        description: `Suas despesas aumentaram ${increase}% em relação ao mês anterior.`,
      });
    }

    const topCategory = highlights[0];
    if (topCategory) {
      insights.push({
        type: 'info',
        title: `Maior gasto: ${topCategory.category}`,
        description: `Esta categoria representa ${topCategory.percentage.toFixed(1)}% do total das suas despesas.`,
      });
    }

    if (summary.totalIncome > previousTotals.income) {
      const increase = (
        ((summary.totalIncome - previousTotals.income) / previousTotals.income) *
        100
      ).toFixed(1);
      insights.push({
        type: 'increase',
        title: 'Aumento nas receitas',
        description: `Suas receitas aumentaram ${increase}% em relação ao mês anterior.`,
      });
    }

    return NextResponse.json({
      summary,
      comparisons,
      highlights,
      insights,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Erro ao buscar insights' }, { status: 500 });
  }
}
