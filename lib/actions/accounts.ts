'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { AccountType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(AccountType),
  color: z.string().optional().default('#000000'),
});

export async function createAccount(data: z.infer<typeof accountSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
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
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = accountSchema.parse(data);

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
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
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

    await prisma.account.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_ACCOUNT',
      entity: 'Account',
      entityId: id,
    });

    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Erro ao excluir conta' };
  }
}
