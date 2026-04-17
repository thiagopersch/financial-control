"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { AccountType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const accountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.nativeEnum(AccountType),
  balance: z.coerce.number().default(0),
  color: z.string().optional().default("#000000"),
});

export async function createAccount(data: z.infer<typeof accountSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = accountSchema.parse(data);

    const account = await prisma.account.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/accounts");
    return { success: true, data: account };
  } catch (error) {
    console.error("Error creating account:", error);
    return { success: false, error: "Erro ao criar conta" };
  }
}

export async function updateAccount(id: string, data: z.infer<typeof accountSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = accountSchema.parse(data);

    const account = await prisma.account.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: validated,
    });

    revalidatePath("/accounts");
    return { success: true, data: account };
  } catch (error) {
    console.error("Error updating account:", error);
    return { success: false, error: "Erro ao atualizar conta" };
  }
}

export async function deleteAccount(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    // Check if account has transactions
    const hasTransactions = await prisma.transaction.findFirst({
      where: { accountId: id },
    });

    if (hasTransactions) {
      return { success: false, error: "Esta conta possui transações vinculadas e não pode ser excluída." };
    }

    await prisma.account.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Erro ao excluir conta" };
  }
}
