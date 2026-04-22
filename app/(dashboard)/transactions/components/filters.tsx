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
import { X } from 'lucide-react';

type FiltersProps = {
  searchParams: URLSearchParams;
  handleFilterChange: (key: string, value: string) => void;
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
  handleFilterChange,
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
    { value: 'PAID', label: 'Pago', color: '#10b981' },
    { value: 'PENDING', label: 'Pendente', color: '#f59e0b' },
    { value: 'OVERDUE', label: 'Atrasado', color: '#f43f5e' },
  ],
}: FiltersProps) {
  return (
    <div className="dark:bg-accent dark:text-accent-foreground text-foreground grid grid-cols-1 items-end gap-4 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-4 lg:grid-cols-7">
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
              handleFilterChange('from', format(date, 'yyyy-MM-dd'));
            } else {
              handleFilterChange('from', 'all');
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
              handleFilterChange('to', format(date, 'yyyy-MM-dd'));
            } else {
              handleFilterChange('to', 'all');
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground ml-1 text-xs font-semibold uppercase">Tipo</span>
        <Select
          onValueChange={(v) => handleFilterChange('type', v)}
          defaultValue={searchParams.get('type') || 'all'}
        >
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
        <Select
          onValueChange={(v) => handleFilterChange('status', v)}
          defaultValue={searchParams.get('status') || 'all'}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: s.color,
                    }}
                  />
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
        <Select
          onValueChange={(v) => handleFilterChange('category', v)}
          defaultValue={searchParams.get('category') || 'all'}
        >
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
        <Select
          onValueChange={(v) => handleFilterChange('account', v)}
          defaultValue={searchParams.get('account') || 'all'}
        >
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

      {searchParams.toString() && (
        <div className="flex flex-col items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            type="button"
            onClick={handleClearFilters}
            className="w-full border-2 border-dashed font-medium text-red-500 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed dark:hover:border-red-500 dark:hover:bg-red-500/10"
            disabled={!searchParams.toString()}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
