'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useState } from 'react';
import { RuleModal } from './rule-modal';
import { RulesFilters } from './rules-filters';

interface RulesHeaderProps {
  categories: { id: string; name: string; type: string; color: string }[];
  userRole?: string;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function RulesHeader({ categories, userRole, paginationSlotRef }: RulesHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      <ListPageHeader
        title="Regras"
        description="Automatize a categorização de transações."
        searchParams={searchParams}
        onSearch={handleSearch}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        onToggleFilters={toggleFilters}
        canCreate={canModify}
        createLabel="Nova Regra"
        onCreate={() => setIsOpen(true)}
        paginationSlotRef={paginationSlotRef}
        filtersPanel={
          <RulesFilters
            searchParams={searchParams}
            applyFilters={applyFilters}
            handleClearFilters={handleClearFilters}
            categories={categories}
          />
        }
      />

      <RuleModal isOpen={isOpen} onClose={() => setIsOpen(false)} categories={categories} />
    </>
  );
}
