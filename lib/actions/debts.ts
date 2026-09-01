'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { syncDebtInstallments } from '@/lib/services/debt-installments';
import { resolveDebtStatusFromBalance } from '@/lib/services/debt-status';
import { DebtStatus, TransactionStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z.coerce.number().positive('Valor inicial deve ser maior que zero'),
  currentValue: z.coerce.number().positive('Valor atual deve ser maior que zero'),
  dueDay: z.coerce.number().min(1, 'Dia do vencimento é obrigatório').max(31),
  startDate: z.string(),
  status: z.nativeEnum(DebtStatus).optional(),
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

    // For fixed-installment debts, the total is derived from parcelas × valor da parcela —
    // it can't be set independently without drifting out of sync with the generated installments.
    const initialValue =
      validated.calculationType === 'FIXED_INSTALLMENT' &&
      validated.installments &&
      validated.installmentValue
        ? validated.installments * validated.installmentValue
        : validated.initialValue;

    const debt = await prisma.$transaction(async (tx) => {
      const newDebt = await tx.debt.create({
        data: {
          name: validated.name,
          description: validated.description,
          initialValue,
          // The create form always mirrors "Valor Total" into currentValue (nothing paid yet);
          // use the corrected initialValue so a fixed-installment debt doesn't start out of sync.
          currentValue: initialValue,
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
          status: validated.status ?? 'ACTIVE',
          workspaceId,
        },
      });

      await syncDebtInstallments(tx, {
        debtId: newDebt.id,
        workspaceId,
        debtName: validated.name,
        debtDescription: validated.description,
        initialValue,
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

    const installmentsTotal = data.installments ?? existingDebt.installments;
    const calculationType = data.calculationType ?? existingDebt.calculationType ?? 'TOTAL_DIVIDED';
    const installmentValue =
      data.installmentValue != null
        ? data.installmentValue
        : existingDebt.installmentValue
          ? Number(existingDebt.installmentValue)
          : null;

    // If the user explicitly typed a different "Valor Total" than what's currently stored, that's
    // an intentional override (e.g. correcting a value that drifted out of sync) — it always wins,
    // bypassing the plan-delta logic below entirely.
    const userOverrodeInitialValue =
      data.initialValue != null && data.initialValue !== Number(existingDebt.initialValue);

    // For fixed-installment debts, the parcela plan's total is installments × installmentValue.
    // `existingDebt.initialValue` may already include extra amounts from ad-hoc transactions
    // linked to this debt from the Transactions screen (see lib/actions/transactions.ts), which
    // aren't part of the parcela plan — so instead of overwriting initialValue outright, apply
    // only the *delta* between the old and new plan totals, preserving those extra amounts.
    const oldPlanTotal =
      existingDebt.calculationType === 'FIXED_INSTALLMENT' &&
      existingDebt.installments &&
      existingDebt.installmentValue
        ? existingDebt.installments * Number(existingDebt.installmentValue)
        : null;
    const newPlanTotal =
      calculationType === 'FIXED_INSTALLMENT' && installmentsTotal && installmentValue
        ? installmentsTotal * installmentValue
        : null;
    const initialValue = userOverrodeInitialValue
      ? data.initialValue!
      : oldPlanTotal != null && newPlanTotal != null
        ? Number(existingDebt.initialValue) + (newPlanTotal - oldPlanTotal)
        : (newPlanTotal ?? data.initialValue ?? Number(existingDebt.initialValue));

    const updatedData: any = { ...data, initialValue };
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

      const firstInstallmentMonth =
        data.firstInstallmentMonth ?? existingDebt.firstInstallmentMonth ?? 'NEXT';
      const dueDay = updatedDebt.dueDay ?? DEFAULT_DUE_DAY;
      const paymentMethodId = data.paymentMethodId ?? existingDebt.paymentMethodId ?? null;
      const creditCardId =
        data.creditCardId !== undefined ? data.creditCardId : existingDebt.creditCardId;
      const categoryId = data.categoryId ?? existingDebt.categoryId;
      const accountId = data.accountId ?? existingDebt.accountId;
      const supplierId = data.supplierId ?? existingDebt.supplierId;

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

    // currentValue depends on initialValue, which may have just been recomputed above —
    // resync it (and the derived status) now that the debt row reflects its new total.
    await syncDebtCurrentValue(id);
    const freshDebt = await prisma.debt.findUnique({ where: { id } });

    revalidatePath('/debts');
    revalidatePath(`/debts/${id}`);
    revalidatePath('/transactions');
    revalidatePath('/forecast');
    return { success: true, data: serializeDebt(freshDebt ?? debt) };
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
        status: resolveDebtStatusFromBalance(debt.status, newCurrentValue),
      },
    });

    revalidatePath('/debts');
    revalidatePath(`/debts/${debtId}`);
    return { success: true };
  } catch (error) {
    console.error('Error syncing debt:', error);
    return { success: false, error: 'Erro ao sincronizar dívida' };
  }
}
