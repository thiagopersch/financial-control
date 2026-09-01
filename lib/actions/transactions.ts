'use server';

import {
  checkBudgetAlerts,
  notifyNewTransaction,
  notifyTransactionStatusChange,
} from '@/lib/actions/notifications';
import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { matchCategorizationRule } from '@/lib/services/categorization';
import { applyConditionalRules } from '@/lib/services/conditional-rules';
import { resolveDebtStatusFromBalance } from '@/lib/services/debt-status';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { addMonths, startOfMonth } from 'date-fns';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

function moveDateToCurrentMonth(original: Date, now: Date): Date {
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(original.getDate(), daysInCurrentMonth);
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    clampedDay,
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
  );
}

const transactionSchema = z.object({
  description: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  type: z.enum(TransactionType),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(TransactionStatus),
  paidAt: z.coerce.date().nullable().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  debtId: z.string().nullable().optional(),
  notes: z.string().max(255, 'Máximo de 255 caracteres').optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(['CONTINUOUS', 'INSTALLMENTS']).nullable().optional(),
  installments: z.coerce.number().min(1).nullable().optional(),
  autoMoveEnabled: z.boolean().default(false),
});

async function syncDebtCurrentValueInTx(tx: Prisma.TransactionClient, debtId: string) {
  const debt = await tx.debt.findUnique({ where: { id: debtId } });
  if (!debt) return;

  const paidTransactions = await tx.transaction.findMany({
    where: { debtId, status: TransactionStatus.PAID },
  });
  const totalPaid = paidTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const debtNewCurrentValue = Number(debt.initialValue) - totalPaid;

  await tx.debt.update({
    where: { id: debtId },
    data: {
      currentValue: debtNewCurrentValue,
      status: resolveDebtStatusFromBalance(debt.status, debtNewCurrentValue),
    },
  });
}

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  try {
    const session = await requirePermission('transactions', 'CREATE');
    const validated = transactionSchema.parse(data);

    const matchedCategoryId = await matchCategorizationRule(
      session.user.workspaceId,
      `${validated.description} ${validated.notes || ''}`,
    );
    if (matchedCategoryId) {
      validated.categoryId = matchedCategoryId;
    }

    if (validated.isRecurring && validated.recurrenceType) {
      const count = validated.recurrenceType === 'INSTALLMENTS' ? validated.installments || 1 : 12;

      const baseAmount = validated.amount;
      let installmentAmount = baseAmount;

      if (validated.recurrenceType === 'INSTALLMENTS') {
        installmentAmount = Number((baseAmount / count).toFixed(2));
      }

      const result = await prisma.$transaction(async (tx) => {
        // Criar a primeira transação (pai)
        const parentTransaction = await tx.transaction.create({
          data: {
            description: validated.description,
            type: validated.type,
            amount: installmentAmount,
            date: validated.date,
            dueDate: validated.dueDate,
            status: validated.status,
            paidAt: validated.paidAt,
            autoMoveEnabled: validated.autoMoveEnabled,
            categoryId: validated.categoryId,
            accountId: validated.accountId,
            paymentMethodId: validated.paymentMethodId,
            creditCardId: validated.creditCardId,
            costCenterId: validated.costCenterId,
            supplierId: validated.supplierId,
            debtId: validated.debtId,
            notes: validated.notes,
            workspaceId: session.user.workspaceId,
            isRecurring: true,
            recurrenceType: validated.recurrenceType,
            installments: validated.installments,
          },
        });

        const futureTransactions = [];
        for (let i = 1; i < count; i++) {
          let currentInstallmentAmount = installmentAmount;

          if (validated.recurrenceType === 'INSTALLMENTS' && i === count - 1) {
            currentInstallmentAmount = Number(
              (baseAmount - installmentAmount * (count - 1)).toFixed(2),
            );
          }

          futureTransactions.push({
            description: validated.description,
            type: validated.type,
            amount: currentInstallmentAmount,
            date: addMonths(validated.date, i),
            dueDate: validated.dueDate ? addMonths(validated.dueDate, i) : null,
            status: TransactionStatus.PENDING,
            categoryId: validated.categoryId,
            accountId: validated.accountId,
            paymentMethodId: validated.paymentMethodId,
            creditCardId: validated.creditCardId,
            costCenterId: validated.costCenterId,
            supplierId: validated.supplierId,
            debtId: validated.debtId,
            notes: `${validated.notes || ''} (${i + 1}/${count})`,
            workspaceId: session.user.workspaceId,
            isRecurring: true,
            recurrenceType: validated.recurrenceType,
            parentTransactionId: parentTransaction.id,
          });
        }

        if (futureTransactions.length > 0) {
          await tx.transaction.createMany({
            data: futureTransactions,
          });
        }

        if (validated.debtId) {
          await tx.debt.update({
            where: { id: validated.debtId },
            data: { initialValue: { increment: validated.amount } },
          });
          await syncDebtCurrentValueInTx(tx, validated.debtId);
        }

        return parentTransaction;
      });

      await createAuditLog({
        action: 'CREATE_RECURRING_TRANSACTION',
        entity: 'Transaction',
        entityId: result.id,
        newValue: validated,
      });

      await notifyNewTransaction({ id: result.id });
      await applyConditionalRules(session.user.workspaceId, result.id);
      if (validated.type === TransactionType.EXPENSE) {
        await checkBudgetAlerts(session);
      }

      revalidatePath('/transactions');
      revalidatePath('/dashboard');
      revalidatePath('/accounts');
      revalidatePath('/debts');
      if (validated.debtId) revalidatePath(`/debts/${validated.debtId}`);
      return { success: true };
    }

    // Fluxo normal (não recorrente)
    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          description: validated.description,
          type: validated.type,
          amount: validated.amount,
          date: validated.date,
          dueDate: validated.dueDate,
          status: validated.status,
          paidAt: validated.paidAt,
          autoMoveEnabled: validated.autoMoveEnabled,
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          paymentMethodId: validated.paymentMethodId,
          creditCardId: validated.creditCardId,
          costCenterId: validated.costCenterId,
          supplierId: validated.supplierId,
          debtId: validated.debtId,
          notes: validated.notes,
          workspaceId: session.user.workspaceId,
        },
        include: { category: true },
      });

      if (validated.debtId) {
        await tx.debt.update({
          where: { id: validated.debtId },
          data: { initialValue: { increment: validated.amount } },
        });
        await syncDebtCurrentValueInTx(tx, validated.debtId);
      }

      return t;
    });

    await createAuditLog({
      action: 'CREATE_TRANSACTION',
      entity: 'Transaction',
      entityId: transaction.id,
      newValue: validated,
    });

    await notifyNewTransaction({ id: transaction.id });
    await applyConditionalRules(session.user.workspaceId, transaction.id);
    if (transaction.type === TransactionType.EXPENSE) {
      await checkBudgetAlerts(session);
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/accounts');
    revalidatePath('/debts');
    if (validated.debtId) revalidatePath(`/debts/${validated.debtId}`);
    return {
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Erro ao criar transação' };
  }
}

