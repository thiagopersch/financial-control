'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { syncDebtInstallments } from '@/lib/services/debt-installments';
import { TransactionStatus } from '@prisma/client';
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

export async function createDebt(data: z.infer<typeof debtSchema>) {
  try {
    const session = await requirePermission('debts', 'CREATE');
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

      await syncDebtInstallments(tx, {
        debtId: newDebt.id,
        workspaceId,
        debtName: validated.name,
        debtDescription: validated.description,
        initialValue: validated.initialValue,
        installmentsTotal: validated.installments,
        calculationType: validated.calculationType ?? 'TOTAL_DIVIDED',
        installmentValue: validated.installmentValue ?? null,
        firstInstallmentMonth: validated.firstInstallmentMonth ?? 'NEXT',
        dueDay: validated.dueDay ?? null,
        categoryId: validated.categoryId,
        accountId: validated.accountId,
        supplierId: validated.supplierId,
        paymentMethodId: validated.paymentMethodId,
        creditCardId: validated.creditCardId ?? null,
      });

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
  try {
    const session = await requirePermission('debts', 'UPDATE');
    const existingDebt = await prisma.debt.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existingDebt) {
      return { success: false, error: 'Dívida não encontrada' };
    }

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

      const installmentsTotal = data.installments ?? existingDebt.installments;
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
      const categoryId = data.categoryId ?? existingDebt.categoryId;
      const accountId = data.accountId ?? existingDebt.accountId;
      const supplierId = data.supplierId ?? existingDebt.supplierId;
      const initialValue = data.initialValue ?? Number(existingDebt.initialValue);

      await syncDebtInstallments(tx, {
        debtId: id,
        workspaceId: session.user.workspaceId,
        debtName: updatedDebt.name,
        debtDescription: updatedDebt.description,
        initialValue,
        installmentsTotal,
        calculationType,
        installmentValue,
        firstInstallmentMonth,
        dueDay,
        categoryId,
        accountId,
        supplierId,
        paymentMethodId,
        creditCardId,
      });

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
  try {
    const session = await requirePermission('debts', 'DELETE');
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
        for (const t of transactions) {
          if (t.creditCardId) {
            await tx.creditCard.update({
              where: { id: t.creditCardId },
              data: { usedAmount: { decrement: Number(t.amount) } },
            });
          }
        }

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
  try {
    const session = await requirePermission('debts', 'UPDATE');
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
