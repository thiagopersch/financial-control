'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { CategoriesFilters } from './categories-filters';

interface CategoriesHeaderProps {
  onCreate: () => void;
  userRole?: string;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
  colors?: string[];
}

export function CategoriesHeader({
  onCreate,
  userRole,
  paginationSlotRef,
  colors,
}: CategoriesHeaderProps) {
  const canModify = userRole !== 'VIEWER';
  const {
    searchParams,
    showFilters,
    toggleFilters,
    hasActiveFilters,
    applyFilters,
    handleSearch,
    handleClearFilters,
  } = useUrlFilters();

  return (
    <ListPageHeader
      title="Categorias"
      description="Organize suas transações com categorias personalizadas."
      searchParams={searchParams}
      onSearch={handleSearch}
      hasActiveFilters={hasActiveFilters}
      showFilters={showFilters}
      onToggleFilters={toggleFilters}
      canCreate={canModify}
      createLabel="Nova Categoria"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
      filtersPanel={
        <CategoriesFilters
          searchParams={searchParams}
          applyFilters={applyFilters}
          handleClearFilters={handleClearFilters}
          colors={colors}
        />
      }
    />
  );
}
