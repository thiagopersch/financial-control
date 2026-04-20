import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { MonthSelector } from "@/components/month-selector";
import {
  getAvailableRange,
  getBudgetData,
  getCategoryData,
  getChartData,
  getDashboardStats,
  getGoalsData,
  getRecentTransactions,
} from "@/lib/queries/dashboard";
import { endOfMonth, parse, startOfMonth } from "date-fns";

export default async function DashboardPage(props: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const searchParams = await props.searchParams;
  const year = searchParams.year;
  const month = searchParams.month;

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let selectedMonth: Date;

  if (!year || year === "all") {
    // Sem parâmetros ou Todos os Períodos - sem filtro de data
    selectedMonth = new Date();
    startDate = undefined;
    endDate = undefined;
  } else if (year && month === "all") {
    // Ano completo
    startDate = startOfMonth(new Date(parseInt(year), 0));
    endDate = endOfMonth(new Date(parseInt(year), 11));
    selectedMonth = new Date(parseInt(year), 0);
  } else if (month && month !== "all") {
    // Mês específico
    selectedMonth = parse(`${year}-${month}`, "yyyy-MM", new Date());
    startDate = startOfMonth(selectedMonth);
    endDate = endOfMonth(selectedMonth);
  } else {
    // Apenas ano selecionado sem mês específico - treating as full year
    startDate = startOfMonth(new Date(parseInt(year), 0));
    endDate = endOfMonth(new Date(parseInt(year), 11));
    selectedMonth = new Date(parseInt(year), 0);
  }

  const isFullYear = (year && year !== "all" && !month) || month === "all";

  // Pass both start and end dates to queries to support flexible periods (monthly or yearly)
  const stats = await getDashboardStats(startDate, endDate);
  const chartData = await getChartData(selectedMonth, isFullYear);
  const categoryData = await getCategoryData(startDate, endDate);
  const recentTransactions = await getRecentTransactions(startDate, endDate);
  const availableRange = await getAvailableRange();

  const budgetData = await getBudgetData(selectedMonth.getMonth() + 1, selectedMonth.getFullYear());
  const goalsData = await getGoalsData();

  return (
    <div className="animate-in fade-in space-y-8 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças</p>
        </div>
        <MonthSelector availableRange={availableRange} />
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <OverviewChart data={chartData} isFullYear={isFullYear} />
        </div>
        <div className="col-span-3">
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions transactions={recentTransactions} />
        <BudgetWidget budgets={budgetData} />
      </div>

      <GoalsWidget goals={goalsData} />
    </div>
  );
}