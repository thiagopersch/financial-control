import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { type TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';

export type CategoryDTO = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export async function getCategories(): Promise<CategoryDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const categories = await prisma.category.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      workspaceId: category.workspaceId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategoryById(id: string): Promise<CategoryDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const category = await prisma.category.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      workspaceId: category.workspaceId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}
