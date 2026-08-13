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

type CategoriesFiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  types?: { value: string; label: string; color: string }[];
  colors?: string[];
};

export function CategoriesFilters({
  searchParams,
  applyFilters,
  handleClearFilters,
  types = [
    { value: 'all', label: 'Todos os tipos', color: '' },
    { value: 'INCOME', label: 'Receitas', color: '#10b981' },
    { value: 'EXPENSE', label: 'Despesas', color: '#f43f5e' },
  ],
  colors = [],
}: CategoriesFiltersProps) {
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [color, setColor] = useState(searchParams.get('color') || 'all');

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (type === 'all') params.delete('type');
    else params.set('type', type);
    if (color === 'all') params.delete('color');
    else params.set('color', color);
    applyFilters(params);
  };

  const handleClear = () => {
    setType('all');
    setColor('all');
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Tipo">
        <Select value={type} onValueChange={(value) => setType(value || 'all')}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <div className="flex items-center gap-2">
                  {t.color && (
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                  )}
                  {t.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Cor">
        <Select value={color} onValueChange={(value) => setColor(value || 'all')}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todas as cores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cores</SelectItem>
            {colors.map((c) => (
              <SelectItem key={c} value={c}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                  {c}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </FilterPanel>
  );
}
