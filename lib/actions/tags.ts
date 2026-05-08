'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const tagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().optional().default('#6366f1'),
});

export async function createTag(data: z.infer<typeof tagSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = tagSchema.parse(data);

    const tag = await prisma.tag.create({
      data: {
        name: validated.name,
        color: validated.color,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'CREATE_TAG',
      entity: 'Tag',
      entityId: tag.id,
      newValue: validated,
    });

    revalidatePath('/tags');
    revalidatePath('/transactions');
    return { success: true, data: tag };
  } catch {
    return { success: false, error: 'Erro ao criar tag' };
  }
}

export async function updateTag(id: string, data: z.infer<typeof tagSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = tagSchema.parse(data);

    const tag = await prisma.tag.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: validated,
    });

    await createAuditLog({
      action: 'UPDATE_TAG',
      entity: 'Tag',
      entityId: tag.id,
      newValue: validated,
    });

    revalidatePath('/tags');
    revalidatePath('/transactions');
    return { success: true, data: tag };
  } catch {
    return { success: false, error: 'Erro ao atualizar tag' };
  }
}

export async function deleteTag(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.tag.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_TAG',
      entity: 'Tag',
      entityId: id,
    });

    revalidatePath('/tags');
    revalidatePath('/transactions');
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao excluir tag' };
  }
}
