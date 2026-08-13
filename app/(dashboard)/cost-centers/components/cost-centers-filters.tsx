'use client';

import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type CostCentersFiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
};

const PARENT_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'root', label: 'Apenas centros raiz' },
  { value: 'child', label: 'Apenas subcentros' },
];

export function CostCentersFilters({
  searchParams,
  applyFilters,
  handleClearFilters,
}: CostCentersFiltersProps) {
  const [parent, setParent] = useState(searchParams.get('parent') || 'all');

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (parent === 'all') params.delete('parent');
    else params.set('parent', parent);
    applyFilters(params);
  };

  const handleClear = () => {
    setParent('all');
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Tipo">
        <Select value={parent} onValueChange={(value) => setParent(value || 'all')}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {PARENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </FilterPanel>
  );
}
