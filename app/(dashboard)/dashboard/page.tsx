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

export default async function DashboardPage(props: { searchParams: Promise<{ month?: string }> }) {
  const searchParams = await props.searchParams;

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let selectedMonth: Date;

  if (searchParams.month === "all") {
    startDate = undefined;
    endDate = undefined;
    selectedMonth = new Date();
  } else if (searchParams.month === "year") {
    const currentYear = new Date().getFullYear();
    startDate = startOfMonth(new Date(currentYear, 0));
    endDate = endOfMonth(new Date(currentYear, 11));
    selectedMonth = new Date(currentYear, 0);
  } else if (searchParams.month) {
    selectedMonth = parse(searchParams.month, "yyyy-MM", new Date());
    startDate = startOfMonth(selectedMonth);
    endDate = endOfMonth(selectedMonth);
  } else {
    selectedMonth = new Date();
    startDate = startOfMonth(selectedMonth);
    endDate = endOfMonth(selectedMonth);
  }

  const isFullYear = searchParams.month === "year" || searchParams.month === "all";

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Bem-vindo ao seu controle financeiro.</p>
        </div>
        <MonthSelector availableRange={availableRange} />
      </div>

      <StatsCards stats={stats} isFullYear={isFullYear} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="space-y-4 lg:col-span-4">
          <OverviewChart data={chartData} isFullYear={isFullYear} />
          <RecentTransactions transactions={recentTransactions} />
        </div>
        <div className="space-y-4 lg:col-span-3">
          <CategoryPieChart data={categoryData} isFullYear={isFullYear} />
          <BudgetWidget budgets={budgetData} />
          <GoalsWidget goals={goalsData} />
        </div>
      </div>
    </div>
  );
}
