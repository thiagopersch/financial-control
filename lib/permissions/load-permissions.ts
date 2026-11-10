import { cached, invalidate } from '@/lib/cache/redis';
import prisma from '@/lib/prisma';
import { permissionKey } from '@/lib/permissions/has-permission';

/** TTL curto como rede de segurança; a invalidação explícita é o caminho principal. */
const PERMISSIONS_TTL_SEC = 300;

const permissionsCacheKey = (userId: string) => `perm:${userId}`;

export interface LoadedPermissions {
  permissionProfileId: string | null;
  permissionProfileName: string | null;
  permissions: string[];
  /** Senha provisória pendente de troca: sem permissões até redefinir. */
  mustChangePassword: boolean;
}

/**
 * Busca as permissões efetivas de um usuário a partir do seu Perfil de
 * Permissão. Chamado a cada request no callback `jwt` do NextAuth para que
 * mudanças de perfil valham sem precisar deslogar — por isso o resultado fica
 * no Redis e é invalidado sempre que usuário ou perfil mudam
 * (`invalidateUserPermissions` / `invalidateProfilePermissions`).
 */
export function loadPermissionsForUser(userId: string): Promise<LoadedPermissions> {
  return cached(permissionsCacheKey(userId), PERMISSIONS_TTL_SEC, () =>
    loadPermissionsFromDb(userId),
  );
}

/** Invalida o cache de permissões dos usuários informados. */
export async function invalidateUserPermissions(...userIds: string[]): Promise<void> {
  await invalidate(...userIds.map(permissionsCacheKey));
}

/** Invalida o cache de todos os usuários vinculados a um Perfil de Permissão. */
export async function invalidateProfilePermissions(permissionProfileId: string): Promise<void> {
  const users = await prisma.user.findMany({
    where: { permissionProfileId },
    select: { id: true },
  });
  await invalidateUserPermissions(...users.map((u) => u.id));
}

async function loadPermissionsFromDb(userId: string): Promise<LoadedPermissions> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      mustChangePassword: true,
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

  // Usuário desativado perde todas as permissões na próxima request, mesmo com sessão aberta.
  if (!user?.isActive || !user.permissionProfile) {
    return {
      permissionProfileId: null,
      permissionProfileName: null,
      permissions: [],
      mustChangePassword: false,
    };
  }

  // Com redefinição de senha pendente, o usuário não acessa nada além de /reset-password:
  // sem permissões, toda Server Action/API com `requirePermission` também fica bloqueada.
  if (user.mustChangePassword) {
    return {
      permissionProfileId: user.permissionProfile.id,
      permissionProfileName: user.permissionProfile.name,
      permissions: [],
      mustChangePassword: true,
    };
  }

  return {
    permissionProfileId: user.permissionProfile.id,
    permissionProfileName: user.permissionProfile.name,
    permissions: user.permissionProfile.permissions.map(({ permission }) =>
      permissionKey(permission.resource, permission.action),
    ),
    mustChangePassword: false,
  };
}
