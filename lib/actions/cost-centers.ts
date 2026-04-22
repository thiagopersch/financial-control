'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const costCenterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

export async function createCostCenter(data: z.infer<typeof costCenterSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = costCenterSchema.parse(data);

    const costCenter = await prisma.costCenter.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'CREATE_COST_CENTER',
      entity: 'CostCenter',
      entityId: costCenter.id,
      newValue: validated,
    });

    revalidatePath('/cost-centers');
    return { success: true, data: costCenter };
  } catch (error) {
    console.error('Error creating cost center:', error);
    return { success: false, error: 'Erro ao criar centro de custo' };
  }
}

export async function updateCostCenter(id: string, data: z.infer<typeof costCenterSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = costCenterSchema.parse(data);

    const costCenter = await prisma.costCenter.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: validated,
    });

    await createAuditLog({
      action: 'UPDATE_COST_CENTER',
      entity: 'CostCenter',
      entityId: costCenter.id,
      newValue: validated,
    });

    revalidatePath('/cost-centers');
    return { success: true, data: costCenter };
  } catch (error) {
    console.error('Error updating cost center:', error);
    return { success: false, error: 'Erro ao atualizar centro de custo' };
  }
}

export async function deleteCostCenter(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    // Check for linked transactions
    const hasTransactions = await prisma.transaction.findFirst({
      where: { costCenterId: id },
    });

    if (hasTransactions) {
      return {
        success: false,
        error: 'Este centro de custo possui transações vinculadas e não pode ser excluído.',
      };
    }

    await prisma.costCenter.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_COST_CENTER',
      entity: 'CostCenter',
      entityId: id,
    });

    revalidatePath('/cost-centers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting cost center:', error);
    return { success: false, error: 'Erro ao excluir centro de custo' };
  }
}
