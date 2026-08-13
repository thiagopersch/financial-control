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

export type GetSuppliersParams = {
  q?: string;
  personType?: string;
  isActive?: string;
  page?: number;
  pageSize?: number;
};

export async function getSuppliersPaginated(
  params: GetSuppliersParams = {},
): Promise<{ suppliers: SupplierDTO[]; totalCount: number }> {
  const session = await getServerSession(authOptions);
  if (!session) return { suppliers: [], totalCount: 0 };

  const { q, personType, isActive, page = 1, pageSize = 10 } = params;

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  if (personType) where.personType = personType as SupplierPersonType;
  if (isActive === 'true') where.isActive = true;
  if (isActive === 'false') where.isActive = false;
  if (q) {
    const query = q.trim();
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { document: { contains: query, mode: 'insensitive' } },
    ];
  }

  try {
    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      suppliers: suppliers.map(toDTO),
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return { suppliers: [], totalCount: 0 };
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
