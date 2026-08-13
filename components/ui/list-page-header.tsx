'use client';

import { SearchInput } from '@/components/search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

interface ListPageHeaderProps {
  /** Omit when the page title is rendered by a parent (e.g. a server component). */
  title?: string;
  description?: string;
  /** Rendered next to the title/description (e.g. a MonthSelector). */
  headerActions?: ReactNode;
  /** Hides the entire search/filters/create row, leaving only the title block. */
  showControls?: boolean;

  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  /** Rendered next to the search input, always visible (no toggle) — e.g. a plain type Select. */
  inlineFilters?: ReactNode;

  showFilterToggle?: boolean;
  hasActiveFilters?: boolean;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  filtersPanel?: ReactNode;

  canCreate?: boolean;
  createLabel?: string;
  onCreate?: () => void;
  /** Rendered instead of the default create Button, when the module needs custom actions. */
  createActions?: ReactNode;

  paginationSlotRef?: (node: HTMLDivElement | null) => void;
  /** Extra content rendered after the create button/pagination slot (e.g. multiple pagination slots). */
  extraActions?: ReactNode;
}

export function ListPageHeader({
  title,
  description,
  headerActions,
  showControls = true,
  searchParams,
  onSearch,
  inlineFilters,
  showFilterToggle = true,
  hasActiveFilters = false,
  showFilters = false,
  onToggleFilters,
  filtersPanel,
  canCreate = true,
  createLabel = 'Novo',
  onCreate,
  createActions,
  paginationSlotRef,
  extraActions,
}: ListPageHeaderProps) {
  return (
    <div className="space-y-4">
      {(title || headerActions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {title ? (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
          ) : (
            <div />
          )}
          {headerActions}
        </div>
      )}

      {showControls && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <SearchInput searchParams={searchParams} handleSearch={onSearch} />
              {inlineFilters}
              {showFilterToggle && (
                <Button
                  type="button"
                  variant={hasActiveFilters ? 'default' : 'outline'}
                  size="lg"
                  onClick={onToggleFilters}
                  className={cn('w-full shrink-0 md:w-auto')}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </Button>
              )}
            </div>

            <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
              {createActions}
              {!createActions && canCreate && onCreate && (
                <Button onClick={onCreate} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> {createLabel}
                </Button>
              )}
              {paginationSlotRef && <div ref={paginationSlotRef} className="w-full md:w-auto" />}
              {extraActions}
            </div>
          </div>

          {showFilters && filtersPanel}
        </>
      )}
    </div>
  );
}
