import { flatRoutes, routeGroups, topLevelRoutes, type Route } from '@/components/sidebar/routes';
import type { PermissionAction } from '@prisma/client';

/**
 * Recursos que não entram no sistema de permissões: são de acesso livre para
 * qualquer usuário autenticado (dashboard inicial e configurações pessoais).
 */
export const EXEMPT_RESOURCES = new Set(['dashboard', 'profiles']);

const DEFAULT_MODULE = 'Geral';

export const ACTION_LABELS: Record<PermissionAction, string> = {
  VIEW: 'Visualizar',
  CREATE: 'Criar',
  UPDATE: 'Editar',
  DELETE: 'Excluir',
};

export interface PermissionCatalogEntry {
  resource: string;
  resourceLabel: string;
  action: PermissionAction;
  actionLabel: string;
  module: string;
  label: string;
}

export function resourceFromHref(href: string): string {
  return href.replace(/^\//, '').split('/')[0];
}

function moduleForRoute(route: Route): string {
  const group = routeGroups.find((g) => g.routes.some((r) => r.href === route.href));
  return group?.title ?? DEFAULT_MODULE;
}

/**
 * Catálogo de permissões derivado automaticamente das páginas do menu
 * (components/sidebar/routes.ts). Cada página vira um `resource`; páginas
 * somente-leitura (`readOnly`) geram só a ação VIEW, as demais geram as 4
 * ações padrão (VIEW/CREATE/UPDATE/DELETE).
 */
export function getPermissionCatalog(): PermissionCatalogEntry[] {
  const seen = new Set<string>();
  const entries: PermissionCatalogEntry[] = [];

  for (const route of [...topLevelRoutes, ...flatRoutes]) {
    const resource = resourceFromHref(route.href);
    if (EXEMPT_RESOURCES.has(resource) || seen.has(resource)) continue;
    seen.add(resource);

    const moduleName = moduleForRoute(route);
    const actions: PermissionAction[] = route.readOnly
      ? ['VIEW']
      : ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

    for (const action of actions) {
      entries.push({
        resource,
        resourceLabel: route.label,
        action,
        actionLabel: ACTION_LABELS[action],
        module: moduleName,
        label: `${route.label} — ${ACTION_LABELS[action]}`,
      });
    }
  }

  return entries;
}
