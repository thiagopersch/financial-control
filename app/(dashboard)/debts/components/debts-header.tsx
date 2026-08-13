'use client';

import { DebtsFilters } from '@/app/(dashboard)/debts/components/debts-filters';
import { ListPageHeader } from '@/components/ui/list-page-header';

type Option = { id: string; name: string; color?: string };

interface DebtsHeaderProps {
  onCreate: () => void;
  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  hasActiveFilters: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
  categoryFilter: string;
  accountFilter: string;
  supplierFilter: string;
  categoryOptions: Option[];
  accountOptions: Option[];
  supplierOptions: Option[];
  onApplyFilters: (values: { category: string; account: string; supplier: string }) => void;
  onClearFilters: () => void;
  showActivePagination?: boolean;
  activePaginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function DebtsHeader({
  onCreate,
  searchParams,
  onSearch,
  hasActiveFilters,
  showFilters,
  onToggleFilters,
  categoryFilter,
  accountFilter,
  supplierFilter,
  categoryOptions,
  accountOptions,
  supplierOptions,
  onApplyFilters,
  onClearFilters,
  showActivePagination,
  activePaginationSlotRef,
}: DebtsHeaderProps) {
  return (
    <ListPageHeader
      title="Dívidas e Financiamentos"
      description="Gerencie suas dívidas e simule quitação."
      searchParams={searchParams}
      onSearch={onSearch}
      hasActiveFilters={hasActiveFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      createLabel="Nova Dívida"
      onCreate={onCreate}
      extraActions={
        showActivePagination && (
          <div ref={activePaginationSlotRef} className="w-full md:w-auto" />
        )
      }
      filtersPanel={
        <DebtsFilters
          categoryFilter={categoryFilter}
          accountFilter={accountFilter}
          supplierFilter={supplierFilter}
          categoryOptions={categoryOptions}
          accountOptions={accountOptions}
          supplierOptions={supplierOptions}
          onApply={onApplyFilters}
          onClear={onClearFilters}
        />
      }
    />
  );
}
