import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export interface TagDTO {
  id: string;
  name: string;
  color: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

export async function getTags(): Promise<TagDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const tags = await prisma.tag.findMany({
      where: { workspaceId: session.user.workspaceId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      workspaceId: tag.workspaceId,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
      _count: tag._count,
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
