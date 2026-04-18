"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const debtSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  initialValue: z.coerce.number().positive("Valor inicial deve ser maior que zero"),
  currentValue: z.coerce.number().positive("Valor atual deve ser maior que zero"),
  interestRate: z.coerce.number().min(0).max(100).optional(),
  minimumPayment: z.coerce.number().positive("Pagamento mínimo é obrigatório"),
  dueDay: z.number().min(1).max(31).optional(),
  startDate: z.string(),
});

export async function createDebt(data: z.infer<typeof debtSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = debtSchema.parse(data);

    const debt = await prisma.debt.create({
      data: {
        name: validated.name,
        description: validated.description,
        initialValue: validated.initialValue,
        currentValue: validated.currentValue,
        interestRate: validated.interestRate,
        minimumPayment: validated.minimumPayment,
        dueDay: validated.dueDay,
        startDate: new Date(validated.startDate),
        isActive: true,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/debts");
    return { success: true, data: debt };
  } catch (error) {
    console.error("Error creating debt:", error);
    return { success: false, error: "Erro ao criar dívida" };
  }
}

export async function updateDebt(id: string, data: Partial<z.infer<typeof debtSchema>>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const debt = await prisma.debt.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      },
    });

    revalidatePath("/debts");
    return { success: true, data: debt };
  } catch (error) {
    console.error("Error updating debt:", error);
    return { success: false, error: "Erro ao atualizar dívida" };
  }
}

export async function deleteDebt(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    await prisma.debt.delete({
      where: { id, workspaceId: session.user.workspaceId },
    });

    revalidatePath("/debts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting debt:", error);
    return { success: false, error: "Erro ao excluir dívida" };
  }
}
