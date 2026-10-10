import { flatRoutes } from '@/components/sidebar/routes';
import { EXEMPT_RESOURCES, resourceFromHref } from '@/lib/permissions/catalog';
import { hasPermission } from '@/lib/permissions/has-permission';

const FALLBACK_ROUTE = '/profiles';

/** Primeira página do menu (na ordem da sidebar) que o usuário pode visualizar. */
export function getFirstAllowedRoute(permissions: string[]): string {
  const route = flatRoutes.find((r) => {
    const resource = resourceFromHref(r.href);
    return EXEMPT_RESOURCES.has(resource) || hasPermission(permissions, resource, 'VIEW');
  });
  return route?.href ?? FALLBACK_ROUTE;
}
