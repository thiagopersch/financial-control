'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  alertAt80: z.boolean().optional().default(true),
  alertAt100: z.boolean().optional().default(true),
});

function serializeBudget(budget: any) {
  return {
    ...budget,
    amount: budget.amount ? Number(budget.amount) : 0,
  };
}

export async function upsertBudget(data: z.infer<typeof budgetSchema> & { id?: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = budgetSchema.parse(data);

    let budget;

    if (data.id) {
      const existing = await prisma.budget.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        return { success: false, error: 'Orçamento não encontrado' };
      }

      budget = await prisma.budget.update({
        where: { id: data.id },
        data: {
          categoryId: validated.categoryId,
          amount: validated.amount,
          alertAt80: validated.alertAt80,
          alertAt100: validated.alertAt100,
        },
      });

      await createAuditLog({
        action: 'UPDATE_BUDGET',
        entity: 'Budget',
        entityId: budget.id,
        oldValue: { amount: existing.amount },
        newValue: validated,
      });
    } else {
      const existing = await prisma.budget.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          categoryId: validated.categoryId,
          month: validated.month,
          year: validated.year,
        },
      });

      if (existing) {
        budget = await prisma.budget.update({
          where: { id: existing.id },
          data: {
            amount: validated.amount,
            alertAt80: validated.alertAt80,
            alertAt100: validated.alertAt100,
          },
        });

        await createAuditLog({
          action: 'UPDATE_BUDGET',
          entity: 'Budget',
          entityId: budget.id,
          oldValue: { amount: existing.amount },
          newValue: validated,
        });
      } else {
        budget = await prisma.budget.create({
          data: {
            ...validated,
            workspaceId: session.user.workspaceId,
          },
        });

        await createAuditLog({
          action: 'CREATE_BUDGET',
          entity: 'Budget',
          entityId: budget.id,
          newValue: validated,
        });
      }
    }

    revalidatePath('/budgets');
    revalidatePath('/dashboard');
    return { success: true, data: serializeBudget(budget) };
  } catch (error) {
    console.error('Error upserting budget:', error);
    return { success: false, error: 'Erro ao salvar orçamento' };
  }
}

export async function deleteBudget(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    await prisma.budget.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_BUDGET',
      entity: 'Budget',
      entityId: id,
      oldValue: existing || undefined,
    });

    revalidatePath('/budgets');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting budget:', error);
    return { success: false, error: 'Erro ao excluir orçamento' };
  }
}

export async function getBudgetsByMonth(month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        month,
        year,
      },
      include: {
        category: true,
      },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

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
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= 80) {
          status = 'warning';
        }

        return {
          ...budget,
          spentAmount,
          remaining,
          percentage,
          status,
        };
      }),
    );

    return { success: true, data: budgetsWithSpent };
  } catch (error) {
    console.error('Error getting budgets:', error);
    return { success: false, error: 'Erro ao buscar orçamentos' };
  }
}
