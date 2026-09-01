'use server';

import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions/require-permission';
import { createAuditLog } from '@/lib/services/audit';
import { AccountType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(AccountType),
  color: z.string().optional().default('#000000'),
});

export async function createAccount(data: z.infer<typeof accountSchema>) {
  try {
    const session = await requirePermission('accounts', 'CREATE');
    const validated = accountSchema.parse(data);

    const account = await prisma.account.create({
      data: {
        name: validated.name,
        type: validated.type,
        color: validated.color,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'CREATE_ACCOUNT',
      entity: 'Account',
      entityId: account.id,
      newValue: validated,
    });

    revalidatePath('/accounts');
    return {
      success: true,
      data: {
        ...account,

        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error creating account:', error);
    return { success: false, error: 'Erro ao criar conta' };
  }
}

export async function updateAccount(id: string, data: z.infer<typeof accountSchema>) {
  try {
    const session = await requirePermission('accounts', 'UPDATE');
    const validated = accountSchema.parse(data);

    const existing = await prisma.account.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) return { success: false, error: 'Conta não encontrada' };

    const account = await prisma.account.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: {
        name: validated.name,
        type: validated.type,
        color: validated.color,
      },
    });

    await createAuditLog({
      action: 'UPDATE_ACCOUNT',
      entity: 'Account',
      entityId: account.id,
      oldValue: existing,
      newValue: validated,
    });

    revalidatePath('/accounts');
    return {
      success: true,
      data: {
        ...account,

        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating account:', error);
    return { success: false, error: 'Erro ao atualizar conta' };
  }
}

export async function deleteAccount(id: string) {
  try {
    const session = await requirePermission('accounts', 'DELETE');
    // Check if account has transactions
    const hasTransactions = await prisma.transaction.findFirst({
      where: { accountId: id },
    });

    if (hasTransactions) {
      return {
        success: false,
        error: 'Esta conta possui transações vinculadas e não pode ser excluída.',
      };
    }

    const account = await prisma.account.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_ACCOUNT',
      entity: 'Account',
      entityId: id,
      oldValue: account,
    });

    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Erro ao excluir conta' };
  }
}
