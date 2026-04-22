import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { startOfMonth, subMonths, addMonths, format, eachMonthOfInterval } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '3');
    const forecastMonths = 3;

    const now = new Date();
    const historicalStart = startOfMonth(subMonths(now, months));
    const historicalEnd = startOfMonth(now);

    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        type: 'EXPENSE',
        status: 'PAID',
        date: { gte: historicalStart, lte: historicalEnd },
      },
      include: { category: true },
    });

    const monthInterval = eachMonthOfInterval({ start: historicalStart, end: historicalEnd });

    const monthlyTotals = monthInterval.map((month) => {
      const monthStart = startOfMonth(month);
      const total = historicalTransactions
        .filter((t) => {
          const date = new Date(t.date);
          return (
            date.getMonth() === monthStart.getMonth() &&
            date.getFullYear() === monthStart.getFullYear()
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return total;
    });

    const average =
      monthlyTotals.length > 0
        ? monthlyTotals.reduce((sum, v) => sum + v, 0) / monthlyTotals.length
        : 0;

    const trend =
      monthlyTotals.length >= 2
        ? monthlyTotals[monthlyTotals.length - 1] > monthlyTotals[monthlyTotals.length - 2]
          ? 1
          : -1
        : 0;

    const forecastMonthsArray = eachMonthOfInterval({
      start: addMonths(startOfMonth(now), 1),
      end: addMonths(startOfMonth(now), forecastMonths),
    });

    const chartData = monthInterval.concat(forecastMonthsArray).map((month, index) => {
      const isForecast = index >= monthInterval.length;
      const value = isForecast
        ? average + trend * average * 0.1 * (index - monthInterval.length + 1)
        : monthlyTotals[index];

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        actual: isForecast ? null : value,
        forecast: value,
      };
    });

    const categoryTotals = historicalTransactions.reduce(
      (acc, t) => {
        const cat = t.category.name;
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(Number(t.amount));
        return acc;
      },
      {} as Record<string, number[]>,
    );

    const categoryForecast = Object.entries(categoryTotals)
      .map(([category, values]) => {
        const catAverage = values.reduce((sum, v) => sum + v, 0) / values.length;
        const lastMonth = values[values.length - 1] || catAverage;
        const trend = lastMonth > catAverage ? 'up' : lastMonth < catAverage ? 'down' : 'stable';

        return {
          category,
          average: catAverage,
          forecast: catAverage,
          trend,
        };
      })
      .sort((a, b) => b.forecast - a.forecast)
      .slice(0, 10);

    return NextResponse.json({
      chartData,
      categoryForecast,
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json({ error: 'Erro ao buscar previsão' }, { status: 500 });
  }
}

import { ptBR } from 'date-fns/locale';
