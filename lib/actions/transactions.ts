"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { revalidatePath } from "next/cache";
import { TransactionType, TransactionStatus } from "@prisma/client";
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
});

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = transactionSchema.parse(data);
    const transaction = await prisma.transaction.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { 
      success: true, 
      data: {
        ...transaction,
        amount: transaction.amount.toNumber()
      } 
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
      data: validated,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { 
      success: true, 
      data: {
        ...transaction,
        amount: transaction.amount.toNumber()
      } 
    };
  } catch (error) {
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
