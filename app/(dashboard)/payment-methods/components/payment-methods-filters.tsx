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

type PaymentMethodsFiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  types?: { value: string; label: string; color: string }[];
};

export function PaymentMethodsFilters({
  searchParams,
  applyFilters,
  handleClearFilters,
  types = [
    { value: 'all', label: 'Todos', color: '' },
    { value: 'true', label: 'Cartão de crédito', color: '#6366f1' },
    { value: 'false', label: 'Outro', color: '#94a3b8' },
  ],
}: PaymentMethodsFiltersProps) {
  const [isCreditCard, setIsCreditCard] = useState(searchParams.get('isCreditCard') || 'all');

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (isCreditCard === 'all') params.delete('isCreditCard');
    else params.set('isCreditCard', isCreditCard);
    applyFilters(params);
  };

  const handleClear = () => {
    setIsCreditCard('all');
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Tipo">
        <Select value={isCreditCard} onValueChange={(value) => setIsCreditCard(value || 'all')}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
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
    </FilterPanel>
  );
}
