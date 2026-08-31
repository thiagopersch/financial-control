'use server';

import { checkGoalAlerts } from '@/lib/actions/notifications';
import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  targetAmount: z.coerce.number().positive('Valor alvo deve ser maior que zero'),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.coerce.date().nullable().optional(),
  color: z.string().optional().default('#0ea5e9'),
});

function serializeGoal(goal: any) {
  return {
    ...goal,
    targetAmount: goal.targetAmount ? Number(goal.targetAmount) : 0,
    currentAmount: goal.currentAmount ? Number(goal.currentAmount) : 0,
  };
}

export async function createGoal(data: z.infer<typeof goalSchema>) {
  try {
    const session = await requirePermission('goals', 'CREATE');
    const validated = goalSchema.parse(data);

    const existing = await prisma.goal.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        name: { equals: validated.name, mode: 'insensitive' },
      },
    });
    if (existing) {
      return { success: false, error: 'Já existe uma meta com este nome' };
    }

    const goal = await prisma.goal.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'CREATE_GOAL',
      entity: 'Goal',
      entityId: goal.id,
      newValue: validated,
    });

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    return { success: true, data: serializeGoal(goal) };
  } catch (error) {
    console.error('Error creating goal:', error);
    return { success: false, error: 'Erro ao criar meta' };
  }
}

export async function updateGoal(id: string, data: z.infer<typeof goalSchema>) {
  try {
    const session = await requirePermission('goals', 'UPDATE');
    const validated = goalSchema.parse(data);

    const existing = await prisma.goal.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        name: { equals: validated.name, mode: 'insensitive' },
        id: { not: id },
      },
    });
    if (existing) {
      return { success: false, error: 'Já existe uma meta com este nome' };
    }

    const goal = await prisma.goal.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: validated,
    });

    await createAuditLog({
      action: 'UPDATE_GOAL',
      entity: 'Goal',
      entityId: goal.id,
      newValue: validated,
    });

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    return { success: true, data: serializeGoal(goal) };
  } catch (error) {
    console.error('Error updating goal:', error);
    return { success: false, error: 'Erro ao atualizar meta' };
  }
}

export async function deleteGoal(id: string) {
  try {
    const session = await requirePermission('goals', 'DELETE');
    await prisma.goal.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_GOAL',
      entity: 'Goal',
      entityId: id,
    });

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { success: false, error: 'Erro ao excluir meta' };
  }
}

export async function depositToGoal(id: string, amount: number) {
  if (amount <= 0) {
    return { success: false, error: 'Valor deve ser maior que zero' };
  }

  try {
    const session = await requirePermission('goals', 'UPDATE');
    const goal = await prisma.goal.findUnique({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!goal) {
      return { success: false, error: 'Meta não encontrada' };
    }

    const updatedGoal = await prisma.goal.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: {
        currentAmount: {
          increment: amount,
        },
      },
    });

    await createAuditLog({
      action: 'DEPOSIT_TO_GOAL',
      entity: 'Goal',
      entityId: goal.id,
      newValue: {
        amount,
        previousAmount: goal.currentAmount,
        newAmount: updatedGoal.currentAmount,
      },
    });

    await checkGoalAlerts(session);

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    return { success: true, data: serializeGoal(updatedGoal) };
  } catch (error) {
    console.error('Error depositing to goal:', error);
    return { success: false, error: 'Erro ao depositar na meta' };
  }
}
