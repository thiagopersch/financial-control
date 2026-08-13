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
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
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

export type GetCategoriesParams = {
  q?: string;
  type?: string;
  color?: string;
  page?: number;
  pageSize?: number;
};

export async function getCategoriesPaginated(
  params: GetCategoriesParams = {},
): Promise<{ categories: CategoryDTO[]; totalCount: number }> {
  const session = await getServerSession(authOptions);
  if (!session) return { categories: [], totalCount: 0 };

  const { q, type, color, page = 1, pageSize = 10 } = params;

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  if (type) where.type = type as TransactionType;
  if (color) where.color = color;
  if (q) where.name = { contains: q.trim(), mode: 'insensitive' };

  try {
    const [categories, totalCount] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.category.count({ where }),
    ]);

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        workspaceId: category.workspaceId,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      })),
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { categories: [], totalCount: 0 };
  }
}

export async function getDistinctCategoryColors(): Promise<string[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const categories = await prisma.category.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      select: { color: true },
      distinct: ['color'],
      orderBy: { color: 'asc' },
    });

    return categories.map((category) => category.color);
  } catch (error) {
    console.error('Error fetching distinct category colors:', error);
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
