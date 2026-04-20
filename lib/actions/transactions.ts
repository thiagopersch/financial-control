"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { addMonths } from "date-fns";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(TransactionStatus),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  accountId: z.string().min(1, "Conta é obrigatória"),
  costCenterId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(["CONTINUOUS", "INSTALLMENTS"]).nullable().optional(),
  installments: z.coerce.number().min(1).nullable().optional(),
});

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = transactionSchema.parse(data);

    if (validated.isRecurring && validated.recurrenceType) {
      let count = validated.recurrenceType === "INSTALLMENTS" ? validated.installments || 1 : 12;

      let baseAmount = validated.amount;
      let installmentAmount = baseAmount;

      if (validated.recurrenceType === "INSTALLMENTS") {
        installmentAmount = Number((baseAmount / count).toFixed(2));
      }

      const result = await prisma.$transaction(async (tx) => {
        // Criar a primeira transação (pai)
        const parentTransaction = await tx.transaction.create({
          data: {
            type: validated.type,
            amount: installmentAmount,
            date: validated.date,
            dueDate: validated.dueDate,
            status: validated.status,
            categoryId: validated.categoryId,
            accountId: validated.accountId,
            costCenterId: validated.costCenterId,
            supplierId: validated.supplierId,
            notes: validated.notes,
            workspaceId: session.user.workspaceId,
            isRecurring: true,
            recurrenceType: validated.recurrenceType,
            installments: validated.installments,
          },
        });

        // Atualizar saldo se estiver pago
        if (validated.status === TransactionStatus.PAID) {
          const amountChange =
            validated.type === TransactionType.INCOME ? installmentAmount : -installmentAmount;
          await tx.account.update({
            where: { id: validated.accountId },
            data: { balance: { increment: amountChange } },
          });
        }

        const futureTransactions = [];
        for (let i = 1; i < count; i++) {
          let currentInstallmentAmount = installmentAmount;

          if (validated.recurrenceType === "INSTALLMENTS" && i === count - 1) {
            currentInstallmentAmount = Number(
              (baseAmount - installmentAmount * (count - 1)).toFixed(2),
            );
          }

          futureTransactions.push({
            type: validated.type,
            amount: currentInstallmentAmount,
            date: addMonths(validated.date, i),
            dueDate: validated.dueDate ? addMonths(validated.dueDate, i) : null,
            status: TransactionStatus.PENDING,
            categoryId: validated.categoryId,
            accountId: validated.accountId,
            costCenterId: validated.costCenterId,
            supplierId: validated.supplierId,
            notes: `${validated.notes || ""} (${i + 1}/${count})`,
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

        return parentTransaction;
      });

      await createAuditLog({
        action: "CREATE_RECURRING_TRANSACTION",
        entity: "Transaction",
        entityId: result.id,
        newValue: validated,
      });

      revalidatePath("/transactions");
      revalidatePath("/dashboard");
      revalidatePath("/accounts");
      return { success: true };
    }

    // Fluxo normal (não recorrente)
    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          type: validated.type,
          amount: validated.amount,
          date: validated.date,
          dueDate: validated.dueDate,
          status: validated.status,
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          costCenterId: validated.costCenterId,
          supplierId: validated.supplierId,
          notes: validated.notes,
          workspaceId: session.user.workspaceId,
        },
      });

      // Atualizar saldo se estiver pago
      if (validated.status === TransactionStatus.PAID) {
        const amountChange =
          validated.type === TransactionType.INCOME ? validated.amount : -validated.amount;
        await tx.account.update({
          where: { id: validated.accountId },
          data: { balance: { increment: amountChange } },
        });
      }

      return t;
    });

    await createAuditLog({
      action: "CREATE_TRANSACTION",
      entity: "Transaction",
      entityId: transaction.id,
      newValue: validated,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    return {
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Erro ao criar transação" };
  }
}

export async function updateTransaction(id: string, data: z.infer<typeof transactionSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = transactionSchema.parse(data);

    const oldTransaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!oldTransaction) return { success: false, error: "Transação não encontrada" };

    const transaction = await prisma.$transaction(async (tx) => {
      if (oldTransaction.status === TransactionStatus.PAID) {
        const oldAmount = Number(oldTransaction.amount);
        const reverseChange =
          oldTransaction.type === TransactionType.INCOME ? -oldAmount : oldAmount;
        await tx.account.update({
          where: { id: oldTransaction.accountId! },
          data: { balance: { increment: reverseChange } },
        });

        if (oldTransaction.debtId) {
          const debt = await tx.debt.findUnique({
            where: { id: oldTransaction.debtId },
          });
          if (debt) {
            const paidTransactions = await tx.transaction.findMany({
              where: { debtId: oldTransaction.debtId, status: TransactionStatus.PAID },
            });
            const totalPaid = paidTransactions.reduce((sum, t) => sum + Number(t.amount), 0) - oldAmount;
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
          type: validated.type,
          amount: validated.amount,
          date: validated.date,
          dueDate: validated.dueDate,
          status: validated.status,
          categoryId: validated.categoryId,
          accountId: validated.accountId,
          costCenterId: validated.costCenterId,
          supplierId: validated.supplierId,
          notes: validated.notes,
          isRecurring: validated.isRecurring,
          recurrenceType: validated.recurrenceType,
          installments: validated.installments,
        },
      });

      if (validated.status === TransactionStatus.PAID) {
        const amountChange =
          validated.type === TransactionType.INCOME ? validated.amount : -validated.amount;
        await tx.account.update({
          where: { id: validated.accountId },
          data: { balance: { increment: amountChange } },
        });

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
      action: "UPDATE_TRANSACTION",
      entity: "Transaction",
      entityId: transaction.id,
      newValue: validated,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/debts");
    return {
      success: true,
      data: {
        ...transaction,
        amount: transaction.amount.toNumber(),
      },
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false, error: "Erro ao atualizar transação" };
  }
}

export async function deleteTransaction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!transaction) return { success: false, error: "Transação não encontrada" };

    await prisma.$transaction(async (tx) => {
      // Reverter saldo se estava pago
      if (transaction.status === TransactionStatus.PAID) {
        const amountChange =
          transaction.type === TransactionType.INCOME
            ? -Number(transaction.amount)
            : Number(transaction.amount);
        await tx.account.update({
          where: { id: transaction.accountId! },
          data: { balance: { increment: amountChange } },
        });
      }

      await tx.transaction.delete({
        where: { id },
      });
    });

    await createAuditLog({
      action: "DELETE_TRANSACTION",
      entity: "Transaction",
      entityId: id,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: "Erro ao excluir transação" };
  }
}
