'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import { MultiSelect } from '@/components/ui/multi-select';

interface AccountsHeaderProps {
  showControls?: boolean;
  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (value: string[]) => void;
  typeFilterOptions: { value: string; label: string }[];
  onCreate: () => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function AccountsHeader({
  showControls = true,
  searchParams,
  onSearch,
  typeFilter,
  onTypeFilterChange,
  typeFilterOptions,
  onCreate,
  paginationSlotRef,
}: AccountsHeaderProps) {
  return (
    <ListPageHeader
      title="Suas Contas"
      description="Gerencie seus bancos, carteiras e cartões em um só lugar."
      showControls={showControls}
      searchParams={searchParams}
      onSearch={onSearch}
      showFilterToggle={false}
      inlineFilters={
        <MultiSelect
          className="md:w-64"
          options={typeFilterOptions}
          value={typeFilter}
          onValueChange={onTypeFilterChange}
          placeholder="Todos os tipos"
          maxVisibleChips={1}
        />
      }
      createLabel="Nova Conta"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
    />
  );
}
