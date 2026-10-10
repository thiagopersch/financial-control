'use client';

import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { MultiSelect } from '@/components/ui/multi-select';
import { parseMultiParam, setMultiParam } from '@/lib/utils/filter-params';
import { useState } from 'react';

type Category = { id: string; name: string; color: string };

type BudgetsFiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  categories: Category[];
};

export function BudgetsFilters({
  searchParams,
  applyFilters,
  handleClearFilters,
  categories,
}: BudgetsFiltersProps) {
  const [categoryIds, setCategoryIds] = useState(parseMultiParam(searchParams.get('category')));

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    setMultiParam(params, 'category', categoryIds);
    applyFilters(params);
  };

  const handleClear = () => {
    setCategoryIds([]);
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Categoria">
        <MultiSelect
          options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
          value={categoryIds}
          onValueChange={setCategoryIds}
          placeholder="Todas as categorias"
        />
      </FilterField>
    </FilterPanel>
  );
}
