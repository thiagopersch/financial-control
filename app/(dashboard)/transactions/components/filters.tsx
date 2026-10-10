'use client';

import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { PAID_BY_NONE, parseMultiParam, setMultiParam } from '@/lib/utils/filter-params';

import { format, isValid, parse } from 'date-fns';
import { useState } from 'react';

const TYPE_OPTIONS: MultiSelectOption[] = [
  { value: 'EXPENSE', label: 'Despesas', color: '#f43f5e' },
  { value: 'INCOME', label: 'Receitas', color: '#10b981' },
  { value: 'TRANSFER', label: 'Transferências', color: '#94a3b8' },
];

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'PENDING', label: 'Pendente', color: '#f59e0b' },
  { value: 'OVERDUE', label: 'Atrasado', color: '#f43f5e' },
  { value: 'PAID', label: 'Pago', color: '#10b981' },
];

type FiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  categories: { id: string; name: string; type: string; color: string }[];
  accounts: { id: string; name: string; color?: string | null }[];
  users?: { id: string; name: string | null; email: string }[];
};

function parseDateParam(value: string | null) {
  if (!value) return undefined;
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) ? date : undefined;
}

export function Filters({
  searchParams,
  applyFilters,
  handleClearFilters,
  categories,
  accounts,
  users = [],
}: FiltersProps) {
  const [dueRange, setDueRange] = useState<DateRange | undefined>(() => {
    const from = parseDateParam(searchParams.get('from'));
    const to = parseDateParam(searchParams.get('to'));
    return from || to ? { from, to } : undefined;
  });
  const [types, setTypes] = useState(parseMultiParam(searchParams.get('type')));
  const [statuses, setStatuses] = useState(parseMultiParam(searchParams.get('status')));
  const [categoryIds, setCategoryIds] = useState(parseMultiParam(searchParams.get('category')));
  const [accountIds, setAccountIds] = useState(parseMultiParam(searchParams.get('account')));
  const [paidByIds, setPaidByIds] = useState(parseMultiParam(searchParams.get('paidBy')));

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name, color: c.color }));
  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: a.name,
    color: a.color ?? undefined,
  }));
  const paidByOptions: MultiSelectOption[] = [
    ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
    { value: PAID_BY_NONE, label: 'Não informado' },
  ];

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (dueRange?.from) params.set('from', format(dueRange.from, 'yyyy-MM-dd'));
    else params.delete('from');
    if (dueRange?.to) params.set('to', format(dueRange.to, 'yyyy-MM-dd'));
    else params.delete('to');
    setMultiParam(params, 'type', types);
    setMultiParam(params, 'status', statuses);
    setMultiParam(params, 'category', categoryIds);
    setMultiParam(params, 'account', accountIds);
    setMultiParam(params, 'paidBy', paidByIds);
    applyFilters(params);
  };

  const handleClear = () => {
    setDueRange(undefined);
    setTypes([]);
    setStatuses([]);
    setCategoryIds([]);
    setAccountIds([]);
    setPaidByIds([]);
    handleClearFilters();
  };

  return (
    <FilterPanel
      onApply={handleApply}
      onClear={handleClear}
      gridClassName="sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
    >
      <FilterField label="Vencimento">
        <DateRangePicker value={dueRange} onChange={setDueRange} placeholder="Qualquer data" />
      </FilterField>

      <FilterField label="Tipo">
        <MultiSelect
          options={TYPE_OPTIONS}
          value={types}
          onValueChange={setTypes}
          placeholder="Todos os tipos"
        />
      </FilterField>

      <FilterField label="Status">
        <MultiSelect
          options={STATUS_OPTIONS}
          value={statuses}
          onValueChange={setStatuses}
          placeholder="Todos os status"
        />
      </FilterField>

      <FilterField label="Categoria">
        <MultiSelect
          options={categoryOptions}
          value={categoryIds}
          onValueChange={setCategoryIds}
          placeholder="Todas as categorias"
        />
      </FilterField>

      <FilterField label="Conta">
        <MultiSelect
          options={accountOptions}
          value={accountIds}
          onValueChange={setAccountIds}
          placeholder="Todas as contas"
        />
      </FilterField>

      <FilterField label="Pago por">
        <MultiSelect
          options={paidByOptions}
          value={paidByIds}
          onValueChange={setPaidByIds}
          placeholder="Todos os usuários"
        />
      </FilterField>
    </FilterPanel>
  );
}
