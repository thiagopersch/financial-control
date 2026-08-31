'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { hasPermission } from '@/lib/permissions/has-permission';
import { useSession } from 'next-auth/react';
import { CategoriesFilters } from './categories-filters';

interface CategoriesHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
  colors?: string[];
}

export function CategoriesHeader({ onCreate, paginationSlotRef, colors }: CategoriesHeaderProps) {
  const { data: session } = useSession();
  const canModify = hasPermission(session?.user?.permissions, 'categories', 'CREATE');
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
