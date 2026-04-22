'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const transferSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date(),
  description: z.string().optional(),
  fromAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
  toAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
});

export async function createTransfer(data: z.infer<typeof transferSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  if (data.fromAccountId === data.toAccountId) {
    return { success: false, error: 'As contas de origem e destino devem ser diferentes' };
  }

  try {
    const validated = transferSchema.parse(data);

    // Encontrar ou criar uma categoria de sistema para transferências
    let transferCategory = await prisma.category.findFirst({
      where: {
        name: 'Transferência',
        workspaceId: session.user.workspaceId,
      },
    });

    if (!transferCategory) {
      transferCategory = await prisma.category.create({
        data: {
          name: 'Transferência',
          type: TransactionType.TRANSFER,
          color: '#94a3b8',
          workspaceId: session.user.workspaceId,
        },
      });
    }

    // Atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create Transfer record
      await tx.transfer.create({
        data: {
          ...validated,
          workspaceId: session.user.workspaceId,
        },
      });

      // 2. Create withdrawal transaction
      await tx.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount: validated.amount,
          date: validated.date,
          status: TransactionStatus.PAID,
          notes: `[SAÍDA] Transferência: ${validated.description || ''}`,
          accountId: validated.fromAccountId,
          workspaceId: session.user.workspaceId,
          categoryId: transferCategory!.id,
        },
      });

      // 3. Create deposit transaction
      await tx.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount: validated.amount,
          date: validated.date,
          status: TransactionStatus.PAID,
          notes: `[ENTRADA] Transferência: ${validated.description || ''}`,
          accountId: validated.toAccountId,
          workspaceId: session.user.workspaceId,
          categoryId: transferCategory!.id,
        },
      });
    });

    revalidatePath('/transactions');
    revalidatePath('/accounts');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error creating transfer:', error);
    return { success: false, error: 'Erro ao realizar transferência' };
  }
}
