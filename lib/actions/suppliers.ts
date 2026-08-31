'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { isValidDocument, onlyDigits } from '@/lib/utils/document';
import { SupplierPersonType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const supplierSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    personType: z.enum(SupplierPersonType),
    document: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => isValidDocument(data.document || '', data.personType), {
    message: 'Documento inválido',
    path: ['document'],
  });

export async function createSupplier(data: z.infer<typeof supplierSchema>) {
  try {
    const session = await requirePermission('suppliers', 'CREATE');
    const validated = supplierSchema.parse(data);
    const documentDigits = validated.document ? onlyDigits(validated.document) : null;

    const [nameExists, documentExists] = await Promise.all([
      prisma.supplier.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          name: { equals: validated.name, mode: 'insensitive' },
        },
      }),
      documentDigits
        ? prisma.supplier.findFirst({
            where: {
              workspaceId: session.user.workspaceId,
              document: documentDigits,
            },
          })
        : Promise.resolve(null),
    ]);

    if (nameExists && documentExists) {
      return { success: false, error: 'Já existe um fornecedor com este nome e documento' };
    }
    if (nameExists) {
      return { success: false, error: 'Já existe um fornecedor com este nome' };
    }
    if (documentExists) {
      return { success: false, error: 'Já existe um fornecedor com este CNPJ/CPF' };
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validated,
        document: documentDigits,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath('/suppliers');
    return { success: true, data: supplier };
  } catch (error) {
    console.error('Error creating supplier:', error);
    return { success: false, error: 'Erro ao criar fornecedor' };
  }
}

export async function updateSupplier(id: string, data: z.infer<typeof supplierSchema>) {
  try {
    const session = await requirePermission('suppliers', 'UPDATE');
    const validated = supplierSchema.parse(data);
    const documentDigits = validated.document ? onlyDigits(validated.document) : null;

    const [nameExists, documentExists] = await Promise.all([
      prisma.supplier.findFirst({
        where: {
          workspaceId: session.user.workspaceId,
          name: { equals: validated.name, mode: 'insensitive' },
          id: { not: id },
        },
      }),
      documentDigits
        ? prisma.supplier.findFirst({
            where: {
              workspaceId: session.user.workspaceId,
              document: documentDigits,
              id: { not: id },
            },
          })
        : Promise.resolve(null),
    ]);

    if (nameExists && documentExists) {
      return { success: false, error: 'Já existe um fornecedor com este nome e documento' };
    }
    if (nameExists) {
      return { success: false, error: 'Já existe um fornecedor com este nome' };
    }
    if (documentExists) {
      return { success: false, error: 'Já existe um fornecedor com este CNPJ/CPF' };
    }

    const supplier = await prisma.supplier.update({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      data: { ...validated, document: documentDigits },
    });

    revalidatePath('/suppliers');
    return { success: true, data: supplier };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { success: false, error: 'Erro ao atualizar fornecedor' };
  }
}

export async function deleteSupplier(id: string) {
  try {
    const session = await requirePermission('suppliers', 'DELETE');
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
