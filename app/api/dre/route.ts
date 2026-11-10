import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Janela limitada (1–36 meses): `months` vinha sem teto da query string.
    const months = Math.min(Math.max(parseInt(searchParams.get('months') || '6') || 6, 1), 36);

    const now = new Date();
    const startDate = startOfMonth(subMonths(now, months - 1));
    const endDate = endOfMonth(now);

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        date: { gte: startDate, lte: endDate },
      },
      select: { type: true, amount: true, date: true, category: { select: { name: true } } },
    });

    const monthsInterval = eachMonthOfInterval({ start: startDate, end: endDate });

    const chartData = monthsInterval.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthTransactions = transactions.filter(
        (t) => new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd,
      );

      const revenue = monthTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        period: format(month, 'MMM/yy', { locale: ptBR }),
        revenue,
        expense,
        result: revenue - expense,
      };
    });

    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const expensesByCategory = currentMonthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce(
        (acc, t) => {
          const cat = t.category.name;
          if (!acc[cat]) {
            acc[cat] = 0;
          }
          acc[cat] += Number(t.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

    const totalCurrentExpense = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);
    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalCurrentExpense > 0 ? (amount / totalCurrentExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpense,
        netResult: totalRevenue - totalExpense,
      },
      chartData,
      expensesByCategory: expensesByCategoryArray,
    });
  } catch (error) {
    console.error('Error fetching DRE:', error);
    return NextResponse.json({ error: 'Erro ao buscar DRE' }, { status: 500 });
  }
}
