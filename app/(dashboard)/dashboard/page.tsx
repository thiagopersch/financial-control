import { BudgetProgressChart } from '@/components/dashboard/budget-progress-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { DebtProgressChart } from '@/components/dashboard/debt-progress-chart';
import { GoalProgressChart } from '@/components/dashboard/goal-progress-chart';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { StatusChart } from '@/components/dashboard/status-chart';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { SupplierChart } from '@/components/dashboard/supplier-chart';
import { MonthSelector } from '@/components/month-selector';
import {
  getAvailableRange,
  getBudgetData,
  getCategoryData,
  getChartData,
  getDashboardStats,
  getDebtsData,
  getGoalsData,
  getRecentTransactions,
  getStatusData,
  getSummaryCount,
  getSupplierData,
  getTransactionCountsByYear,
} from '@/lib/queries/dashboard';
import { endOfMonth, parse, startOfMonth } from 'date-fns';

export default async function DashboardPage(props: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const year = searchParams.year;
  const month = searchParams.month;

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let selectedMonth: Date;

  if (!year || year === 'all') {
    // Sem parâmetros ou Todos os Períodos - sem filtro de data
    selectedMonth = new Date();
    startDate = undefined;
    endDate = undefined;
  } else if (year && month === 'all') {
    // Ano completo
    startDate = startOfMonth(new Date(parseInt(year), 0));
    endDate = endOfMonth(new Date(parseInt(year), 11));
    selectedMonth = new Date(parseInt(year), 0);
  } else if (month && month !== 'all') {
    // Mês específico
    selectedMonth = parse(`${year}-${month}`, 'yyyy-MM', new Date());
    startDate = startOfMonth(selectedMonth);
    endDate = endOfMonth(selectedMonth);
  } else {
    // Apenas ano selecionado sem mês específico - treating as full year
    startDate = startOfMonth(new Date(parseInt(year), 0));
    endDate = endOfMonth(new Date(parseInt(year), 11));
    selectedMonth = new Date(parseInt(year), 0);
  }

  const isFullYear = (year && year !== 'all' && !month) || month === 'all';
  const isAllPeriod = year === 'all';

  // Pass both start and end dates to queries to support flexible periods (monthly or yearly)
  const stats = await getDashboardStats(startDate, endDate);
  const chartData = await getChartData(selectedMonth, isFullYear, isAllPeriod);
  const categoryData = await getCategoryData(startDate, endDate);
  const statusData = await getStatusData(startDate, endDate);
  const supplierData = await getSupplierData(startDate, endDate);
  const { debts } = await getDebtsData();
  const budgets = await getBudgetData(selectedMonth.getMonth() + 1, selectedMonth.getFullYear());
  const goals = await getGoalsData();
  const recentTransactions = await getRecentTransactions(startDate, endDate);
  const availableRange = await getAvailableRange();
  const transactionCounts = await getTransactionCountsByYear();

  const { goalsCount, budgetsCount, debtsCount } = await getSummaryCount(
    startDate,
    endDate,
    selectedMonth.getMonth() + 1,
    selectedMonth.getFullYear(),
  );

  return (
    <div className="animate-in fade-in space-y-8 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças</p>
        </div>
        <MonthSelector
          availableRange={availableRange}
          transactionCounts={transactionCounts}
          useNextYears
        />
      </div>

      <StatsCards stats={stats} />

      <SummaryCard goalsCount={goalsCount} budgetsCount={budgetsCount} debtsCount={debtsCount} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-4">
          <OverviewChart data={chartData} isFullYear={isFullYear} isAllPeriod={isAllPeriod} />
        </div>
        <div className="lg:col-span-3">
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatusChart data={statusData} />
        <SupplierChart data={supplierData} />
        <DebtProgressChart debts={debts} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BudgetProgressChart budgets={budgets} />
        <GoalProgressChart goals={goals} />
      </div>

      <RecentTransactions
        transactions={recentTransactions.map((t) => ({ ...t, amount: Number(t.amount) }))}
      />
    </div>
  );
}
