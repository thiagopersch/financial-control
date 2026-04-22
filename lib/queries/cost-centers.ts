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
