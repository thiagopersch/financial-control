import { getPermissionCatalog } from '@/lib/permissions/catalog';
import { permissionKey } from '@/lib/permissions/has-permission';
import prisma from '@/lib/prisma';
import { Prisma, type PermissionAction } from '@prisma/client';

type Client = Prisma.TransactionClient | typeof prisma;

export const ADMIN_PROFILE_NAME = 'Administrador';
export const MANAGER_PROFILE_NAME = 'Gestor';
export const VIEWER_PROFILE_NAME = 'Visualizador';

const MANAGER_EXCLUDED_RESOURCES = new Set(['users', 'permission-profiles', 'system-settings']);

/**
 * Sincroniza a tabela `Permission` com o catálogo derivado das páginas do
 * menu (idempotente). Chamado sempre que o catálogo é lido, para que uma
 * página nova adicionada em `components/sidebar/routes.ts` vire permissão
 * automaticamente, sem precisar de um passo manual de seed.
 */
export async function syncPermissionCatalog(client: Client = prisma) {
  const catalog = getPermissionCatalog();
  await Promise.all(
    catalog.map((entry) =>
      client.permission.upsert({
        where: { resource_action: { resource: entry.resource, action: entry.action } },
        create: {
          resource: entry.resource,
          action: entry.action,
          module: entry.module,
          label: entry.resourceLabel,
        },
        update: { module: entry.module, label: entry.resourceLabel },
      }),
    ),
  );
}

export interface PermissionTreeNode {
  module: string;
  resources: {
    resource: string;
    resourceLabel: string;
    permissions: { id: string; action: PermissionAction; actionLabel: string }[];
  }[];
}

/** Catálogo de permissões agrupado em Módulo → Recurso, pronto para a árvore de permissões da UI. */
export async function getPermissionCatalogGrouped(): Promise<PermissionTreeNode[]> {
  await syncPermissionCatalog();

  const catalog = getPermissionCatalog();
  const dbPermissions = await prisma.permission.findMany();
  const idByKey = new Map(dbPermissions.map((p) => [permissionKey(p.resource, p.action), p.id]));

  const moduleMap = new Map<string, Map<string, PermissionTreeNode['resources'][number]>>();

  for (const entry of catalog) {
    const id = idByKey.get(permissionKey(entry.resource, entry.action));
    if (!id) continue;

    if (!moduleMap.has(entry.module)) moduleMap.set(entry.module, new Map());
    const resourceMap = moduleMap.get(entry.module)!;

    if (!resourceMap.has(entry.resource)) {
      resourceMap.set(entry.resource, {
        resource: entry.resource,
        resourceLabel: entry.resourceLabel,
        permissions: [],
      });
    }
    resourceMap.get(entry.resource)!.permissions.push({
      id,
      action: entry.action,
      actionLabel: entry.actionLabel,
    });
  }

  return Array.from(moduleMap.entries()).map(([module, resourceMap]) => ({
    module,
    resources: Array.from(resourceMap.values()),
  }));
}

/**
 * Garante que o workspace tenha os perfis padrão: "Administrador" (acesso
 * total, protegido contra exclusão), "Gestor" (tudo exceto administração de
 * usuários/perfis/sistema) e "Visualizador" (somente leitura). Retorna o
 * perfil "Administrador" para ser atribuído ao primeiro usuário do
 * workspace.
 */
export async function ensureDefaultPermissionProfiles(client: Client, workspaceId: string) {
  await syncPermissionCatalog(client);
  const allPermissions = await client.permission.findMany();

  const existing = await client.permissionProfile.findMany({
    where: {
      workspaceId,
      name: { in: [ADMIN_PROFILE_NAME, MANAGER_PROFILE_NAME, VIEWER_PROFILE_NAME] },
    },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((p) => p.name));

  if (!existingNames.has(ADMIN_PROFILE_NAME)) {
    await client.permissionProfile.create({
      data: {
        name: ADMIN_PROFILE_NAME,
        description: 'Acesso completo a todas as páginas e ações do sistema.',
        isSystem: true,
        workspaceId,
        permissions: { create: allPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
  }

  if (!existingNames.has(MANAGER_PROFILE_NAME)) {
    const managerPermissions = allPermissions.filter(
      (p) => !MANAGER_EXCLUDED_RESOURCES.has(p.resource),
    );
    await client.permissionProfile.create({
      data: {
        name: MANAGER_PROFILE_NAME,
        description:
          'Acesso operacional completo, sem gerenciar usuários, perfis de permissão ou definições do sistema.',
        workspaceId,
        permissions: { create: managerPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
  }

  if (!existingNames.has(VIEWER_PROFILE_NAME)) {
    const viewerPermissions = allPermissions.filter((p) => p.action === 'VIEW');
    await client.permissionProfile.create({
      data: {
        name: VIEWER_PROFILE_NAME,
        description: 'Apenas visualização, sem poder criar, editar ou excluir registros.',
        workspaceId,
        permissions: { create: viewerPermissions.map((p) => ({ permissionId: p.id })) },
      },
    });
  }

  return client.permissionProfile.findFirstOrThrow({
    where: { workspaceId, name: ADMIN_PROFILE_NAME },
  });
}

/** Bloqueia excluir um perfil de sistema ou um perfil ainda vinculado a usuários. */
export async function assertPermissionProfileDeletable(client: Client, profileId: string) {
  const profile = await client.permissionProfile.findUnique({
    where: { id: profileId },
    include: { _count: { select: { users: true } } },
  });
  if (!profile) throw new Error('Perfil de permissão não encontrado');
  if (profile.isSystem) throw new Error('Não é possível excluir um perfil padrão do sistema');
  if (profile._count.users > 0)
    throw new Error('Não é possível excluir um perfil vinculado a usuários');
}

/**
 * Impede deixar o workspace sem nenhum usuário vinculado a um perfil de
 * sistema (ex: "Administrador"), evitando um lockout administrativo.
 */
export async function assertKeepsSystemProfileUser(
  client: Client,
  workspaceId: string,
  userId: string,
  newPermissionProfileId: string | null,
) {
  const targetUser = await client.user.findUnique({
    where: { id: userId },
    include: { permissionProfile: true },
  });
  if (!targetUser?.permissionProfile?.isSystem) return;
  if (newPermissionProfileId === targetUser.permissionProfileId) return;

  const remaining = await client.user.count({
    where: { workspaceId, id: { not: userId }, permissionProfile: { isSystem: true } },
  });
  if (remaining === 0) {
    throw new Error('Deve existir pelo menos um usuário com um perfil administrador no workspace');
  }
}
