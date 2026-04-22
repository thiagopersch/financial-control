'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function createSupplier(data: z.infer<typeof supplierSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = supplierSchema.parse(data);
    const supplier = await prisma.supplier.create({
      data: {
        ...validated,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath('/suppliers');
    return { success: true, data: supplier };
  } catch (error) {
    return { success: false, error: 'Erro ao criar fornecedor' };
  }
}

export async function updateSupplier(id: string, data: z.infer<typeof supplierSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = supplierSchema.parse(data);
    const supplier = await prisma.supplier.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: validated,
    });

    revalidatePath('/suppliers');
    return { success: true, data: supplier };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar fornecedor' };
  }
}

export async function deleteSupplier(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    await prisma.supplier.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath('/suppliers');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir fornecedor' };
  }
}
