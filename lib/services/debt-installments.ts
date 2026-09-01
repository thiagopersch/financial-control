import prisma from '@/lib/prisma';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { addMonths, setDate, startOfDay, startOfMonth } from 'date-fns';

const DEFAULT_DUE_DAY = 10;

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

export function calculateInstallmentAmount(
  remainingValue: number,
  remainingCount: number,
  calculationType: string | null,
  installmentValue: number | null,
): number {
  if (calculationType === 'FIXED_INSTALLMENT' && installmentValue) {
    return installmentValue;
  }
  if (remainingCount <= 0) return 0;
  return Number((remainingValue / remainingCount).toFixed(2));
}

export function getInstallmentDueDate(
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
}

/**
 * Synchronizes a debt's installment transactions with its current field values.
 *
 * Never touches PAID transactions (they anchor the debt's paid history/percentage).
 * Existing unpaid (PENDING/OVERDUE) transactions are updated in place; new ones are
 * only created when `installmentsTotal` grows past the current unpaid count, and
 * trailing unpaid ones are deleted when it shrinks. This keeps transaction ids/paid
 * history stable across edits instead of deleting-and-recreating everything.
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
  const installmentAmount = calculateInstallmentAmount(
    remainingValue,
    remainingNeeded,
    params.calculationType,
    params.installmentValue,
  );
  const today = startOfDay(new Date());

  for (let i = 0; i < remainingNeeded; i++) {
    const dueDate = getInstallmentDueDate(i, params.firstInstallmentMonth, params.dueDay);
    const status = dueDate < today ? TransactionStatus.OVERDUE : TransactionStatus.PENDING;

    const data = {
      type: TransactionType.EXPENSE,
      amount: installmentAmount,
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

    // Limite do cartão é calculado dinamicamente por competência a partir das
    // próprias Transactions (ver lib/queries/credit-card-usage.ts) — não há mais
    // um contador em CreditCard.usedAmount para manter sincronizado aqui.
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
