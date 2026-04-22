import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import {
  addDays,
  startOfDay,
  eachDayOfInterval,
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  isWeekend,
} from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, days);

    const accounts = await prisma.account.findMany({
      where: { workspaceId: session.user.workspaceId },
      include: { creditCardDetails: true },
    });

    const currentBalance = accounts.reduce(
      (sum, account) =>
        sum +
        (account.creditCardDetails
          ? Number(account.creditCardDetails.limit) - Number(account.creditCardDetails.usedAmount)
          : 0),
      0,
    );

    const paidTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        status: 'PAID',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        status: 'PENDING',
        OR: [
          { dueDate: { gte: startDate, lte: endDate } },
          { date: { gte: startDate, lte: endDate } },
        ],
      },
    });

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      },
    });

    const scheduledTransactions = await prisma.scheduledTransaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        isActive: true,
        nextRun: { lte: endDate },
      },
    });

    const chartData: Array<{
      date: string;
      balance: number;
      income: number;
      expense: number;
    }> = [];

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    let runningBalance = currentBalance;
    let totalIncome = 0;
    let totalExpense = 0;

    for (const day of allDays) {
      const dayStart = startOfDay(day);
      const dayEnd = addDays(dayStart, 1);

      const dayPaidIncome = paidTransactions
        .filter(
          (t) => t.type === 'INCOME' && new Date(t.date) >= dayStart && new Date(t.date) < dayEnd,
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayPaidExpense = paidTransactions
        .filter(
          (t) => t.type === 'EXPENSE' && new Date(t.date) >= dayStart && new Date(t.date) < dayEnd,
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayPendingIncome = pendingTransactions
        .filter((t) => {
          const dueDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
          return t.type === 'INCOME' && dueDate >= dayStart && dueDate < dayEnd;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayPendingExpense = pendingTransactions
        .filter((t) => {
          const dueDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
          return t.type === 'EXPENSE' && dueDate >= dayStart && dueDate < dayEnd;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      let dayRecurringIncome = 0;
      let dayRecurringExpense = 0;

      for (const recurring of recurringTransactions) {
        const recurringDate = new Date(recurring.startDate);
        const shouldInclude = checkRecurringDate(recurring, day);

        if (shouldInclude) {
          if (recurring.type === 'INCOME') {
            dayRecurringIncome += Number(recurring.amount);
          } else if (recurring.type === 'EXPENSE') {
            dayRecurringExpense += Number(recurring.amount);
          }
        }
      }

      for (const scheduled of scheduledTransactions) {
        const nextRun = new Date(scheduled.nextRun);
        if (nextRun >= dayStart && nextRun < dayEnd) {
          if (scheduled.type === 'INCOME') {
            dayRecurringIncome += Number(scheduled.amount);
          } else if (scheduled.type === 'EXPENSE') {
            dayRecurringExpense += Number(scheduled.amount);
          }
        }
      }

      const dayIncome = dayPaidIncome + dayPendingIncome + dayRecurringIncome;
      const dayExpense = dayPaidExpense + dayPendingExpense + dayRecurringExpense;

      runningBalance += dayIncome - dayExpense;
      totalIncome += dayIncome;
      totalExpense += dayExpense;

      chartData.push({
        date: format(day, 'yyyy-MM-dd'),
        balance: Math.round(runningBalance * 100) / 100,
        income: dayIncome,
        expense: dayExpense,
      });
    }

    const deficitDays = chartData
      .filter((d) => d.balance < 0)
      .map((d) => ({ date: d.date, amount: d.balance }));

    const summary = {
      currentBalance,
      projectedEndBalance: runningBalance,
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense,
      lowestBalance: chartData.reduce(
        (min, d) => (d.balance < min.amount ? { date: d.date, amount: d.balance } : min),
        { date: chartData[0]?.date || '', amount: Number.MAX_VALUE },
      ),
      highestBalance: chartData.reduce(
        (max, d) => (d.balance > max.amount ? { date: d.date, amount: d.balance } : max),
        { date: chartData[0]?.date || '', amount: Number.MIN_VALUE },
      ),
      deficitDays,
    };

    return NextResponse.json({ chartData, summary });
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    return NextResponse.json({ error: 'Erro ao buscar fluxo de caixa' }, { status: 500 });
  }
}

function checkRecurringDate(recurring: any, date: Date): boolean {
  const startDate = new Date(recurring.startDate);
  const endDate = recurring.endDate ? new Date(recurring.endDate) : null;

  if (date < startDate) return false;
  if (endDate && date > endDate) return false;

  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay();

  switch (recurring.frequency) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      return dayOfWeek === new Date(startDate).getDay();
    case 'MONTHLY':
      return (
        dayOfMonth === recurring.dayOfMonth ||
        (dayOfMonth === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() &&
          recurring.dayOfMonth > new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())
      );
    case 'BUSINESS_DAYS':
      return !isWeekend(date);
    case 'CUSTOM':
      return (
        recurring.customDays?.includes(dayOfWeek) || recurring.customDays?.includes(dayOfMonth)
      );
    default:
      return false;
  }
}
