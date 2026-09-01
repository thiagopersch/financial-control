import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export interface WorkspaceUserOption {
  id: string;
  name: string | null;
  email: string;
}

export async function getWorkspaceUsers(): Promise<WorkspaceUserOption[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    return await prisma.user.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    return [];
  }
}
