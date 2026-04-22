'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { addMonths } from 'date-fns';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z.coerce.number().positive('Valor inicial deve ser maior que zero'),
  currentValue: z.coerce.number().positive('Valor atual deve ser maior que zero'),
  interestRate: z.coerce.number().min(0).optional().nullable(),
  minimumPayment: z.coerce.number().positive('Pagamento mínimo é obrigatório'),
  dueDay: z.number().min(1).max(31).optional().nullable(),
  startDate: z.string(),
  installments: z.coerce.number().min(1).optional().nullable(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
});

function serializeDebt(debt: any) {
  return {
    ...debt,
    initialValue: debt.initialValue ? Number(debt.initialValue) : 0,
    currentValue: debt.currentValue ? Number(debt.currentValue) : 0,
    interestRate: debt.interestRate != null ? Number(debt.interestRate) : null,
    minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : 0,
    dueDay: debt.dueDay ?? null,
    installments: debt.installments ?? null,
  };
}

async function getOrCreateDebtCategory(workspaceId: string) {
  const existing = await prisma.category.findFirst({
    where: {
      workspaceId,
      name: 'Pagamento de Dívida',
    },
  });

  if (existing) return existing;

  return prisma.category.create({
    data: {
      name: 'Pagamento de Dívida',
      type: TransactionType.EXPENSE,
      color: '#ef4444',
      workspaceId,
    },
  });
}

export async function createDebt(data: z.infer<typeof debtSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = debtSchema.parse(data);
    const workspaceId = session.user.workspaceId;

    const debt = await prisma.$transaction(async (tx) => {
      const newDebt = await tx.debt.create({
        data: {
          name: validated.name,
          description: validated.description,
          initialValue: validated.initialValue,
          currentValue: validated.currentValue,
          interestRate: validated.interestRate,
          minimumPayment: validated.minimumPayment,
          dueDay: validated.dueDay,
          startDate: new Date(validated.startDate),
          installments: validated.installments,
          isActive: true,
          workspaceId,
        },
      });

      if (validated.installments && validated.installments > 0) {
        const category = await getOrCreateDebtCategory(workspaceId);

        const account = await tx.account.findUnique({
          where: { id: validated.accountId },
        });

        if (!account) {
          throw new Error('Conta não encontrada.');
        }

        const installmentAmount = Number(
          (validated.initialValue / validated.installments).toFixed(2),
        );
        const startDate = new Date(validated.startDate);

        for (let i = 0; i < validated.installments; i++) {
          const dueDate = addMonths(startDate, i + 1);

          await tx.transaction.create({
            data: {
              type: TransactionType.EXPENSE,
              amount: installmentAmount,
              date: dueDate,
              dueDate,
              status: TransactionStatus.PENDING,
              categoryId: category.id,
              accountId: account.id,
              notes: `[Dívida: ${newDebt.id}] Parcela ${i + 1}/${validated.installments} - ${validated.name}`,
              workspaceId,
              debtId: newDebt.id,
              isRecurring: true,
              recurrenceType: 'INSTALLMENTS' as const,
              installments: validated.installments,
            },
          });
        }
      }

      return newDebt;
    });

    revalidatePath('/debts');
    revalidatePath('/transactions');
    return { success: true, data: serializeDebt(debt) };
  } catch (error) {
    console.error('Error creating debt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar dívida',
    };
  }
}

export async function updateDebt(id: string, data: Partial<z.infer<typeof debtSchema>>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const existingDebt = await prisma.debt.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existingDebt) {
      return { success: false, error: 'Dívida não encontrada' };
    }

    const paidTransactions = [];

    const updatedData: any = { ...data };
    if (data.startDate) {
      updatedData.startDate = new Date(data.startDate);
    }

    const debt = await prisma.debt.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: updatedData,
    });

    revalidatePath('/debts');
    return { success: true, data: serializeDebt(debt) };
  } catch (error) {
    console.error('Error updating debt:', error);
    return { success: false, error: 'Erro ao atualizar dívida' };
  }
}

export async function deleteDebt(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const debt = await prisma.debt.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!debt) {
      return { success: false, error: 'Dívida não encontrada' };
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        notes: { contains: `[Dívida: ${id}]` },
      },
    });

    await prisma.$transaction(async (tx) => {
      if (transactions.length > 0) {
        await tx.transaction.deleteMany({
          where: { id: { in: transactions.map((t) => t.id) } },
        });
      }

      await tx.debt.delete({
        where: { id, workspaceId: session.user.workspaceId },
      });
    });

    revalidatePath('/debts');
    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting debt:', error);
    return { success: false, error: 'Erro ao excluir dívida' };
  }
}

export async function syncDebtCurrentValue(debtId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const debt = await prisma.debt.findUnique({
      where: { id: debtId, workspaceId: session.user.workspaceId },
    });

    if (!debt) {
      return { success: false, error: 'Dívida não encontrada' };
    }

    const paidTransactions = await prisma.transaction.findMany({
      where: { debtId, status: TransactionStatus.PAID },
    });

    const totalPaid = paidTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const newCurrentValue = Number(debt.initialValue) - totalPaid;

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        currentValue: newCurrentValue,
        isActive: newCurrentValue > 0,
      },
    });

    revalidatePath('/debts');
    return { success: true };
  } catch (error) {
    console.error('Error syncing debt:', error);
    return { success: false, error: 'Erro ao sincronizar dívida' };
  }
}
