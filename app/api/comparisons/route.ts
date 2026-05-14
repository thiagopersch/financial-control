import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'month';

    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (type === 'year') {
      currentStart = startOfYear(now);
      currentEnd = endOfYear(now);
      previousStart = startOfYear(subYears(now, 1));
      previousEnd = endOfYear(subYears(now, 1));
    } else if (type === 'account' || type === 'cost_center') {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = endOfMonth(subMonths(now, 1));
    } else {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = endOfMonth(subMonths(now, 1));
    }

    const [currentTransactions, previousTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          status: 'PAID',
          date: { gte: currentStart, lte: currentEnd },
        },
        include: { category: true, account: true, costCenter: true },
      }),
      prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          status: 'PAID',
          date: { gte: previousStart, lte: previousEnd },
        },
        include: { category: true, account: true, costCenter: true },
      }),
    ]);

    const calculateTotals = (transactions: typeof currentTransactions) => {
      return transactions.reduce(
        (acc, t) => {
          if (t.type === 'INCOME') acc.income += Number(t.amount);
          else if (t.type === 'EXPENSE') acc.expense += Number(t.amount);
          return acc;
        },
        { income: 0, expense: 0 },
      );
    };

    const currentTotals = calculateTotals(currentTransactions);
    const previousTotals = calculateTotals(previousTransactions);

    const incomeChange =
      previousTotals.income > 0
        ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100
        : 0;

    const expenseChange =
      previousTotals.expense > 0
        ? ((currentTotals.expense - previousTotals.expense) / previousTotals.expense) * 100
        : 0;

    const netChange =
      previousTotals.income - previousTotals.expense !== 0
        ? ((currentTotals.income -
            currentTotals.expense -
            (previousTotals.income - previousTotals.expense)) /
            Math.abs(previousTotals.income - previousTotals.expense)) *
          100
        : 0;

    let chartData: { label: string; current: number; previous: number }[] = [];

    if (type === 'month' || type === 'year') {
      chartData = [
        {
          label: 'Receitas',
          current: currentTotals.income,
          previous: previousTotals.income,
        },
        {
          label: 'Despesas',
          current: currentTotals.expense,
          previous: previousTotals.expense,
        },
        {
          label: 'Resultado',
          current: currentTotals.income - currentTotals.expense,
          previous: previousTotals.income - previousTotals.expense,
        },
      ];
    } else if (type === 'category') {
      const categories = [...new Set(currentTransactions.map((t) => t.category.name))];
      chartData = categories.map((cat) => {
        const currentCatTotal = currentTransactions
          .filter((t) => t.category.name === cat && t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const previousCatTotal = previousTransactions
          .filter((t) => t.category.name === cat && t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { label: cat, current: currentCatTotal, previous: previousCatTotal };
      });
    } else if (type === 'account') {
      const accounts = [...new Set(currentTransactions.map((t) => t.account?.name || 'Sem conta'))];
      chartData = accounts.map((acc) => {
        const currentAccTotal = currentTransactions
          .filter((t) => (t.account?.name || 'Sem conta') === acc)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const previousAccTotal = previousTransactions
          .filter((t) => (t.account?.name || 'Sem conta') === acc)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { label: acc, current: currentAccTotal, previous: previousAccTotal };
      });
    } else if (type === 'cost_center') {
      const centers = [
        ...new Set(currentTransactions.map((t) => t.costCenter?.name || 'Sem centro')),
      ];
      chartData = centers.map((cc) => {
        const currentCcTotal = currentTransactions
          .filter((t) => (t.costCenter?.name || 'Sem centro') === cc)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const previousCcTotal = previousTransactions
          .filter((t) => (t.costCenter?.name || 'Sem centro') === cc)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { label: cc, current: currentCcTotal, previous: previousCcTotal };
      });
    }

    return NextResponse.json({
      chartData,
      summary: {
        incomeChange,
        expenseChange,
        netChange,
      },
    });
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json({ error: 'Erro ao buscar comparativos' }, { status: 500 });
  }
}
