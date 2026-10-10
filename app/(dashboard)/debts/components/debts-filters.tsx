'use client';

import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { MultiSelect } from '@/components/ui/multi-select';
import { DEBT_STATUS_OPTIONS } from '@/lib/constants/debt-status';
import { useState } from 'react';

type Option = { id: string; name: string; color?: string };

type DebtsFiltersProps = {
  categoryFilter: string[];
  accountFilter: string[];
  supplierFilter: string[];
  statusFilter: string[];
  categoryOptions: Option[];
  accountOptions: Option[];
  supplierOptions: Option[];
  onApply: (values: {
    category: string[];
    account: string[];
    supplier: string[];
    status: string[];
  }) => void;
  onClear: () => void;
};

const toMultiOptions = (options: Option[]) =>
  options.map((option) => ({ value: option.id, label: option.name, color: option.color }));

export function DebtsFilters({
  categoryFilter,
  accountFilter,
  supplierFilter,
  statusFilter,
  categoryOptions,
  accountOptions,
  supplierOptions,
  onApply,
  onClear,
}: DebtsFiltersProps) {
  const [category, setCategory] = useState(categoryFilter);
  const [account, setAccount] = useState(accountFilter);
  const [supplier, setSupplier] = useState(supplierFilter);
  const [status, setStatus] = useState(statusFilter);

  // Sincroniza o rascunho quando os filtros externos mudam (ex.: restaurados ou "Limpar"),
  // sem useEffect — evita o cascading render de setState em effect.
  const [prevFilters, setPrevFilters] = useState({
    categoryFilter,
    accountFilter,
    supplierFilter,
    statusFilter,
  });
  if (
    prevFilters.categoryFilter !== categoryFilter ||
    prevFilters.accountFilter !== accountFilter ||
    prevFilters.supplierFilter !== supplierFilter ||
    prevFilters.statusFilter !== statusFilter
  ) {
    setPrevFilters({ categoryFilter, accountFilter, supplierFilter, statusFilter });
    setCategory(categoryFilter);
    setAccount(accountFilter);
    setSupplier(supplierFilter);
    setStatus(statusFilter);
  }

  const handleApply = () => {
    onApply({ category, account, supplier, status });
  };

  const handleClear = () => {
    setCategory([]);
    setAccount([]);
    setSupplier([]);
    setStatus([]);
    onClear();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear} gridClassName="md:grid-cols-4">
      <FilterField label="Categoria">
        <MultiSelect
          options={toMultiOptions(categoryOptions)}
          value={category}
          onValueChange={setCategory}
          placeholder="Todas"
        />
      </FilterField>

      <FilterField label="Conta">
        <MultiSelect
          options={toMultiOptions(accountOptions)}
          value={account}
          onValueChange={setAccount}
          placeholder="Todas"
        />
      </FilterField>

      <FilterField label="Fornecedor">
        <MultiSelect
          options={toMultiOptions(supplierOptions)}
          value={supplier}
          onValueChange={setSupplier}
          placeholder="Todos"
        />
      </FilterField>

      <FilterField label="Status">
        <MultiSelect
          options={DEBT_STATUS_OPTIONS}
          value={status}
          onValueChange={setStatus}
          placeholder="Todos"
        />
      </FilterField>
    </FilterPanel>
  );
}
