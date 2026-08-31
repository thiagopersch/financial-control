'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { TransactionType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(TransactionType),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    const session = await requirePermission('categories', 'CREATE');
    const validated = categorySchema.parse(data);

    const existing = await prisma.category.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        type: validated.type,
        name: { equals: validated.name, mode: 'insensitive' },
      },
    });
    if (existing) {
      return { success: false, error: 'Já existe uma categoria com este nome' };
    }

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
  try {
    const session = await requirePermission('categories', 'UPDATE');
    const validated = categorySchema.parse(data);

    const existing = await prisma.category.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        type: validated.type,
        name: { equals: validated.name, mode: 'insensitive' },
        id: { not: id },
      },
    });
    if (existing) {
      return { success: false, error: 'Já existe uma categoria com este nome' };
    }

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
  try {
    const session = await requirePermission('categories', 'DELETE');
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
