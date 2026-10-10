import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export interface WorkspaceUserOption {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
}

/**
 * Usuários do workspace. `activeOnly` restringe aos ativos; `includeIds` garante
 * que usuários específicos (ex.: o "Pago por" atual de uma transação) venham
 * mesmo que estejam inativos.
 */
export async function getWorkspaceUsers({
  activeOnly = false,
  includeIds = [],
}: { activeOnly?: boolean; includeIds?: (string | null | undefined)[] } = {}): Promise<
  WorkspaceUserOption[]
> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const ids = includeIds.filter((id): id is string => !!id);

  try {
    return await prisma.user.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        ...(activeOnly ? { OR: [{ isActive: true }, { id: { in: ids } }] } : {}),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, isActive: true },
    });
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    return [];
  }
}
