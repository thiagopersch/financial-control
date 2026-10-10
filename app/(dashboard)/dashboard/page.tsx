import { BudgetProgressChart } from '@/components/dashboard/budget-progress-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { DebtProgressChart } from '@/components/dashboard/debt-progress-chart';
import { GoalProgressChart } from '@/components/dashboard/goal-progress-chart';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { PaidByChart } from '@/components/dashboard/paid-by-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { StatusChart } from '@/components/dashboard/status-chart';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { SupplierChart } from '@/components/dashboard/supplier-chart';
import { MonthSelector } from '@/components/month-selector';
import { PeriodLoading } from '@/components/ui/loading-overlay';
import {
  getBudgetData,
  getCategoryData,
  getChartData,
  getDashboardStats,
  getDebtsData,
  getGoalsData,
  getPaidByData,
  getRecentTransactions,
  getStatusData,
  getSummaryCount,
  getSupplierData,
  getTransactionCountsByYear,
} from '@/lib/queries/dashboard';
import { competenceRange } from '@/lib/utils/competence';
import { endOfMonth, parse, startOfMonth } from 'date-fns';

/** Overlay de loading cobre o card inteiro do gráfico dentro do grid. */
const CHART_LOADING_CLASS = 'rounded-lg [&>[data-slot=card]]:h-full';

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

  // Transações são filtradas por competência; metas e dívidas seguem usando datas reais.
  const competence =
    startDate && endDate
      ? isFullYear
        ? competenceRange(selectedMonth.getFullYear())
        : competenceRange(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)
      : undefined;

  const [
    stats,
    chartData,
    categoryData,
    statusData,
    supplierData,
    paidByData,
    { debts },
    budgets,
    goals,
    recentTransactions,
    transactionCounts,
  ] = await Promise.all([
    getDashboardStats(competence),
    getChartData(selectedMonth, isFullYear, isAllPeriod),
    getCategoryData(competence),
    getStatusData(competence),
    getSupplierData(competence),
    getPaidByData(competence),
    getDebtsData(),
    getBudgetData(selectedMonth.getMonth() + 1, selectedMonth.getFullYear()),
    getGoalsData(),
    getRecentTransactions(competence),
    getTransactionCountsByYear(),
  ]);

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
        <MonthSelector transactionCounts={transactionCounts} />
      </div>

      <StatsCards stats={stats} isFullYear={!!isFullYear} />

      <SummaryCard goalsCount={goalsCount} budgetsCount={budgetsCount} debtsCount={debtsCount} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <PeriodLoading size="md" className={`${CHART_LOADING_CLASS} md:col-span-2 lg:col-span-4`}>
          <OverviewChart data={chartData} isFullYear={isFullYear} isAllPeriod={isAllPeriod} />
        </PeriodLoading>
        <PeriodLoading size="md" className={`${CHART_LOADING_CLASS} lg:col-span-3`}>
          <CategoryPieChart data={categoryData} />
        </PeriodLoading>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PeriodLoading size="md" className={CHART_LOADING_CLASS}>
          <StatusChart data={statusData} />
        </PeriodLoading>
        <PeriodLoading size="md" className={CHART_LOADING_CLASS}>
          <SupplierChart data={supplierData} />
        </PeriodLoading>
        <PeriodLoading size="md" className={CHART_LOADING_CLASS}>
          <PaidByChart data={paidByData} />
        </PeriodLoading>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DebtProgressChart debts={debts} />
        <PeriodLoading size="md" className={CHART_LOADING_CLASS}>
          <BudgetProgressChart budgets={budgets} />
        </PeriodLoading>
        <GoalProgressChart goals={goals} />
      </div>

      <PeriodLoading size="md" className="rounded-lg">
        <RecentTransactions
          transactions={recentTransactions.map((t) => ({ ...t, amount: Number(t.amount) }))}
        />
      </PeriodLoading>
    </div>
  );
}
