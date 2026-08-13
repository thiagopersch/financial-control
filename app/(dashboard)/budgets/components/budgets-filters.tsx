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
  const [category, setCategory] = useState(searchParams.get('category') || 'all');

  const onSelectChange = (value: string | null) => {
    setCategory(value || 'all');
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (category === 'all') params.delete('category');
    else params.set('category', category);
    applyFilters(params);
  };

  const handleClear = () => {
    setCategory('all');
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Categoria">
        <Select value={category} onValueChange={onSelectChange}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </FilterPanel>
  );
}
