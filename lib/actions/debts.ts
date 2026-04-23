'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { addMonths, startOfMonth } from 'date-fns';
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
  calculationType: z.string().optional(),
  installmentValue: z.coerce.number().positive().optional().nullable(),
  firstInstallmentMonth: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
});

function serializeDebt(debt: any) {
  return {
    ...debt,
    initialValue: debt.initialValue ? Number(debt.initialValue) : 0,
    currentValue: debt.currentValue ? Number(debt.currentValue) : 0,
    interestRate: debt.interestRate != null ? Number(debt.interestRate) : null,
    minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : 0,
    installmentValue: debt.installmentValue != null ? Number(debt.installmentValue) : null,
    dueDay: debt.dueDay ?? null,
    installments: debt.installments ?? null,
    calculationType: debt.calculationType ?? null,
    firstInstallmentMonth: debt.firstInstallmentMonth ?? null,
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

function calculateInstallmentAmount(
  initialValue: number,
  installments: number,
  calculationType: string | null,
  installmentValue: number | null
): number {
  if (calculationType === 'FIXED_INSTALLMENT' && installmentValue) {
    return installmentValue;
  }
  return Number((initialValue / installments).toFixed(2));
}

function getStartDateForFirstInstallment(
  startDate: Date,
  firstInstallmentMonth: string | null
): Date {
  const now = new Date();
  const currentMonth = startOfMonth(now);

  if (firstInstallmentMonth === 'CURRENT') {
    return currentMonth;
  }
  return addMonths(currentMonth, 1);
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
          calculationType: (validated.calculationType ?? 'TOTAL_DIVIDED') as any,
          installmentValue: validated.installmentValue,
          firstInstallmentMonth: (validated.firstInstallmentMonth ?? 'NEXT') as any,
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

        const calculationType = validated.calculationType ?? 'TOTAL_DIVIDED';
        const installmentAmount = calculateInstallmentAmount(
          validated.initialValue,
          validated.installments,
          calculationType,
          validated.installmentValue ?? null
        );

        const firstInstallmentDate = getStartDateForFirstInstallment(
          new Date(validated.startDate),
          validated.firstInstallmentMonth ?? 'NEXT'
        );

        for (let i = 0; i < validated.installments; i++) {
          const dueDate = addMonths(firstInstallmentDate, i);

          await tx.transaction.create({
            data: {
              type: TransactionType.EXPENSE,
              amount: installmentAmount,
              date: dueDate,
              dueDate,
              status: TransactionStatus.PENDING,
              categoryId: category.id,
              accountId: account.id,
              notes: `${validated.name} - Parcela ${i + 1}/${validated.installments}`,
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
    revalidatePath('/forecast');
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
    console.log('updateDebt called with:', { id, data });
    
    const existingDebt = await prisma.debt.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existingDebt) {
      console.log('Debt not found:', id);
      return { success: false, error: 'Dívida não encontrada' };
    }

    console.log('Existing debt:', existingDebt);

    const hasInstallmentChanges =
      (data.installments !== undefined && data.installments !== existingDebt.installments) ||
      (data.installmentValue !== undefined && data.installmentValue !== Number(existingDebt.installmentValue)) ||
      (data.calculationType !== undefined && data.calculationType !== existingDebt.calculationType) ||
      (data.firstInstallmentMonth !== undefined && data.firstInstallmentMonth !== existingDebt.firstInstallmentMonth);

    const updatedData: any = { ...data };
    if (data.startDate) {
      updatedData.startDate = new Date(data.startDate);
    }
    if (data.calculationType) {
      updatedData.calculationType = data.calculationType as any;
    }
    if (data.firstInstallmentMonth) {
      updatedData.firstInstallmentMonth = data.firstInstallmentMonth as any;
    }
    if (data.installmentValue !== undefined) {
      updatedData.installmentValue = data.installmentValue;
    }
    if (data.installments !== undefined) {
      updatedData.installments = data.installments;
    }

    const debt = await prisma.$transaction(async (tx) => {
      const updatedDebt = await tx.debt.update({
        where: { id, workspaceId: session.user.workspaceId },
        data: updatedData,
      });

      if (hasInstallmentChanges) {
        const pendingTransactions = await tx.transaction.findMany({
          where: {
            debtId: id,
            status: { in: [TransactionStatus.PENDING, TransactionStatus.OVERDUE] },
          },
        });

        if (pendingTransactions.length > 0) {
          await tx.transaction.deleteMany({
            where: {
              id: { in: pendingTransactions.map((t) => t.id) },
            },
          });
        }

        const installments = data.installments ?? existingDebt.installments;
        const calculationType = data.calculationType ?? existingDebt.calculationType ?? 'TOTAL_DIVIDED';
        const installmentValue = data.installmentValue != null 
          ? data.installmentValue 
          : existingDebt.installmentValue 
            ? Number(existingDebt.installmentValue) 
            : null;
        const firstInstallmentMonth = data.firstInstallmentMonth ?? existingDebt.firstInstallmentMonth ?? 'NEXT';

        if (installments && installments > 0) {
          const category = await getOrCreateDebtCategory(session.user.workspaceId);

          const accountId = pendingTransactions[0]?.accountId ?? data.accountId;
          
          if (!accountId) {
            const firstTx = await tx.transaction.findFirst({
              where: { debtId: id },
              select: { accountId: true },
            });
            if (firstTx?.accountId) {
              const acc = await tx.account.findUnique({ where: { id: firstTx.accountId } });
              if (!acc) throw new Error('Conta não encontrada para atualizar parcelas');
            } else {
              throw new Error('Conta não encontrada para atualizar parcelas');
            }
          }

          const account = await tx.account.findUnique({
            where: { id: accountId },
          });

          const installmentAmount = calculateInstallmentAmount(
            Number(existingDebt.initialValue),
            installments,
            calculationType,
            installmentValue
          );

          const startDate = existingDebt.startDate;
          const firstInstallmentDate = getStartDateForFirstInstallment(
            startDate,
            firstInstallmentMonth
          );

          for (let i = 0; i < installments; i++) {
            const dueDate = addMonths(firstInstallmentDate, i);

            await tx.transaction.create({
              data: {
                type: TransactionType.EXPENSE,
                amount: installmentAmount,
                date: dueDate,
                dueDate,
                status: TransactionStatus.PENDING,
                categoryId: category.id,
                accountId: account?.id ?? accountId ?? '',
                notes: `${existingDebt.name} - Parcela ${i + 1}/${installments}`,
                workspaceId: session.user.workspaceId,
                debtId: id,
                isRecurring: true,
                recurrenceType: 'INSTALLMENTS' as const,
                installments,
              },
            });
          }
        }
      }

      return updatedDebt;
    });

    revalidatePath('/debts');
    revalidatePath('/transactions');
    revalidatePath('/forecast');
    return { success: true, data: serializeDebt(debt) };
  } catch (error) {
    console.error('Error updating debt:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar dívida',
    };
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
        debtId: id,
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
    revalidatePath('/forecast');
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