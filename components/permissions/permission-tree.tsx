'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PermissionTreeNode } from '@/lib/services/permission-profiles';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ListChecks,
  ListX,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PermissionTreeProps {
  catalog: PermissionTreeNode[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PermissionTree({ catalog, selectedIds, onChange, disabled }: PermissionTreeProps) {
  const [search, setSearch] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const term = search.trim().toLowerCase();
  const isSearching = term.length > 0;

  const visibleCatalog = useMemo(() => {
    if (!isSearching) return catalog;

    return catalog
      .map((module) => {
        const moduleMatches = module.module.toLowerCase().includes(term);
        const resources = module.resources
          .map((resource) => {
            const resourceMatches = resource.resourceLabel.toLowerCase().includes(term);
            const permissions =
              moduleMatches || resourceMatches
                ? resource.permissions
                : resource.permissions.filter((p) => p.actionLabel.toLowerCase().includes(term));
            if (permissions.length === 0) return null;
            return { ...resource, permissions };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (resources.length === 0) return null;
        return { ...module, resources };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [catalog, isSearching, term]);

  const visibleIds = useMemo(
    () => visibleCatalog.flatMap((m) => m.resources.flatMap((r) => r.permissions.map((p) => p.id))),
    [visibleCatalog],
  );

  const toggleId = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const toggleIds = (ids: string[], checked: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    onChange(Array.from(next));
  };

  const selectAll = () => onChange(Array.from(new Set([...selectedIds, ...visibleIds])));

  const deselectAll = () => {
    const toRemove = new Set(visibleIds);
    onChange(selectedIds.filter((id) => !toRemove.has(id)));
  };

  const expandAll = () => {
    setExpandedModules(new Set(visibleCatalog.map((m) => m.module)));
    setExpandedResources(
      new Set(visibleCatalog.flatMap((m) => m.resources.map((r) => `${m.module}::${r.resource}`))),
    );
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
    setExpandedResources(new Set());
  };

  const isModuleOpen = (module: string) => isSearching || expandedModules.has(module);
  const isResourceOpen = (key: string) => isSearching || expandedResources.has(key);

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const toggleResource = (key: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar permissão..."
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={disabled}>
            <ListChecks className="h-4 w-4" /> Marcar todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={disabled}
          >
            <ListX className="h-4 w-4" /> Desmarcar todos
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={expandAll} disabled={disabled}>
            <ChevronsUpDown className="h-4 w-4" /> Expandir todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={collapseAll}
            disabled={disabled}
          >
            <ChevronsDownUp className="h-4 w-4" /> Recolher todos
          </Button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-lg border">
        {visibleCatalog.length === 0 && (
          <p className="text-muted-foreground p-4 text-sm">Nenhuma permissão encontrada.</p>
        )}

        {visibleCatalog.map((module) => {
          const moduleIds = module.resources.flatMap((r) => r.permissions.map((p) => p.id));
          const moduleSelectedCount = moduleIds.filter((id) => selected.has(id)).length;
          const moduleChecked = moduleIds.length > 0 && moduleSelectedCount === moduleIds.length;
          const moduleIndeterminate = moduleSelectedCount > 0 && !moduleChecked;

          return (
            <Collapsible
              key={module.module}
              open={isModuleOpen(module.module)}
              onOpenChange={() => toggleModule(module.module)}
              className="border-b last:border-b-0"
            >
              <div className="hover:bg-muted/50 flex items-center gap-2 px-3 py-2">
                <Checkbox
                  checked={moduleIndeterminate ? 'indeterminate' : moduleChecked}
                  onCheckedChange={(checked) => toggleIds(moduleIds, !!checked)}
                  disabled={disabled}
                />
                <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 text-left">
                  <span className="text-sm font-semibold">{module.module}</span>
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    {moduleSelectedCount}/{moduleIds.length}
                    {isModuleOpen(module.module) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                {module.resources.map((resource) => {
                  const resourceKey = `${module.module}::${resource.resource}`;
                  const resourceIds = resource.permissions.map((p) => p.id);
                  const resourceSelectedCount = resourceIds.filter((id) => selected.has(id)).length;
                  const resourceChecked =
                    resourceIds.length > 0 && resourceSelectedCount === resourceIds.length;
                  const resourceIndeterminate = resourceSelectedCount > 0 && !resourceChecked;

                  return (
                    <Collapsible
                      key={resourceKey}
                      open={isResourceOpen(resourceKey)}
                      onOpenChange={() => toggleResource(resourceKey)}
                      className="border-t"
                    >
                      <div className="hover:bg-muted/30 flex items-center gap-2 py-2 pr-3 pl-8">
                        <Checkbox
                          checked={resourceIndeterminate ? 'indeterminate' : resourceChecked}
                          onCheckedChange={(checked) => toggleIds(resourceIds, !!checked)}
                          disabled={disabled}
                        />
                        <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 text-left">
                          <span className="text-sm">{resource.resourceLabel}</span>
                          <span className="text-muted-foreground flex items-center gap-2 text-xs">
                            {resourceSelectedCount}/{resourceIds.length}
                            {isResourceOpen(resourceKey) ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 py-2 pr-3 pl-14">
                          {resource.permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`perm-${permission.id}`}
                                checked={selected.has(permission.id)}
                                onCheckedChange={() => toggleId(permission.id)}
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
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
