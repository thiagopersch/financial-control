'use client';

import { MonthSelector } from '@/components/month-selector';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { format, parse } from 'date-fns';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

type FiltersProps = {
  searchParams: URLSearchParams;
  applyFilters: (params: URLSearchParams) => void;
  handleClearFilters: () => void;
  availableRange?: {
    minDate: Date | string | null;
    maxDate: Date | string | null;
  };
  transactionCounts?: Record<string, number>;
  categories: { id: string; name: string; type: string; color: string }[];
  accounts: any[];
  types?: { value: string; label: string; color: string }[];
  statuses?: { value: string; label: string; color: string }[];
};

export function Filters({
  searchParams,
  applyFilters,
  handleClearFilters,
  availableRange,
  transactionCounts,
  categories,
  accounts,
  types = [
    { value: 'all', label: 'Todos os tipos', color: '' },
    { value: 'INCOME', label: 'Receitas', color: '#10b981' },
    { value: 'EXPENSE', label: 'Despesas', color: '#f43f5e' },
  ],
  statuses = [
    { value: 'all', label: 'Todos os status', color: '' },
    { value: 'PAID', label: 'Pago', color: '#10b981' },
    { value: 'PENDING', label: 'Pendente', color: '#f59e0b' },
    { value: 'OVERDUE', label: 'Atrasado', color: '#f43f5e' },
  ],
}: FiltersProps) {
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [account, setAccount] = useState(searchParams.get('account') || 'all');

  const onSelectChange = (setter: (value: string) => void) => (value: string | null) => {
    setter(value || 'all');
  };

  const handlePeriodChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
      if (key === 'from' || key === 'to') {
        params.delete('month');
      }
    }
    applyFilters(params);
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value: string) => {
      if (value === 'all') params.delete(key);
      else params.set(key, value);
    };
    setOrDelete('type', type);
    setOrDelete('status', status);
    setOrDelete('category', category);
    setOrDelete('account', account);
    applyFilters(params);
  };

  const handleClear = () => {
    setType('all');
    setStatus('all');
    setCategory('all');
    setAccount('all');
    handleClearFilters();
  };

  return (
    <div className="dark:bg-accent dark:text-accent-foreground text-foreground flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">
            Mês de Referência
          </span>
          <MonthSelector
            availableRange={availableRange}
            transactionCounts={transactionCounts}
            useNextYears
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Início</span>
          <DatePicker
            date={
              searchParams.get('from')
                ? parse(searchParams.get('from')!, 'yyyy-MM-dd', new Date())
                : undefined
            }
            setDate={(date) => {
              if (date) {
                handlePeriodChange('from', format(date, 'yyyy-MM-dd'));
              } else {
                handlePeriodChange('from', 'all');
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Fim</span>
          <DatePicker
            date={
              searchParams.get('to')
                ? parse(searchParams.get('to')!, 'yyyy-MM-dd', new Date())
                : undefined
            }
            setDate={(date) => {
              if (date) {
                handlePeriodChange('to', format(date, 'yyyy-MM-dd'));
              } else {
                handlePeriodChange('to', 'all');
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Tipo</span>
          <Select value={type} onValueChange={onSelectChange(setType)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    {t.color && (
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            t.color === 'emerald'
                              ? '#10b981'
                              : t.color === 'rose'
                                ? '#f43f5e'
                                : t.color,
                        }}
                      />
                    )}
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Status</span>
          <Select value={status} onValueChange={onSelectChange(setStatus)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todos os status" />
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
        </div>

        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">
            Categoria
          </span>
          <Select value={category} onValueChange={onSelectChange(setCategory)}>
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
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Conta</span>
          <Select value={account} onValueChange={onSelectChange(setAccount)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                    {a.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          type="button"
          onClick={handleClear}
          className="w-full border-2 border-dashed font-medium text-red-500 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-500 sm:w-auto dark:hover:border-red-500 dark:hover:bg-red-500/10"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
        <Button type="button" onClick={handleApply} className="w-full sm:w-auto">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
      </div>
    </div>
  );
}
