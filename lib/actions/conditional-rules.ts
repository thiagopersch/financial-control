"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const conditionalRuleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  conditions: z.array(
    z.object({
      type: z.string(),
      value: z.any(),
    }),
  ),
  actions: z.array(
    z.object({
      type: z.string(),
      value: z.any(),
    }),
  ),
  priority: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function createConditionalRule(data: z.infer<typeof conditionalRuleSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = conditionalRuleSchema.parse(data);

    const rule = await prisma.conditionalRule.create({
      data: {
        name: validated.name,
        description: validated.description,
        conditions: validated.conditions as any,
        actions: validated.actions as any,
        priority: validated.priority,
        isActive: validated.isActive,
        workspaceId: session.user.workspaceId,
        createdById: session.user.id,
      },
    });

    revalidatePath("/automation");
    return { success: true, data: rule };
  } catch (error) {
    console.error("Error creating conditional rule:", error);
    return { success: false, error: "Erro ao criar regra" };
  }
}

export async function updateConditionalRule(
  id: string,
  data: Partial<z.infer<typeof conditionalRuleSchema>>,
) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const rule = await prisma.conditionalRule.update({
      where: { id, workspaceId: session.user.workspaceId },
      data,
    });

    revalidatePath("/automation");
    return { success: true, data: rule };
  } catch (error) {
    console.error("Error updating conditional rule:", error);
    return { success: false, error: "Erro ao atualizar regra" };
  }
}

export async function deleteConditionalRule(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    await prisma.conditionalRule.delete({
      where: { id, workspaceId: session.user.workspaceId },
    });

    revalidatePath("/automation");
    return { success: true };
  } catch (error) {
    console.error("Error deleting conditional rule:", error);
    return { success: false, error: "Erro ao excluir regra" };
  }
}

export async function toggleConditionalRule(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    await prisma.conditionalRule.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: { isActive },
    });

    revalidatePath("/automation");
    return { success: true };
  } catch (error) {
    console.error("Error toggling conditional rule:", error);
    return { success: false, error: "Erro ao atualizar regra" };
  }
}
