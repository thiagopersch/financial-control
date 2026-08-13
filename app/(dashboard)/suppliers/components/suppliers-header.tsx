'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { SuppliersFilters } from './suppliers-filters';

interface SuppliersHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function SuppliersHeader({ onCreate, paginationSlotRef }: SuppliersHeaderProps) {
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
      title="Fornecedores"
      description="Gerencie seus fornecedores e parceiros comerciais."
      searchParams={searchParams}
      onSearch={handleSearch}
      hasActiveFilters={hasActiveFilters}
      showFilters={showFilters}
      onToggleFilters={toggleFilters}
      createLabel="Novo fornecedor"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
      filtersPanel={
        <SuppliersFilters
          searchParams={searchParams}
          applyFilters={applyFilters}
          handleClearFilters={handleClearFilters}
        />
      }
    />
  );
}
