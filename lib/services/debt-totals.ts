import { resolveDebtStatusFromBalance } from '@/lib/services/debt-status';
import { Prisma, TransactionStatus } from '@prisma/client';

/**
 * Recalcula os totais de uma dívida a partir das transações vinculadas (fonte da verdade).
 *
 * - Dívida parcelada (`installments > 0`): o valor total é a soma de todas as parcelas
 *   vinculadas — evita que incrementos/decrementos acumulados façam o total "derivar"
 *   e o progresso passar de 100%.
 * - Dívida sem parcelas: o valor total informado pelo usuário é mantido.
 *
 * Em ambos os casos, valor atual = total − soma das parcelas pagas, e o status
 * ACTIVE/PAID acompanha o saldo (ver `resolveDebtStatusFromBalance`).
 */
export async function recalculateDebtTotals(tx: Prisma.TransactionClient, debtId: string) {
  const debt = await tx.debt.findUnique({ where: { id: debtId } });
  if (!debt) return null;

  const transactions = await tx.transaction.findMany({
    where: { debtId },
    select: { amount: true, status: true },
  });

  const toCents = (value: Prisma.Decimal | number) => Math.round(Number(value) * 100);
  const paidCents = transactions
    .filter((t) => t.status === TransactionStatus.PAID)
    .reduce((sum, t) => sum + toCents(t.amount), 0);
  const totalCents =
    debt.installments && debt.installments > 0 && transactions.length > 0
      ? transactions.reduce((sum, t) => sum + toCents(t.amount), 0)
      : toCents(debt.initialValue);

  const initialValue = totalCents / 100;
  const currentValue = (totalCents - paidCents) / 100;

  return tx.debt.update({
    where: { id: debtId },
    data: {
      initialValue,
      currentValue,
      status: resolveDebtStatusFromBalance(debt.status, currentValue),
    },
  });
}