export async function updateTransaction(id: string, data: z.infer<typeof transactionSchema>) {
  try {
    const session = await requirePermission('transactions', 'UPDATE');
    const validated = transactionSchema.parse(data);

    const oldTransaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!oldTransaction) return { success: false, error: 'Transação não encontrada' };

    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          description: validated.description,
          type: validated.type,
          amount: validated.amount,
          date: validated.date,
          dueDate: validated.dueDate,
          status: validated.status,
          paidAt: validated.paidAt,
          autoMoveEnabled: validated.autoMoveEnabled,
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          paymentMethodId: validated.paymentMethodId,
          creditCardId: validated.creditCardId,
          costCenterId: validated.costCenterId,
          supplierId: validated.supplierId,
          debtId: validated.debtId,
          notes: validated.notes,
          isRecurring: validated.isRecurring,
          recurrenceType: validated.recurrenceType,
          installments: validated.installments,
        },
      });

      // Limite do cartão é calculado dinamicamente por competência (ver
      // lib/queries/credit-card-usage.ts) — não há mais contador para ajustar aqui.

      // Linking/unlinking/reamounting a transaction adjusts the debt's total (initialValue)
      // immediately, regardless of paid status — currentValue then falls out of that via
      // syncDebtCurrentValueInTx (initialValue - sum of PAID), so it reacts too.
      if (oldTransaction.debtId) {
        await tx.debt.update({
          where: { id: oldTransaction.debtId },
          data: { initialValue: { decrement: Number(oldTransaction.amount) } },
        });
      }
      if (updated.debtId) {
        await tx.debt.update({
          where: { id: updated.debtId },
          data: { initialValue: { increment: Number(updated.amount) } },
        });
      }

      const affectedDebtIds = new Set<string>();
      if (oldTransaction.debtId) affectedDebtIds.add(oldTransaction.debtId);
      if (updated.debtId) affectedDebtIds.add(updated.debtId);
      for (const debtId of affectedDebtIds) {
        await syncDebtCurrentValueInTx(tx, debtId);
      }

      return updated;
    });

    await createAuditLog({
      action: 'UPDATE_TRANSACTION',
      entity: 'Transaction',
      entityId: transaction.id,
      oldValue: oldTransaction,
      newValue: validated,
    });

    if (oldTransaction.status !== transaction.status) {
      await notifyTransactionStatusChange({
        id: transaction.id,
        oldStatus: oldTransaction.status,
        newStatus: transaction.status,
      });
    }

    await applyConditionalRules(session.user.workspaceId, transaction.id);
    if (transaction.type === TransactionType.EXPENSE) {
      await checkBudgetAlerts(session);
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/debts');
    if (oldTransaction.debtId) revalidatePath(`/debts/${oldTransaction.debtId}`);
    if (transaction.debtId && transaction.debtId !== oldTransaction.debtId) {
      revalidatePath(`/debts/${transaction.debtId}`);
    }
    return {
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: 'Erro ao atualizar transação' };
  }
}

