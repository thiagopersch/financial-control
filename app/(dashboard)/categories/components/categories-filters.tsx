'use client';

import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { parseMultiParam, setMultiParam } from '@/lib/utils/filter-params';
import { useState } from 'react';

type CategoriesFiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  types?: MultiSelectOption[];
  colors?: string[];
};

export function CategoriesFilters({
  searchParams,
  applyFilters,
  handleClearFilters,
  types = [
    { value: 'INCOME', label: 'Receitas', color: '#10b981' },
    { value: 'EXPENSE', label: 'Despesas', color: '#f43f5e' },
    { value: 'TRANSFER', label: 'Transferências', color: '#94a3b8' },
  ],
  colors = [],
}: CategoriesFiltersProps) {
  const [selectedTypes, setSelectedTypes] = useState(parseMultiParam(searchParams.get('type')));
  const [selectedColors, setSelectedColors] = useState(parseMultiParam(searchParams.get('color')));

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    setMultiParam(params, 'type', selectedTypes);
    setMultiParam(params, 'color', selectedColors);
    applyFilters(params);
  };

  const handleClear = () => {
    setSelectedTypes([]);
    setSelectedColors([]);
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Tipo">
        <MultiSelect
          options={types}
          value={selectedTypes}
          onValueChange={setSelectedTypes}
          placeholder="Todos os tipos"
        />
      </FilterField>

      <FilterField label="Cor">
        <MultiSelect
          options={colors.map((c) => ({ value: c, label: c, color: c }))}
          value={selectedColors}
          onValueChange={setSelectedColors}
          placeholder="Todas as cores"
        />
      </FilterField>
    </FilterPanel>
  );
}
