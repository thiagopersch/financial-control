'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { addMonths, setDate, startOfMonth } from 'date-fns';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z.coerce.number().positive('Valor inicial deve ser maior que zero'),
  currentValue: z.coerce.number().positive('Valor atual deve ser maior que zero'),
  dueDay: z.coerce.number().min(1, 'Dia do vencimento é obrigatório').max(31),
  startDate: z.string(),
  installments: z.coerce.number().min(1).optional().nullable(),
  calculationType: z.string().optional(),
  installmentValue: z.coerce.number().positive().optional().nullable(),
  firstInstallmentMonth: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
});

const DEFAULT_DUE_DAY = 10;

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
  installmentValue: number | null,
): number {
  if (calculationType === 'FIXED_INSTALLMENT' && installmentValue) {
    return installmentValue;
  }
  return Number((initialValue / installments).toFixed(2));
}

function getInstallmentDueDate(
  monthOffset: number,
  firstInstallmentMonth: string | null,
  dueDay: number | null,
): Date {
  const now = new Date();
  const baseMonth =
    firstInstallmentMonth === 'CURRENT' ? startOfMonth(now) : addMonths(startOfMonth(now), 1);
  const monthDate = addMonths(baseMonth, monthOffset);
  return setDate(monthDate, dueDay || DEFAULT_DUE_DAY);
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
          dueDay: validated.dueDay || DEFAULT_DUE_DAY,
          startDate: new Date(validated.startDate),
          installments: validated.installments,
          calculationType: (validated.calculationType ?? 'TOTAL_DIVIDED') as any,
          installmentValue: validated.installmentValue,
          firstInstallmentMonth: (validated.firstInstallmentMonth ?? 'NEXT') as any,
          accountId: validated.accountId,
          categoryId: validated.categoryId,
          supplierId: validated.supplierId,
          paymentMethodId: validated.paymentMethodId,
          creditCardId: validated.creditCardId,
          isActive: true,
          workspaceId,
        },
      });

      if (validated.installments && validated.installments > 0) {
        const category = validated.categoryId
          ? await tx.category.findUnique({ where: { id: validated.categoryId } })
          : await getOrCreateDebtCategory(workspaceId);

        const account = await tx.account.findUnique({
          where: { id: validated.accountId },
        });

        if (!account) {
          throw new Error('Conta não encontrada.');
        }
        if (!category) {
          throw new Error('Categoria não encontrada.');
        }

        const calculationType = validated.calculationType ?? 'TOTAL_DIVIDED';
        const installmentAmount = calculateInstallmentAmount(
          validated.initialValue,
          validated.installments,
          calculationType,
          validated.installmentValue ?? null,
        );

        for (let i = 0; i < validated.installments; i++) {
          const dueDate = getInstallmentDueDate(
            i,
            validated.firstInstallmentMonth ?? 'NEXT',
            validated.dueDay ?? null,
          );

          await tx.transaction.create({
            data: {
              type: TransactionType.EXPENSE,
              amount: installmentAmount,
              date: dueDate,
              dueDate,
              status: TransactionStatus.PENDING,
              categoryId: category.id,
              accountId: account.id,
              paymentMethodId: validated.paymentMethodId,
              creditCardId: validated.creditCardId,
              notes: `${validated.name} - Parcela ${i + 1}/${validated.installments}`,
              workspaceId,
              debtId: newDebt.id,
              isRecurring: true,
              recurrenceType: 'INSTALLMENTS' as const,
              installments: validated.installments,
            },
          });
        }

        if (validated.creditCardId) {
          await tx.creditCard.update({
            where: { id: validated.creditCardId },
            data: { usedAmount: { increment: validated.initialValue } },
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
    const existingDebt = await prisma.debt.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existingDebt) {
      return { success: false, error: 'Dívida não encontrada' };
    }

    const hasInstallmentChanges =
      (data.installments !== undefined && data.installments !== existingDebt.installments) ||
      (data.installmentValue !== undefined &&
        data.installmentValue !== Number(existingDebt.installmentValue)) ||
      (data.calculationType !== undefined &&
        data.calculationType !== existingDebt.calculationType) ||
      (data.firstInstallmentMonth !== undefined &&
        data.firstInstallmentMonth !== existingDebt.firstInstallmentMonth) ||
      (data.dueDay !== undefined && data.dueDay !== existingDebt.dueDay) ||
      (data.accountId !== undefined && data.accountId !== existingDebt.accountId) ||
      (data.categoryId !== undefined && data.categoryId !== existingDebt.categoryId) ||
      (data.paymentMethodId !== undefined &&
        data.paymentMethodId !== existingDebt.paymentMethodId) ||
      (data.creditCardId !== undefined && data.creditCardId !== existingDebt.creditCardId) ||
      (data.initialValue !== undefined && data.initialValue !== Number(existingDebt.initialValue));

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
    if (data.dueDay !== undefined) {
      updatedData.dueDay = data.dueDay || DEFAULT_DUE_DAY;
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
        const calculationType =
          data.calculationType ?? existingDebt.calculationType ?? 'TOTAL_DIVIDED';
        const installmentValue =
          data.installmentValue != null
            ? data.installmentValue
            : existingDebt.installmentValue
              ? Number(existingDebt.installmentValue)
              : null;
        const firstInstallmentMonth =
          data.firstInstallmentMonth ?? existingDebt.firstInstallmentMonth ?? 'NEXT';
        const dueDay = updatedDebt.dueDay ?? DEFAULT_DUE_DAY;
        const paymentMethodId = data.paymentMethodId ?? existingDebt.paymentMethodId ?? null;
        const creditCardId =
          data.creditCardId !== undefined ? data.creditCardId : existingDebt.creditCardId;

        if (installments && installments > 0) {
          const categoryId = data.categoryId ?? existingDebt.categoryId;
          const category = categoryId
            ? await tx.category.findUnique({ where: { id: categoryId } })
            : await getOrCreateDebtCategory(session.user.workspaceId);

          const accountId =
            data.accountId ?? existingDebt.accountId ?? pendingTransactions[0]?.accountId;

          if (!accountId) {
            throw new Error('Conta não encontrada para atualizar parcelas');
          }
          if (!category) {
            throw new Error('Categoria não encontrada para atualizar parcelas');
          }

          const installmentAmount = calculateInstallmentAmount(
            data.initialValue ?? Number(existingDebt.initialValue),
            installments,
            calculationType,
            installmentValue,
          );

          for (let i = 0; i < installments; i++) {
            const dueDate = getInstallmentDueDate(i, firstInstallmentMonth, dueDay);

            await tx.transaction.create({
              data: {
                type: TransactionType.EXPENSE,
                amount: installmentAmount,
                date: dueDate,
                dueDate,
                status: TransactionStatus.PENDING,
                categoryId: category.id,
                accountId,
                paymentMethodId,
                creditCardId,
                notes: `${existingDebt.name} - Parcela ${i + 1}/${installments}`,
                workspaceId: session.user.workspaceId,
                debtId: id,
                isRecurring: true,
                recurrenceType: 'INSTALLMENTS' as const,
                installments,
              },
            });
          }

          const newInitialValue = data.initialValue ?? Number(existingDebt.initialValue);

          if (existingDebt.creditCardId !== creditCardId) {
            if (existingDebt.creditCardId) {
              await tx.creditCard.update({
                where: { id: existingDebt.creditCardId },
                data: { usedAmount: { decrement: Number(existingDebt.initialValue) } },
              });
            }
            if (creditCardId) {
              await tx.creditCard.update({
                where: { id: creditCardId },
                data: { usedAmount: { increment: newInitialValue } },
              });
            }
          } else if (creditCardId && newInitialValue !== Number(existingDebt.initialValue)) {
            await tx.creditCard.update({
              where: { id: creditCardId },
              data: {
                usedAmount: { increment: newInitialValue - Number(existingDebt.initialValue) },
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
