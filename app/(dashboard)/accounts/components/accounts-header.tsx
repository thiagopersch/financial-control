'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccountsHeaderProps {
  showControls?: boolean;
  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
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
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="h-10 w-full md:w-56">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      createLabel="Nova Conta"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
    />
  );
}
