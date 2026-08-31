import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export type PermissionProfileDTO = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionIds: string[];
  usersCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function getPermissionProfiles(): Promise<PermissionProfileDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const profiles = await prisma.permissionProfile.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: 'asc' },
      include: {
        permissions: { select: { permissionId: true } },
        _count: { select: { users: true } },
      },
    });

    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      isSystem: profile.isSystem,
      permissionIds: profile.permissions.map((p) => p.permissionId),
      usersCount: profile._count.users,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching permission profiles:', error);
    return [];
  }
}
