import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { getPaidExpensesByCategory } from '@/lib/queries/budget-spent';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';
import { parseMultiParam, toInFilter } from '@/lib/utils/filter-params';

export type BudgetDTO = {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertAt80: boolean;
  alertAt100: boolean;
  workspaceId: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  spentAmount?: number;
  remaining?: number;
  percentage?: number;
  status?: 'safe' | 'warning' | 'exceeded';
};

export async function getBudgets(month?: number, year?: number): Promise<BudgetDTO[]> {
  const session = await getSession();
  if (!session) return [];

  const targetMonth = month ?? new Date().getMonth() + 1;
  const targetYear = year ?? new Date().getFullYear();

  try {
    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        month: targetMonth,
        year: targetYear,
      },
      include: {
        category: true,
      },
    });

    // Uma query agrupada por categoria (antes: um aggregate por orçamento).
    const spentByCategory = await getPaidExpensesByCategory(
      session.user.workspaceId,
      targetMonth,
      targetYear,
      budgets.map((b) => b.categoryId),
    );

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = spentByCategory.get(budget.categoryId) ?? 0;
        const budgetAmount = Number(budget.amount);
        const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
        const remaining = budgetAmount - spentAmount;

        let status: 'safe' | 'warning' | 'exceeded' = 'safe';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= 80) status = 'warning';

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          amount: budgetAmount,
          month: budget.month,
          year: budget.year,
          alertAt80: budget.alertAt80,
          alertAt100: budget.alertAt100,
          workspaceId: budget.workspaceId,
          category: budget.category
            ? {
                id: budget.category.id,
                name: budget.category.name,
                color: budget.category.color,
              }
            : undefined,
          spentAmount,
          remaining,
          percentage,
          status,
        };
      }),
    );

    return budgetsWithSpent;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
}

export type GetBudgetsFilteredParams = {
  workspaceId: string;
  month: number;
  year: number;
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function getBudgetsFiltered({
  workspaceId,
  month,
  year,
  q,
  category,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetBudgetsFilteredParams): Promise<{ budgets: BudgetDTO[]; totalCount: number }> {
  const where: any = {
    workspaceId,
    month,
    year,
  };

  where.categoryId = toInFilter(parseMultiParam(category));
  if (q) {
    where.category = { name: { contains: q, mode: 'insensitive' } };
  }

  const [budgets, totalCount] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.budget.count({ where }),
  ]);

  // Uma query agrupada por categoria (antes: um aggregate por orçamento).
  const spentByCategory = await getPaidExpensesByCategory(
    workspaceId,
    month,
    year,
    budgets.map((b) => b.categoryId),
  );

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spentAmount = spentByCategory.get(budget.categoryId) ?? 0;
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      const remaining = budgetAmount - spentAmount;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        amount: budgetAmount,
        month: budget.month,
        year: budget.year,
        alertAt80: budget.alertAt80,
        alertAt100: budget.alertAt100,
        workspaceId: budget.workspaceId,
        category: budget.category
          ? {
              id: budget.category.id,
              name: budget.category.name,
              color: budget.category.color,
            }
          : undefined,
        spentAmount,
        remaining,
        percentage,
        status,
      };
    }),
  );

  return { budgets: budgetsWithSpent, totalCount };
}

export async function getBudgetById(id: string): Promise<BudgetDTO | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      include: {
        category: true,
      },
    });

    if (!budget) return null;

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      amount: Number(budget.amount),
      month: budget.month,
      year: budget.year,
      alertAt80: budget.alertAt80,
      alertAt100: budget.alertAt100,
      workspaceId: budget.workspaceId,
      category: budget.category
        ? {
            id: budget.category.id,
            name: budget.category.name,
            color: budget.category.color,
          }
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
}
