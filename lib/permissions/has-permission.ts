import type { PermissionAction } from '@prisma/client';

export function permissionKey(resource: string, action: PermissionAction): string {
  return `${resource}:${action}`;
}

export function hasPermission(
  permissions: string[] | undefined | null,
  resource: string,
  action: PermissionAction,
): boolean {
  if (!permissions) return false;
  return permissions.includes(permissionKey(resource, action));
}