export async function markTransactionAsPaid(id: string) {
  try {
    const session = await requirePermission('transactions', 'UPDATE');
    const transaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!transaction) return { success: false, error: 'Transação não encontrada' };

    const now = new Date();
    const isPastMonth = transaction.date < startOfMonth(now);

    const newDate = isPastMonth ? moveDateToCurrentMonth(transaction.date, now) : transaction.date;
    const newDueDate = isPastMonth
      ? transaction.dueDate
        ? moveDateToCurrentMonth(transaction.dueDate, now)
        : null
      : transaction.dueDate;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.transaction.update({
        where: { id },
        data: {
          status: TransactionStatus.PAID,
          paidAt: now,
          date: newDate,
          dueDate: newDueDate,
        },
      });

      // Limite do cartão é calculado dinamicamente por competência e já exclui
      // transações PAID — nada para ajustar aqui (ver lib/queries/credit-card-usage.ts).

      if (u.debtId) {
        await syncDebtCurrentValueInTx(tx, u.debtId);
      }

      return u;
    });

    await createAuditLog({
      action: isPastMonth ? 'MARK_PAID_AND_MOVE_TO_CURRENT_MONTH' : 'MARK_PAID',
      entity: 'Transaction',
      entityId: id,
      oldValue: {
        status: transaction.status,
        date: transaction.date,
        dueDate: transaction.dueDate,
      },
      newValue: {
        status: updated.status,
        date: updated.date,
        dueDate: updated.dueDate,
        paidAt: updated.paidAt,
      },
    });

    if (transaction.status !== updated.status) {
      await notifyTransactionStatusChange({
        id: updated.id,
        oldStatus: transaction.status,
        newStatus: updated.status,
      });
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/debts');
    if (updated.debtId) revalidatePath(`/debts/${updated.debtId}`);
    return { success: true, movedToCurrentMonth: isPastMonth };
  } catch (error) {
    console.error('Error marking transaction as paid:', error);
    return { success: false, error: 'Erro ao marcar transação como paga' };
  }
}

