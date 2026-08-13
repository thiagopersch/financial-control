'use client';

import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

type Option = { id: string; name: string; color?: string };

type DebtsFiltersProps = {
  categoryFilter: string;
  accountFilter: string;
  supplierFilter: string;
  categoryOptions: Option[];
  accountOptions: Option[];
  supplierOptions: Option[];
  onApply: (values: { category: string; account: string; supplier: string }) => void;
  onClear: () => void;
};

export function DebtsFilters({
  categoryFilter,
  accountFilter,
  supplierFilter,
  categoryOptions,
  accountOptions,
  supplierOptions,
  onApply,
  onClear,
}: DebtsFiltersProps) {
  const [category, setCategory] = useState(categoryFilter);
  const [account, setAccount] = useState(accountFilter);
  const [supplier, setSupplier] = useState(supplierFilter);

  useEffect(() => {
    setCategory(categoryFilter);
    setAccount(accountFilter);
    setSupplier(supplierFilter);
  }, [categoryFilter, accountFilter, supplierFilter]);

  const onSelectChange = (setter: (value: string) => void) => (value: string | null) => {
    setter(value || 'all');
  };

  const handleApply = () => {
    onApply({ category, account, supplier });
  };

  const handleClear = () => {
    setCategory('all');
    setAccount('all');
    setSupplier('all');
    onClear();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear} gridClassName="md:grid-cols-3">
      <FilterField label="Categoria">
        <Select value={category} onValueChange={onSelectChange(setCategory)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color ?? '#94a3b8' }}
                  />
                  {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Conta">
        <Select value={account} onValueChange={onSelectChange(setAccount)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {accountOptions.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: a.color ?? '#94a3b8' }}
                  />
                  {a.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Fornecedor">
        <Select value={supplier} onValueChange={onSelectChange(setSupplier)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {supplierOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#94a3b8' }} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </FilterPanel>
  );
}
