import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'total_expense';
    const period = searchParams.get('period') || 'current_month';

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'current_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = endOfMonth(now);
        break;
      case 'last_6_months':
        startDate = startOfMonth(subMonths(now, 6));
        endDate = endOfMonth(now);
        break;
      case 'current_year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        status: 'PAID',
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: true,
        account: true,
        costCenter: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netResult = totalIncome - totalExpense;

    const categoryData = transactions.reduce(
      (acc, t) => {
        const catName = t.category?.name || 'Sem categoria';
        if (!acc[catName]) acc[catName] = 0;
        acc[catName] += Number(t.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const accountData = transactions.reduce(
      (acc, t) => {
        const accName = t.account?.name || 'Sem conta';
        if (!acc[accName]) acc[accName] = 0;
        acc[accName] += Number(t.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const costCenterData = transactions.reduce(
      (acc, t) => {
        const ccName = t.costCenter?.name || 'Sem centro';
        if (!acc[ccName]) acc[ccName] = 0;
        acc[ccName] += Number(t.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    let chartData: { name: string; value: number; fill?: string }[] = [];
    let tableData: { category: string; value: number; percentage: string }[] = [];

    switch (metric) {
      case 'total_income': {
        const incomeByCategory = transactions
          .filter((t) => t.type === 'INCOME')
          .reduce(
            (acc, t) => {
              const catName = t.category?.name || 'Sem categoria';
              if (!acc[catName]) acc[catName] = 0;
              acc[catName] += Number(t.amount);
              return acc;
            },
            {} as Record<string, number>,
          );
        chartData = Object.entries(incomeByCategory).map(([name, value]) => ({
          name,
          value,
        }));
        tableData = Object.entries(incomeByCategory)
          .map(([category, value]) => ({
            category,
            value,
            percentage: totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1) : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      }
      case 'total_expense': {
        const expenseByCategory = transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce(
            (acc, t) => {
              const catName = t.category?.name || 'Sem categoria';
              if (!acc[catName]) acc[catName] = 0;
              acc[catName] += Number(t.amount);
              return acc;
            },
            {} as Record<string, number>,
          );
        chartData = Object.entries(expenseByCategory).map(([name, value]) => ({
          name,
          value,
        }));
        tableData = Object.entries(expenseByCategory)
          .map(([category, value]) => ({
            category,
            value,
            percentage: totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      }
      case 'net_result':
        chartData = [
          { name: 'Receitas', value: totalIncome },
          { name: 'Despesas', value: totalExpense },
          { name: 'Resultado', value: netResult },
        ];
        tableData = [
          { category: 'Receitas', value: totalIncome, percentage: '100' },
          { category: 'Despesas', value: totalExpense, percentage: '100' },
          { category: 'Resultado Líquido', value: netResult, percentage: '100' },
        ];
        break;
      case 'by_category':
        chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
        tableData = Object.entries(categoryData)
          .map(([category, value]) => ({
            category,
            value,
            percentage:
              totalIncome + totalExpense > 0
                ? ((value / (totalIncome + totalExpense)) * 100).toFixed(1)
                : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      case 'by_account':
        chartData = Object.entries(accountData).map(([name, value]) => ({ name, value }));
        tableData = Object.entries(accountData)
          .map(([category, value]) => ({
            category,
            value,
            percentage:
              totalIncome + totalExpense > 0
                ? ((value / (totalIncome + totalExpense)) * 100).toFixed(1)
                : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      case 'by_cost_center':
        chartData = Object.entries(costCenterData).map(([name, value]) => ({ name, value }));
        tableData = Object.entries(costCenterData)
          .map(([category, value]) => ({
            category,
            value,
            percentage:
              totalIncome + totalExpense > 0
                ? ((value / (totalIncome + totalExpense)) * 100).toFixed(1)
                : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      default:
        chartData = [];
        tableData = [];
    }

    const chartColors = [
      '#10B981',
      '#3B82F6',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#EC4899',
      '#14B8A6',
      '#F97316',
      '#6366F1',
      '#84CC16',
    ];

    chartData = chartData.map((item, idx) => ({
      ...item,
      fill: chartColors[idx % chartColors.length],
    }));

    return NextResponse.json({
      chartData,
      tableData,
      summary: {
        totalIncome,
        totalExpense,
        netResult,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 });
  }
}
