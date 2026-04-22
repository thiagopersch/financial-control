'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(TransactionType),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = categorySchema.parse(data);
    const category = await prisma.category.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath('/categories');
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: 'Erro ao criar categoria' };
  }
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = categorySchema.parse(data);
    const category = await prisma.category.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: validated,
    });

    revalidatePath('/categories');
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar categoria' };
  }
}

export async function deleteCategory(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.category.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir categoria' };
  }
}
