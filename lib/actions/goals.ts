'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { getServerSession } from 'next-auth';
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
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = goalSchema.parse(data);

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
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = goalSchema.parse(data);

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
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
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
