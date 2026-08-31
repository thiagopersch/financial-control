import prisma from '@/lib/prisma';
import { permissionKey } from '@/lib/permissions/has-permission';

export interface LoadedPermissions {
  permissionProfileId: string | null;
  permissionProfileName: string | null;
  permissions: string[];
}

/**
 * Busca as permissões efetivas de um usuário a partir do seu Perfil de
 * Permissão. Chamado a cada request no callback `jwt` do NextAuth para que
 * mudanças de perfil valham sem precisar deslogar.
 */
export async function loadPermissionsForUser(userId: string): Promise<LoadedPermissions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      permissionProfile: {
        select: {
          id: true,
          name: true,
          permissions: {
            select: {
              permission: { select: { resource: true, action: true } },
            },
          },
        },
      },
    },
  });

  if (!user?.permissionProfile) {
    return { permissionProfileId: null, permissionProfileName: null, permissions: [] };
  }

  return {
    permissionProfileId: user.permissionProfile.id,
    permissionProfileName: user.permissionProfile.name,
    permissions: user.permissionProfile.permissions.map(({ permission }) =>
      permissionKey(permission.resource, permission.action),
    ),
  };
}
