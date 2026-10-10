'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { togglePermissionWithDependency } from '@/lib/permissions/permission-dependency';
import type { PermissionTreeNode } from '@/lib/services/permission-profiles';
import { cn } from '@/lib/utils';
import { normalizeSearchText } from '@/lib/utils/text';
import { ListChecks, ListX, Search } from 'lucide-react';
import { useMemo, useState, type ComponentProps } from 'react';

type Resource = PermissionTreeNode['resources'][number];

interface PermissionTreeProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  catalog: PermissionTreeNode[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

function checkState(ids: string[], selected: ReadonlySet<string>) {
  const count = ids.filter((id) => selected.has(id)).length;
  const all = ids.length > 0 && count === ids.length;
  return { count, checked: all ? true : count > 0 ? ('indeterminate' as const) : false };
}

/**
 * Seleção de permissões em colunas: um card por página (recurso) com as ações
 * Visualizar/Criar/Editar/Excluir empilhadas. Criar/Editar/Excluir dependem de Visualizar.
 */
export function PermissionTree({
  catalog,
  selectedIds,
  onChange,
  disabled,
  className,
  ...props
}: PermissionTreeProps) {
  const [search, setSearch] = useState('');
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const term = normalizeSearchText(search);

  // A busca filtra por módulo, página ou ação, mas sempre mostra a página inteira:
  // as ações de um recurso dependem umas das outras.
  const visibleCatalog = useMemo(() => {
    if (!term) return catalog;
    return catalog
      .map((module) => {
        const moduleMatches = normalizeSearchText(module.module).includes(term);
        const resources = module.resources.filter(
          (resource) =>
            moduleMatches ||
            normalizeSearchText(resource.resourceLabel).includes(term) ||
            resource.permissions.some((p) => normalizeSearchText(p.actionLabel).includes(term)),
        );
        return resources.length > 0 ? { ...module, resources } : null;
      })
      .filter((m): m is PermissionTreeNode => m !== null);
  }, [catalog, term]);

  const allIds = useMemo(
    () => catalog.flatMap((m) => m.resources.flatMap((r) => r.permissions.map((p) => p.id))),
    [catalog],
  );
  const visibleIds = useMemo(
    () => visibleCatalog.flatMap((m) => m.resources.flatMap((r) => r.permissions.map((p) => p.id))),
    [visibleCatalog],
  );

  const setIds = (ids: string[], checked: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    onChange(Array.from(next));
  };

  const togglePermission = (resource: Resource, permissionId: string, checked: boolean) => {
    onChange(
      Array.from(
        togglePermissionWithDependency(resource.permissions, permissionId, checked, selected),
      ),
    );
  };

  const resourceIds = (resource: Resource) => resource.permissions.map((p) => p.id);
  const totalSelected = allIds.filter((id) => selected.has(id)).length;

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar página ou ação..."
            aria-label="Buscar permissão"
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground mr-1 text-xs tabular-nums">
            {totalSelected} de {allIds.length} selecionadas
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIds(visibleIds, true)}
            disabled={disabled}
          >
            <ListChecks className="h-4 w-4" /> Marcar todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIds(visibleIds, false)}
            disabled={disabled}
          >
            <ListX className="h-4 w-4" /> Desmarcar todos
          </Button>
        </div>
      </div>

      {visibleCatalog.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Nenhuma permissão encontrada.
        </p>
      )}

      {visibleCatalog.map((module, moduleIndex) => {
        const moduleIds = module.resources.flatMap(resourceIds);
        const moduleState = checkState(moduleIds, selected);
        const moduleCheckboxId = `perm-module-${moduleIndex}`;

        return (
          <section key={module.module} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                id={moduleCheckboxId}
                checked={moduleState.checked}
                onCheckedChange={(checked) => setIds(moduleIds, checked === true)}
                disabled={disabled}
                aria-label={`Selecionar todas as permissões de ${module.module}`}
              />
              <Label
                htmlFor={moduleCheckboxId}
                className="cursor-pointer text-sm font-semibold tracking-wide uppercase"
              >
                {module.module}
              </Label>
              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                {moduleState.count}/{moduleIds.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {module.resources.map((resource) => {
                const ids = resourceIds(resource);
                const resourceState = checkState(ids, selected);
                const resourceCheckboxId = `perm-resource-${resource.resource}`;

                return (
                  <div
                    key={resource.resource}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      resourceState.count > 0 && 'border-primary/40 bg-primary/[0.03]',
                    )}
                  >
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Checkbox
                        id={resourceCheckboxId}
                        checked={resourceState.checked}
                        onCheckedChange={(checked) => setIds(ids, checked === true)}
                        disabled={disabled}
                        aria-label={`Selecionar todas as permissões de ${resource.resourceLabel}`}
                      />
                      <Label
                        htmlFor={resourceCheckboxId}
                        className="flex-1 cursor-pointer text-sm font-semibold"
                      >
                        {resource.resourceLabel}
                      </Label>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {resourceState.count}/{ids.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      {resource.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center gap-2 pl-1">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={selected.has(permission.id)}
                            onCheckedChange={(checked) =>
                              togglePermission(resource, permission.id, checked === true)
                            }
                            disabled={disabled}
                          />
                          <Label
                            htmlFor={`perm-${permission.id}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {permission.actionLabel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
