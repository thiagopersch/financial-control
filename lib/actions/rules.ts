'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const ruleSchema = z.object({
  keyword: z.string().min(2, 'Palavra-chave deve ter pelo menos 2 caracteres'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
});

export async function createRule(data: z.infer<typeof ruleSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = ruleSchema.parse(data);

    // Prevent duplicate keyword within workspace
    const existing = await prisma.categorizationRule.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        keyword: { equals: validated.keyword, mode: 'insensitive' },
      },
    });
    if (existing) return { success: false, error: 'Já existe uma regra com esta palavra-chave' };

    const rule = await prisma.categorizationRule.create({
      data: { ...validated, workspaceId: session.user.workspaceId },
    });

    revalidatePath('/rules');
    return { success: true, data: rule };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Dados inválidos' };
    return { success: false, error: 'Erro ao criar regra' };
  }
}

export async function updateRule(id: string, data: z.infer<typeof ruleSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = ruleSchema.parse(data);
    const rule = await prisma.categorizationRule.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: validated,
    });

    revalidatePath('/rules');
    return { success: true, data: rule };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar regra' };
  }
}

export async function deleteRule(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.categorizationRule.delete({
      where: { id, workspaceId: session.user.workspaceId },
    });

    revalidatePath('/rules');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir regra' };
  }
}
