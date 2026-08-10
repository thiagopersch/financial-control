'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import {
  checkBudgetAlerts,
  notifyNewTransaction,
  notifyTransactionStatusChange,
} from '@/lib/actions/notifications';
import { createAuditLog } from '@/lib/services/audit';
import { matchCategorizationRule } from '@/lib/services/categorization';
import { applyConditionalRules } from '@/lib/services/conditional-rules';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { addMonths } from 'date-fns';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const transactionSchema = z.object({
  description: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
  type: z.enum(TransactionType),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(TransactionStatus),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  notes: z.string().max(255, 'Máximo de 255 caracteres').optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(['CONTINUOUS', 'INSTALLMENTS']).nullable().optional(),
  installments: z.coerce.number().min(1).nullable().optional(),
});

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
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
            categoryId: validated.categoryId,
            accountId: validated.accountId,
            paymentMethodId: validated.paymentMethodId,
            creditCardId: validated.creditCardId,
            costCenterId: validated.costCenterId,
            supplierId: validated.supplierId,
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

        if (validated.creditCardId && validated.type === TransactionType.EXPENSE) {
          await tx.creditCard.update({
            where: { id: validated.creditCardId },
            data: { usedAmount: { increment: validated.amount } },
          });
        }

        return parentTransaction;
      });

      await createAuditLog({
        action: 'CREATE_RECURRING_TRANSACTION',
        entity: 'Transaction',
        entityId: result.id,
        newValue: validated,
      });

      const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
      await notifyNewTransaction({
        id: result.id,
        description: validated.description,
        amount: validated.amount,
        type: validated.type,
        categoryName: category?.name || '',
        dueDate: result.dueDate || result.date,
        isRecurring: result.isRecurring,
        debtId: result.debtId,
      });
      await applyConditionalRules(session.user.workspaceId, result.id);
      if (validated.type === TransactionType.EXPENSE) {
        await checkBudgetAlerts();
      }

      revalidatePath('/transactions');
      revalidatePath('/dashboard');
      revalidatePath('/accounts');
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
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          paymentMethodId: validated.paymentMethodId,
          creditCardId: validated.creditCardId,
          costCenterId: validated.costCenterId,
          supplierId: validated.supplierId,
          notes: validated.notes,
          workspaceId: session.user.workspaceId,
        },
        include: { category: true },
      });

      if (validated.creditCardId && validated.type === TransactionType.EXPENSE) {
        await tx.creditCard.update({
          where: { id: validated.creditCardId },
          data: { usedAmount: { increment: validated.amount } },
        });
      }

      return t;
    });

    await createAuditLog({
      action: 'CREATE_TRANSACTION',
      entity: 'Transaction',
      entityId: transaction.id,
      newValue: validated,
    });

    await notifyNewTransaction({
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      categoryName: transaction.category.name,
      dueDate: transaction.dueDate || transaction.date,
      isRecurring: transaction.isRecurring,
      debtId: transaction.debtId,
    });
    await applyConditionalRules(session.user.workspaceId, transaction.id);
    if (transaction.type === TransactionType.EXPENSE) {
      await checkBudgetAlerts();
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/accounts');
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
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = transactionSchema.parse(data);

    const oldTransaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!oldTransaction) return { success: false, error: 'Transação não encontrada' };

    const transaction = await prisma.$transaction(async (tx) => {
      if (oldTransaction.status === TransactionStatus.PAID) {
        const oldAmount = Number(oldTransaction.amount);
        if (oldTransaction.debtId) {
          const debt = await tx.debt.findUnique({
            where: { id: oldTransaction.debtId },
          });
          if (debt) {
            const paidTransactions = await tx.transaction.findMany({
              where: { debtId: oldTransaction.debtId, status: TransactionStatus.PAID },
            });
            const totalPaid =
              paidTransactions.reduce((sum, t) => sum + Number(t.amount), 0) - oldAmount;
            await tx.debt.update({
              where: { id: oldTransaction.debtId },
              data: {
                currentValue: Number(debt.initialValue) - totalPaid,
                isActive: Number(debt.initialValue) - totalPaid > 0,
              },
            });
          }
        }
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          description: validated.description,
          type: validated.type,
          amount: validated.amount,
          date: validated.date,
          dueDate: validated.dueDate,
          status: validated.status,
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          paymentMethodId: validated.paymentMethodId,
          creditCardId: validated.creditCardId,
          costCenterId: validated.costCenterId,
          supplierId: validated.supplierId,
          notes: validated.notes,
          isRecurring: validated.isRecurring,
          recurrenceType: validated.recurrenceType,
          installments: validated.installments,
        },
      });

      const oldCardUsage =
        oldTransaction.creditCardId && oldTransaction.type === TransactionType.EXPENSE
          ? Number(oldTransaction.amount)
          : 0;
      const newCardUsage =
        validated.creditCardId && validated.type === TransactionType.EXPENSE ? validated.amount : 0;

      if (oldTransaction.creditCardId !== validated.creditCardId) {
        if (oldTransaction.creditCardId && oldCardUsage > 0) {
          await tx.creditCard.update({
            where: { id: oldTransaction.creditCardId },
            data: { usedAmount: { decrement: oldCardUsage } },
          });
        }
        if (validated.creditCardId && newCardUsage > 0) {
          await tx.creditCard.update({
            where: { id: validated.creditCardId },
            data: { usedAmount: { increment: newCardUsage } },
          });
        }
      } else if (validated.creditCardId && oldCardUsage !== newCardUsage) {
        await tx.creditCard.update({
          where: { id: validated.creditCardId },
          data: { usedAmount: { increment: newCardUsage - oldCardUsage } },
        });
      }

      if (validated.status === TransactionStatus.PAID) {
        if (updated.debtId) {
          const debt = await tx.debt.findUnique({
            where: { id: updated.debtId },
          });
          if (debt) {
            const paidTransactions = await tx.transaction.findMany({
              where: { debtId: updated.debtId, status: TransactionStatus.PAID },
            });
            const totalPaid = paidTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            await tx.debt.update({
              where: { id: updated.debtId },
              data: {
                currentValue: Number(debt.initialValue) - totalPaid,
                isActive: Number(debt.initialValue) - totalPaid > 0,
              },
            });
          }
        }
      }

      return updated;
    });

    await createAuditLog({
      action: 'UPDATE_TRANSACTION',
      entity: 'Transaction',
      entityId: transaction.id,
      newValue: validated,
    });

    if (oldTransaction.status !== transaction.status) {
      const category = await prisma.category.findUnique({ where: { id: transaction.categoryId } });
      await notifyTransactionStatusChange({
        id: transaction.id,
        description: transaction.description,
        amount: Number(transaction.amount),
        categoryName: category?.name || '',
        oldStatus: oldTransaction.status,
        newStatus: transaction.status,
        dueDate: transaction.dueDate || transaction.date,
        isRecurring: transaction.isRecurring,
        debtId: transaction.debtId,
      });
    }

    await applyConditionalRules(session.user.workspaceId, transaction.id);
    if (transaction.type === TransactionType.EXPENSE) {
      await checkBudgetAlerts();
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/debts');
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

export async function deleteTransaction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!transaction) return { success: false, error: 'Transação não encontrada' };

    await prisma.$transaction(async (tx) => {
      if (transaction.creditCardId && transaction.type === TransactionType.EXPENSE) {
        await tx.creditCard.update({
          where: { id: transaction.creditCardId },
          data: { usedAmount: { decrement: Number(transaction.amount) } },
        });
      }

      await tx.transaction.delete({
        where: { id },
      });
    });

    await createAuditLog({
      action: 'DELETE_TRANSACTION',
      entity: 'Transaction',
      entityId: id,
    });

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: 'Erro ao excluir transação' };
  }
}
