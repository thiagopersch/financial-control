import prisma from '@/lib/prisma';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import {
  buildInstallmentDates,
  calculateInstallmentAmount,
  calculateInstallmentAmounts,
  divideExactly,
} from '@/lib/utils/installment-calculation';
import { startOfDay } from 'date-fns';

export {
  buildInstallmentDates,
  calculateInstallmentAmount,
  calculateInstallmentAmounts,
  divideExactly,
};

export async function getOrCreateDebtCategory(workspaceId: string) {
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

export interface SyncDebtInstallmentsParams {
  debtId: string;
  workspaceId: string;
  debtName: string;
  debtDescription: string | null | undefined;
  initialValue: number;
  installmentsTotal: number | null | undefined;
  calculationType: string | null;
  installmentValue: number | null;
  firstInstallmentMonth: string | null;
  dueDay: number | null;
  categoryId: string | null;
  accountId: string | null;
  supplierId: string | null;
  paymentMethodId: string | null;
  creditCardId: string | null;
  periodicity?: string | null;
  firstInstallmentDate?: Date | null;
}

/**
 * Synchronizes a debt's installment transactions with its current field values.
 *
 * Never touches PAID transactions (they anchor the debt's paid history/percentage).
 * Existing unpaid (PENDING/OVERDUE) transactions are updated in place; new ones are
 * only created when `installmentsTotal` grows past the current unpaid count, and
 * trailing unpaid ones are deleted when it shrinks.
 */
export async function syncDebtInstallments(
  tx: Prisma.TransactionClient,
  params: SyncDebtInstallmentsParams,
) {
  const { debtId, workspaceId, installmentsTotal } = params;

  if (!installmentsTotal || installmentsTotal <= 0) return;

  const category = params.categoryId
    ? await tx.category.findUnique({ where: { id: params.categoryId } })
    : await getOrCreateDebtCategory(workspaceId);
  if (!category) {
    throw new Error('Categoria não encontrada.');
  }

  if (!params.accountId) {
    throw new Error('Conta não encontrada.');
  }
  const account = await tx.account.findUnique({ where: { id: params.accountId } });
  if (!account) {
    throw new Error('Conta não encontrada.');
  }

  const existing = await tx.transaction.findMany({
    where: { debtId },
    orderBy: { dueDate: 'asc' },
  });
  const paid = existing.filter((t) => t.status === TransactionStatus.PAID);
  const unpaid = existing.filter((t) => t.status !== TransactionStatus.PAID);
  const paidCount = paid.length;

  if (installmentsTotal < paidCount) {
    throw new Error(
      `O número de parcelas não pode ser menor que o número de parcelas já pagas (${paidCount}).`,
    );
  }

  const remainingNeeded = installmentsTotal - paidCount;
  const paidTotal = paid.reduce((sum, t) => sum + Number(t.amount), 0);
  const remainingValue = Math.max(params.initialValue - paidTotal, 0);

  const amounts = calculateInstallmentAmounts(
    remainingValue,
    remainingNeeded,
    params.calculationType,
    params.installmentValue,
  );

  const today = startOfDay(new Date());
  const dates = buildInstallmentDates(
    params.firstInstallmentDate,
    params.firstInstallmentMonth,
    params.dueDay,
    params.periodicity,
    remainingNeeded,
  );

  for (let i = 0; i < remainingNeeded; i++) {
    const dueDate = dates[i];
    const status = dueDate < today ? TransactionStatus.OVERDUE : TransactionStatus.PENDING;

    const data = {
      type: TransactionType.EXPENSE,
      amount: amounts[i],
      date: dueDate,
      dueDate,
      status,
      categoryId: category.id,
      accountId: account.id,
      supplierId: params.supplierId || null,
      paymentMethodId: params.paymentMethodId || null,
      creditCardId: params.creditCardId || null,
      description: `${params.debtName} - Parcela ${paidCount + i + 1}/${installmentsTotal}`,
      notes: params.debtDescription || null,
      workspaceId,
      debtId,
      isRecurring: true,
      recurrenceType: 'INSTALLMENTS' as const,
      installments: installmentsTotal,
    };

    const existingRow = unpaid[i];
    if (existingRow) {
      await tx.transaction.update({ where: { id: existingRow.id }, data });
    } else {
      await tx.transaction.create({ data });
    }
  }

  if (unpaid.length > remainingNeeded) {
    const toDelete = unpaid.slice(remainingNeeded);
    await tx.transaction.deleteMany({ where: { id: { in: toDelete.map((t) => t.id) } } });
  }
}
