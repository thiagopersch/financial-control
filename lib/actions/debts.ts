'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { syncDebtInstallments } from '@/lib/services/debt-installments';
import { recalculateDebtTotals } from '@/lib/services/debt-totals';
import { assertValidPaidBy } from '@/lib/services/paid-by';
import {
  competenceFromYearMonthString,
  isSameCompetence,
  isYearMonthString,
} from '@/lib/utils/competence';
import { DebtStatus, Periodicity, TransactionStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const debtSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  initialValue: z.coerce.number().positive('Valor inicial deve ser maior que zero'),
  currentValue: z.coerce.number().min(0, 'Valor atual deve ser maior ou igual a zero'),
  dueDay: z.coerce.number().min(1, 'Dia do vencimento é obrigatório').max(31),
  startDate: z.string(),
  status: z.nativeEnum(DebtStatus).optional(),
  installments: z.coerce.number().min(1).optional().nullable(),
  calculationType: z.string().optional(),
  installmentValue: z.coerce.number().positive().optional().nullable(),
  firstInstallmentMonth: z.string().optional(),
  periodicity: z.nativeEnum(Periodicity).optional().nullable(),
  firstInstallmentDate: z.string().optional().nullable(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
});

const installmentSchema = z.object({
  date: z.coerce.date({ message: 'Data de vencimento inválida' }),
  competence: z.string().refine(isYearMonthString, 'Competência inválida (MM/AAAA)'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  status: z.enum(TransactionStatus),
  paidAt: z.coerce.date().nullable().optional(),
  paidById: z.string().nullable().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
  notes: z.string().max(255, 'Máximo de 255 caracteres').optional(),
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
    periodicity: debt.periodicity ?? null,
    firstInstallmentDate: debt.firstInstallmentDate?.toISOString?.() ?? null,
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
          startDate: validated.firstInstallmentDate
            ? new Date(validated.firstInstallmentDate)
            : new Date(validated.startDate),
          installments: validated.installments,
          calculationType: (validated.calculationType ?? 'TOTAL_DIVIDED') as any,
          installmentValue: validated.installmentValue,
          firstInstallmentMonth: (validated.firstInstallmentMonth ?? 'NEXT') as any,
          periodicity: (validated.periodicity ?? 'MONTHLY') as any,
          firstInstallmentDate: validated.firstInstallmentDate
            ? new Date(validated.firstInstallmentDate)
            : null,
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
        periodicity: validated.periodicity ?? 'MONTHLY',
        firstInstallmentDate: validated.firstInstallmentDate
          ? new Date(validated.firstInstallmentDate)
          : null,
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
    if (data.periodicity) {
      updatedData.periodicity = data.periodicity as any;
    }
    if (data.firstInstallmentDate) {
      updatedData.firstInstallmentDate = new Date(data.firstInstallmentDate);
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
        periodicity: data.periodicity ?? existingDebt.periodicity ?? 'MONTHLY',
        firstInstallmentDate: data.firstInstallmentDate
          ? new Date(data.firstInstallmentDate)
          : (existingDebt.firstInstallmentDate ?? null),
        categoryId,
        accountId,
        supplierId,
        paymentMethodId,
        creditCardId,
      });

      // Total, valor atual e status saem das parcelas recém-sincronizadas.
      return (await recalculateDebtTotals(tx, id)) ?? updatedDebt;
    });

    revalidatePath('/debts');
    revalidatePath(`/debts/${id}`);
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

    await prisma.$transaction((tx) => recalculateDebtTotals(tx, debtId));

    revalidatePath('/debts');
    revalidatePath(`/debts/${debtId}`);
    return { success: true };
  } catch (error) {
    console.error('Error syncing debt:', error);
    return { success: false, error: 'Erro ao sincronizar dívida' };
  }
}

export type UpdateInstallmentInput = z.infer<typeof installmentSchema>;

/**
 * Edita uma parcela com as mesmas regras da edição de transação: vencimento e
 * competência independentes, status/pagamento e vínculo de "Pago por". Depois
 * os totais da dívida são recalculados a partir das parcelas.
 */
export async function updateInstallment(transactionId: string, data: UpdateInstallmentInput) {
  try {
    const session = await requirePermission('transactions', 'UPDATE');
    const validated = installmentSchema.parse(data);
    const workspaceId = session.user.workspaceId;

    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, workspaceId, debtId: { not: null } },
    });

    if (!transaction || !transaction.debtId) {
      return { success: false, error: 'Parcela não encontrada' };
    }
    const debtId = transaction.debtId;

    const paidByError = await assertValidPaidBy(
      workspaceId,
      validated.paidById,
      transaction.paidById,
    );
    if (paidByError) return { success: false, error: paidByError };

    // Mesma regra da transação: enquanto não foi movida, a competência de origem acompanha.
    const competence = competenceFromYearMonthString(validated.competence);
    const wasMoved = !isSameCompetence(transaction.competence, transaction.originalCompetence);
    const isPaid = validated.status === TransactionStatus.PAID;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          amount: validated.amount,
          date: validated.date,
          dueDate: validated.date,
          competence,
          ...(wasMoved ? {} : { originalCompetence: competence }),
          status: validated.status,
          paidAt: isPaid ? (validated.paidAt ?? transaction.paidAt ?? new Date()) : null,
          paidById: validated.paidById || null,
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          paymentMethodId: validated.paymentMethodId,
          creditCardId: validated.creditCardId || null,
          costCenterId: validated.costCenterId || null,
          notes: validated.notes || null,
        },
      });

      await recalculateDebtTotals(tx, debtId);
      return u;
    });

    await createAuditLog({
      action: 'UPDATE_DEBT_INSTALLMENT',
      entity: 'Transaction',
      entityId: transactionId,
      oldValue: transaction,
      newValue: updated,
    });

    revalidatePath(`/debts/${debtId}`);
    revalidatePath('/debts');
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating installment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Não foi possível atualizar a parcela',
    };
  }
}
