'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { CostCentersFilters } from './cost-centers-filters';

interface CostCentersHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function CostCentersHeader({ onCreate, paginationSlotRef }: CostCentersHeaderProps) {
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
      title="Centros de Custo"
      description="Organize suas despesas por centro de custo."
      searchParams={searchParams}
      onSearch={handleSearch}
      hasActiveFilters={hasActiveFilters}
      showFilters={showFilters}
      onToggleFilters={toggleFilters}
      createLabel="Novo Centro de Custo"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
      filtersPanel={
        <CostCentersFilters
          searchParams={searchParams}
          applyFilters={applyFilters}
          handleClearFilters={handleClearFilters}
        />
      }
    />
  );
}
