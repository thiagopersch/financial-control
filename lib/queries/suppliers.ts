import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { type SupplierPersonType } from '@prisma/client';
import { getServerSession } from 'next-auth';

export type SupplierDTO = {
  id: string;
  name: string;
  document: string | null;
  contact: string | null;
  address: string | null;
  personType: SupplierPersonType;
  isActive: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

function toDTO(supplier: {
  id: string;
  name: string;
  document: string | null;
  contact: string | null;
  address: string | null;
  personType: SupplierPersonType;
  isActive: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}): SupplierDTO {
  return {
    id: supplier.id,
    name: supplier.name,
    document: supplier.document,
    contact: supplier.contact,
    address: supplier.address,
    personType: supplier.personType,
    isActive: supplier.isActive,
    workspaceId: supplier.workspaceId,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

export async function getSuppliers(): Promise<SupplierDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return suppliers.map(toDTO);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function getSupplierById(id: string): Promise<SupplierDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!supplier) return null;

    return toDTO(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return null;
  }
}
