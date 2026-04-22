import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'month';

    const now = new Date();
    const currentStart = startOfMonth(now);
    const currentEnd = endOfMonth(now);
    const previousStart = startOfMonth(subMonths(now, 1));
    const previousEnd = endOfMonth(subMonths(now, 1));

    const [currentTransactions, previousTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          status: 'PAID',
          date: { gte: currentStart, lte: currentEnd },
        },
        include: { category: true, account: true },
      }),
      prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          status: 'PAID',
          date: { gte: previousStart, lte: previousEnd },
        },
        include: { category: true, account: true },
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

    if (type === 'month') {
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
