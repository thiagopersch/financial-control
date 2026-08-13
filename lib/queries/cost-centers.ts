import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export type CostCenterDTO = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export async function getCostCenters(): Promise<CostCenterDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const costCenters = await prisma.costCenter.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return costCenters.map((cc) => ({
      id: cc.id,
      name: cc.name,
      description: cc.description,
      color: cc.color || '#64748b',
      parentId: cc.parentId,
      workspaceId: cc.workspaceId,
      createdAt: cc.createdAt.toISOString(),
      updatedAt: cc.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return [];
  }
}

export type GetCostCentersParams = {
  q?: string;
  parent?: string;
  page?: number;
  pageSize?: number;
};

export async function getCostCentersPaginated(
  params: GetCostCentersParams = {},
): Promise<{ costCenters: CostCenterDTO[]; totalCount: number }> {
  const session = await getServerSession(authOptions);
  if (!session) return { costCenters: [], totalCount: 0 };

  const { q, parent, page = 1, pageSize = 10 } = params;

  const where: any = {
    workspaceId: session.user.workspaceId,
  };

  if (parent === 'root') where.parentId = null;
  else if (parent === 'child') where.parentId = { not: null };

  if (q) {
    const query = q.trim();
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  try {
    const [costCenters, totalCount] = await Promise.all([
      prisma.costCenter.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.costCenter.count({ where }),
    ]);

    return {
      costCenters: costCenters.map((cc) => ({
        id: cc.id,
        name: cc.name,
        description: cc.description,
        color: cc.color || '#64748b',
        parentId: cc.parentId,
        workspaceId: cc.workspaceId,
        createdAt: cc.createdAt.toISOString(),
        updatedAt: cc.updatedAt.toISOString(),
      })),
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return { costCenters: [], totalCount: 0 };
  }
}

export async function getCostCenterById(id: string): Promise<CostCenterDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const costCenter = await prisma.costCenter.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!costCenter) return null;

    return {
      id: costCenter.id,
      name: costCenter.name,
      description: costCenter.description,
      color: costCenter.color,
      parentId: costCenter.parentId,
      workspaceId: costCenter.workspaceId,
      createdAt: costCenter.createdAt.toISOString(),
      updatedAt: costCenter.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching cost center:', error);
    return null;
  }
}
