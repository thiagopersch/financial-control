"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const scheduledTransactionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "BUSINESS_DAYS"]),
  dayOfMonth: z.number().min(1).max(31).optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  nextRun: z.string().optional(),
});

export async function createScheduledTransaction(data: z.infer<typeof scheduledTransactionSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = scheduledTransactionSchema.parse(data);

    const nextRun = validated.nextRun ? new Date(validated.nextRun) : new Date();

    const transaction = await prisma.scheduledTransaction.create({
      data: {
        name: validated.name,
        type: validated.type,
        amount: validated.amount,
        frequency: validated.frequency,
        dayOfMonth: validated.dayOfMonth || 1,
        nextRun,
        isActive: true,
        categoryId: validated.categoryId,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/scheduled");
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error creating scheduled transaction:", error);
    return { success: false, error: "Erro ao criar agendamento" };
  }
}

export async function updateScheduledTransaction(
  id: string,
  data: Partial<z.infer<typeof scheduledTransactionSchema>>,
) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const transaction = await prisma.scheduledTransaction.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: {
        ...data,
        nextRun: data.nextRun ? new Date(data.nextRun) : undefined,
      },
    });

    revalidatePath("/scheduled");
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error updating scheduled transaction:", error);
    return { success: false, error: "Erro ao atualizar agendamento" };
  }
}

export async function deleteScheduledTransaction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    await prisma.scheduledTransaction.delete({
      where: { id, workspaceId: session.user.workspaceId },
    });

    revalidatePath("/scheduled");
    return { success: true };
  } catch (error) {
    console.error("Error deleting scheduled transaction:", error);
    return { success: false, error: "Erro ao excluir agendamento" };
  }
}

export async function toggleScheduledTransaction(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    await prisma.scheduledTransaction.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: { isActive },
    });

    revalidatePath("/scheduled");
    return { success: true };
  } catch (error) {
    console.error("Error toggling scheduled transaction:", error);
    return { success: false, error: "Erro ao atualizar agendamento" };
  }
}
