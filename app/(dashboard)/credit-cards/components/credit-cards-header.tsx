'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { MultiSelect } from '@/components/ui/multi-select';

interface CreditCardsHeaderProps {
  showControls?: boolean;
  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  accountFilter: string[];
  onAccountFilterChange: (value: string[]) => void;
  accountOptions: { id: string; name: string }[];
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function CreditCardsHeader({
  showControls = true,
  searchParams,
  onSearch,
  accountFilter,
  onAccountFilterChange,
  accountOptions,
  onCreate,
  paginationSlotRef,
}: CreditCardsHeaderProps) {
  return (
    <ListPageHeader
      title="Cartões de Crédito"
      description="Gerencie seus cartões de crédito e faturas."
      showControls={showControls}
      searchParams={searchParams}
      onSearch={onSearch}
      showFilterToggle={false}
      inlineFilters={
        <MultiSelect
          className="md:w-64"
          options={accountOptions.map((account) => ({ value: account.id, label: account.name }))}
          value={accountFilter}
          onValueChange={onAccountFilterChange}
          placeholder="Todas as contas"
          maxVisibleChips={1}
        />
      }
      createLabel="Novo Cartão"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
    />
  );
}
