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

type SuppliersFiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  personTypes?: { value: string; label: string; color?: string }[];
  statuses?: { value: string; label: string; color?: string }[];
};

export function SuppliersFilters({
  searchParams,
  applyFilters,
  handleClearFilters,
  personTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'INDIVIDUAL', label: 'Pessoa Física', color: '#3b82f6' },
    { value: 'COMPANY', label: 'Pessoa Jurídica', color: '#8b5cf6' },
  ],
  statuses = [
    { value: 'all', label: 'Todos' },
    { value: 'true', label: 'Ativo', color: '#10b981' },
    { value: 'false', label: 'Inativo', color: '#64748b' },
  ],
}: SuppliersFiltersProps) {
  const [personType, setPersonType] = useState(searchParams.get('personType') || 'all');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || 'all');

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value: string) => {
      if (value === 'all') params.delete(key);
      else params.set(key, value);
    };
    setOrDelete('personType', personType);
    setOrDelete('isActive', isActive);
    applyFilters(params);
  };

  const handleClear = () => {
    setPersonType('all');
    setIsActive('all');
    handleClearFilters();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <FilterField label="Tipo de pessoa">
        <Select value={personType} onValueChange={(value) => setPersonType(value || 'all')}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {personTypes.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                <div className="flex items-center gap-2">
                  {p.color && (
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  )}
                  {p.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Status">
        <Select value={isActive} onValueChange={(value) => setIsActive(value || 'all')}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div className="flex items-center gap-2">
                  {s.color && (
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  )}
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
    </FilterPanel>
  );
}
