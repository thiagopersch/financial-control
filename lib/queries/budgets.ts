import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

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
  const session = await getServerSession(authOptions);
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

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            workspaceId: session.user.workspaceId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            status: 'PAID',
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spentAmount = Number(spent._sum.amount || 0);
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

export async function getBudgetById(id: string): Promise<BudgetDTO | null> {
  const session = await getServerSession(authOptions);
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
