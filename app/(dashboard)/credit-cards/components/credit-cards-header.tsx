'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreditCardsHeaderProps {
  showControls?: boolean;
  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
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
        <Select value={accountFilter} onValueChange={onAccountFilterChange}>
          <SelectTrigger className="h-10 w-full md:w-56">
            <SelectValue placeholder="Todas as contas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accountOptions.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      createLabel="Novo Cartão"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
    />
  );
}
