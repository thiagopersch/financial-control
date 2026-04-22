import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export type GoalDTO = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  isActive: boolean;
  color: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export async function getGoals(): Promise<GoalDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const goals = await prisma.goal.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      deadline: goal.deadline?.toISOString() || null,
      isActive: goal.isActive,
      color: goal.color || '#0ea5e9',
      workspaceId: goal.workspaceId,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
}

export async function getGoalById(id: string): Promise<GoalDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!goal) return null;

    return {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      deadline: goal.deadline?.toISOString() || null,
      isActive: goal.isActive,
      color: goal.color,
      workspaceId: goal.workspaceId,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching goal:', error);
    return null;
  }
}
