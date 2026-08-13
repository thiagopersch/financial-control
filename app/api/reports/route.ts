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

    const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE');

    type Grouped = Record<string, { value: number; color: string | null }>;

    const groupBy = (
      list: typeof transactions,
      getName: (t: (typeof transactions)[number]) => string,
      getColor: (t: (typeof transactions)[number]) => string | null,
    ) =>
      list.reduce((acc, t) => {
        const name = getName(t);
        if (!acc[name]) acc[name] = { value: 0, color: getColor(t) };
        acc[name].value += Number(t.amount);
        return acc;
      }, {} as Grouped);

    const categoryData = groupBy(
      expenseTransactions,
      (t) => t.category?.name || 'Sem categoria',
      (t) => t.category?.color || null,
    );

    const accountData = groupBy(
      expenseTransactions,
      (t) => t.account?.name || 'Sem conta',
      (t) => t.account?.color || null,
    );

    const costCenterData = groupBy(
      expenseTransactions,
      (t) => t.costCenter?.name || 'Sem centro',
      (t) => t.costCenter?.color || null,
    );

    let chartData: { name: string; value: number; fill?: string | null }[] = [];
    let tableData: { category: string; value: number; percentage: string }[] = [];

    switch (metric) {
      case 'total_income': {
        const incomeByCategory = groupBy(
          transactions.filter((t) => t.type === 'INCOME'),
          (t) => t.category?.name || 'Sem categoria',
          (t) => t.category?.color || null,
        );
        chartData = Object.entries(incomeByCategory).map(([name, g]) => ({
          name,
          value: g.value,
          fill: g.color,
        }));
        tableData = Object.entries(incomeByCategory)
          .map(([category, g]) => ({
            category,
            value: g.value,
            percentage: totalIncome > 0 ? ((g.value / totalIncome) * 100).toFixed(1) : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      }
      case 'total_expense': {
        chartData = Object.entries(categoryData).map(([name, g]) => ({
          name,
          value: g.value,
          fill: g.color,
        }));
        tableData = Object.entries(categoryData)
          .map(([category, g]) => ({
            category,
            value: g.value,
            percentage: totalExpense > 0 ? ((g.value / totalExpense) * 100).toFixed(1) : '0.0',
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
        chartData = Object.entries(categoryData).map(([name, g]) => ({
          name,
          value: g.value,
          fill: g.color,
        }));
        tableData = Object.entries(categoryData)
          .map(([category, g]) => ({
            category,
            value: g.value,
            percentage: totalExpense > 0 ? ((g.value / totalExpense) * 100).toFixed(1) : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      case 'by_account':
        chartData = Object.entries(accountData).map(([name, g]) => ({
          name,
          value: g.value,
          fill: g.color,
        }));
        tableData = Object.entries(accountData)
          .map(([category, g]) => ({
            category,
            value: g.value,
            percentage: totalExpense > 0 ? ((g.value / totalExpense) * 100).toFixed(1) : '0.0',
          }))
          .sort((a, b) => b.value - a.value);
        break;
      case 'by_cost_center':
        chartData = Object.entries(costCenterData).map(([name, g]) => ({
          name,
          value: g.value,
          fill: g.color,
        }));
        tableData = Object.entries(costCenterData)
          .map(([category, g]) => ({
            category,
            value: g.value,
            percentage: totalExpense > 0 ? ((g.value / totalExpense) * 100).toFixed(1) : '0.0',
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
      fill: item.fill || chartColors[idx % chartColors.length],
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
