"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
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
      let count =
        validated.recurrenceType === "INSTALLMENTS" ? validated.installments || 1 : 12; // Limite de 12 meses conforme pedido

      let baseAmount = validated.amount;
      let installmentAmount = baseAmount;

      if (validated.recurrenceType === "INSTALLMENTS") {
        installmentAmount = Number((baseAmount / count).toFixed(2));
      }

      // Criar a primeira transação (pai)
      const parentTransaction = await prisma.transaction.create({
        data: {
          type: validated.type,
          amount: installmentAmount,
          date: validated.date,
          dueDate: validated.dueDate,
          status: validated.status,
          categoryId: validated.categoryId,
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

        // Ajuste de centavos na última parcela para financiamentos
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
          status: TransactionStatus.PENDING, // Futuras começam como pendente
          categoryId: validated.categoryId,
          supplierId: validated.supplierId,
          notes: `${validated.notes || ""} (${i + 1}/${count})`,
          workspaceId: session.user.workspaceId,
          isRecurring: true,
          recurrenceType: validated.recurrenceType,
          parentTransactionId: parentTransaction.id,
        });
      }

      if (futureTransactions.length > 0) {
        await prisma.transaction.createMany({
          data: futureTransactions,
        });
      }

      revalidatePath("/transactions");
      revalidatePath("/dashboard");
      return { success: true };
    }

    // Fluxo normal (não recorrente)
    const transaction = await prisma.transaction.create({
      data: {
        type: validated.type,
        amount: validated.amount,
        date: validated.date,
        dueDate: validated.dueDate,
        status: validated.status,
        categoryId: validated.categoryId,
        supplierId: validated.supplierId,
        notes: validated.notes,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: {
        ...transaction,
        amount: transaction.amount.toNumber(),
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
    const transaction = await prisma.transaction.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: {
        type: validated.type,
        amount: validated.amount,
        date: validated.date,
        dueDate: validated.dueDate,
        status: validated.status,
        categoryId: validated.categoryId,
        supplierId: validated.supplierId,
        notes: validated.notes,
        isRecurring: validated.isRecurring,
        recurrenceType: validated.recurrenceType,
        installments: validated.installments,
      },
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
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
    await prisma.transaction.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir transação" };
  }
}