export async function autoMoveOverdueTransactions() {
  try {
    const session = await requirePermission('transactions', 'VIEW');
    const now = new Date();
    const candidates = await prisma.transaction.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        autoMoveEnabled: true,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.OVERDUE] },
        date: { lt: startOfMonth(now) },
      },
    });

    for (const t of candidates) {
      const newDate = moveDateToCurrentMonth(t.date, now);
      const newDueDate = t.dueDate ? moveDateToCurrentMonth(t.dueDate, now) : null;

      await prisma.transaction.update({
        where: { id: t.id },
        data: {
          date: newDate,
          dueDate: newDueDate,
          status: TransactionStatus.OVERDUE,
        },
      });

      await createAuditLog({
        action: 'AUTO_MOVE_TO_CURRENT_MONTH',
        entity: 'Transaction',
        entityId: t.id,
        oldValue: { date: t.date, dueDate: t.dueDate, status: t.status },
        newValue: { date: newDate, dueDate: newDueDate, status: TransactionStatus.OVERDUE },
      });
    }
  } catch (error) {
    console.error('Error auto-moving overdue transactions:', error);
  }
}

export async function toggleTransactionAutoMove(id: string, autoMoveEnabled: boolean) {
  try {
    const session = await requirePermission('transactions', 'UPDATE');
    await prisma.transaction.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: { autoMoveEnabled },
    });
    revalidatePath('/transactions');
    return { success: true };
  } catch (error) {
    console.error('Error toggling transaction auto-move:', error);
    return { success: false, error: 'Erro ao atualizar transação' };
  }
}

export async function deleteTransaction(id: string, deleteSeries = false) {
  try {
    const session = await requirePermission('transactions', 'DELETE');
    const transaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!transaction) return { success: false, error: 'Transação não encontrada' };

    if (deleteSeries && transaction.isRecurring) {
      const seriesRootId = transaction.parentTransactionId || transaction.id;
      const seriesTransactions = await prisma.transaction.findMany({
        where: {
          workspaceId: session.user.workspaceId,
          OR: [{ id: seriesRootId }, { parentTransactionId: seriesRootId }],
        },
      });

      // A transação pode ter sido gerada a partir de uma dívida (parcelas) — nesse caso,
      // a dívida precisa refletir a exclusão (valor atual, status e nº de parcelas restantes).
      const debtId = transaction.debtId;

      await prisma.$transaction(async (tx) => {
        await tx.transaction.deleteMany({
          where: { id: { in: seriesTransactions.map((t) => t.id) } },
        });

        if (debtId) {
          const remainingInstallments = await tx.transaction.count({ where: { debtId } });
          const deletedDebtAmount = seriesTransactions
            .filter((t) => t.debtId === debtId)
            .reduce((sum, t) => sum + Number(t.amount), 0);
          await tx.debt.update({
            where: { id: debtId },
            data: {
              installments: remainingInstallments,
              initialValue: { decrement: deletedDebtAmount },
            },
          });
        }
      });

      if (debtId) {
        const { syncDebtCurrentValue } = await import('@/lib/actions/debts');
        await syncDebtCurrentValue(debtId);
      }

      await createAuditLog({
        action: 'DELETE_RECURRING_SERIES',
        entity: 'Transaction',
        entityId: seriesRootId,
        oldValue: { deletedCount: seriesTransactions.length, debtId },
      });

      revalidatePath('/transactions');
      revalidatePath('/dashboard');
      revalidatePath('/accounts');
      revalidatePath('/debts');
      if (debtId) revalidatePath(`/debts/${debtId}`);
      return { success: true, deletedCount: seriesTransactions.length };
    }

    await prisma.$transaction(async (tx) => {
      if (transaction.debtId) {
        await tx.debt.update({
          where: { id: transaction.debtId },
          data: { initialValue: { decrement: Number(transaction.amount) } },
        });
      }

      await tx.transaction.delete({
        where: { id },
      });

      if (transaction.debtId) {
        await syncDebtCurrentValueInTx(tx, transaction.debtId);
      }
    });

    await createAuditLog({
      action: 'DELETE_TRANSACTION',
      entity: 'Transaction',
      entityId: id,
    });

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/accounts');
    revalidatePath('/debts');
    if (transaction.debtId) revalidatePath(`/debts/${transaction.debtId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: 'Erro ao excluir transação' };
  }
}
