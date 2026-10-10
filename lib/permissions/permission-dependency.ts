import type { PermissionAction } from '@prisma/client';

/**
 * Regra de dependência entre ações de um mesmo recurso: Criar, Editar e Excluir
 * exigem Visualizar. Marcar qualquer uma delas marca Visualizar; desmarcar
 * Visualizar desmarca as demais.
 */

interface ResourcePermission {
  id: string;
  action: PermissionAction;
}

/** Aplica a marcação/desmarcação de uma ação respeitando a dependência com VIEW. */
export function togglePermissionWithDependency(
  resourcePermissions: readonly ResourcePermission[],
  permissionId: string,
  checked: boolean,
  selected: ReadonlySet<string>,
): Set<string> {
  const next = new Set(selected);
  const target = resourcePermissions.find((p) => p.id === permissionId);
  if (!target) return next;

  const view = resourcePermissions.find((p) => p.action === 'VIEW');

  if (checked) {
    next.add(target.id);
    if (target.action !== 'VIEW' && view) next.add(view.id);
  } else if (target.action === 'VIEW') {
    resourcePermissions.forEach((p) => next.delete(p.id));
  } else {
    next.delete(target.id);
  }
  return next;
}

/**
 * Normaliza uma seleção vinda do client (fonte da verdade no servidor): descarta ids
 * desconhecidos e inclui o VIEW de todo recurso que tenha outra ação marcada.
 */
export function normalizePermissionSelection(
  selectedIds: readonly string[],
  allPermissions: readonly (ResourcePermission & { resource: string })[],
): string[] {
  const byId = new Map(allPermissions.map((p) => [p.id, p]));
  const result = new Set(selectedIds.filter((id) => byId.has(id)));

  for (const id of Array.from(result)) {
    const permission = byId.get(id)!;
    if (permission.action === 'VIEW') continue;
    const view = allPermissions.find(
      (p) => p.resource === permission.resource && p.action === 'VIEW',
    );
    if (view) result.add(view.id);
  }
  return Array.from(result);
}
