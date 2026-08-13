'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { PaymentMethodsFilters } from './payment-methods-filters';

interface PaymentMethodsHeaderProps {
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function PaymentMethodsHeader({ onCreate, paginationSlotRef }: PaymentMethodsHeaderProps) {
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
      title="Meios de Pagamento"
      description="Gerencie os meios de pagamento e vincule uma ou mais contas a cada um."
      searchParams={searchParams}
      onSearch={handleSearch}
      hasActiveFilters={hasActiveFilters}
      showFilters={showFilters}
      onToggleFilters={toggleFilters}
      createLabel="Novo Meio de Pagamento"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
      filtersPanel={
        <PaymentMethodsFilters
          searchParams={searchParams}
          applyFilters={applyFilters}
          handleClearFilters={handleClearFilters}
        />
      }
    />
  );
}
