'use client';

import { usePeriodTransition } from '@/components/period-transition';
import { Button } from '@/components/ui/button';
import { MONTH_LABELS, MonthGrid, type YearMonth } from '@/components/ui/month-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { usePersistedFiltersStore } from '@/hooks/use-filters-store';
import { cn } from '@/lib/utils';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MonthSelectorProps {
  /** Quantidade de transações por ano (`YYYY`). */
  transactionCounts?: Record<string, number>;
  /**
   * Restaura o período salvo quando a URL não tem `year`/`month`. Páginas que usam
   * `useUrlFilters({ includePeriod: true })` desligam isso para fazer uma única
   * restauração (período + filtros), evitando dois `router.replace` concorrentes.
   */
  restoreOnMount?: boolean;
  className?: string;
}

type Period =
  { kind: 'all' } | { kind: 'year'; year: number } | { kind: 'month'; year: number; month: number };

const pad = (value: number) => String(value).padStart(2, '0');

function readPeriod(yearParam: string | null, monthParam: string | null, now: Date): Period {
  if (yearParam === 'all') return { kind: 'all' };
  const year = Number(yearParam);
  if (!yearParam || Number.isNaN(year)) {
    return { kind: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  if (monthParam === 'all') return { kind: 'year', year };
  const month = Number(monthParam);
  if (month >= 1 && month <= 12) return { kind: 'month', year, month };
  // Ano sem mês: o servidor usa o mês atual como fallback.
  return { kind: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
}

function periodLabel(period: Period) {
  if (period.kind === 'all') return 'Todos os períodos';
  if (period.kind === 'year') return `Ano inteiro ${period.year}`;
  return `${MONTH_LABELS[period.month - 1]} ${period.year}`;
}

export function MonthSelector({
  transactionCounts,
  restoreOnMount = true,
  className,
}: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const store = usePersistedFiltersStore();
  const { isPending, startPeriodTransition } = usePeriodTransition();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const period = readPeriod(yearParam, monthParam, now);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(period.kind === 'all' ? currentYear : period.year);

  useEffect(() => {
    if (!restoreOnMount || yearParam || monthParam) return;

    const params = new URLSearchParams(searchParams);
    if (store.period) {
      for (const [key, value] of new URLSearchParams(store.period)) {
        params.set(key, value);
      }
    } else {
      params.set('year', currentYear.toString());
      params.set('month', pad(currentMonth));
    }
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreOnMount, yearParam, monthParam, currentYear, currentMonth, pathname, router]);

  const applyPeriod = (next: Period) => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');

    if (next.kind === 'all') {
      params.set('year', 'all');
      params.delete('month');
    } else if (next.kind === 'year') {
      params.set('year', String(next.year));
      params.set('month', 'all');
    } else {
      params.set('year', String(next.year));
      params.set('month', pad(next.month));
    }

    const persisted = new URLSearchParams();
    for (const key of ['year', 'month']) {
      const value = params.get(key);
      if (value) persisted.set(key, value);
    }
    store.setPeriod(persisted.toString());

    setOpen(false);
    // Transition: a tela atual fica visível enquanto o servidor busca o novo período,
    // e `isPending` aciona os overlays de loading dos componentes da página.
    startPeriodTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const step = (direction: -1 | 1) => {
    if (period.kind === 'all') return;
    if (period.kind === 'year') {
      applyPeriod({ kind: 'year', year: period.year + direction });
      return;
    }
    const date = new Date(period.year, period.month - 1 + direction, 1);
    applyPeriod({ kind: 'month', year: date.getFullYear(), month: date.getMonth() + 1 });
  };

  const handleOpenChange = (next: boolean) => {
    if (next) setViewYear(period.kind === 'all' ? currentYear : period.year);
    setOpen(next);
  };

  const selectedMonth: YearMonth | null =
    period.kind === 'month' ? { year: period.year, month: period.month } : null;
  const viewYearCount = transactionCounts?.[String(viewYear)];

  return (
    <div className={cn('flex items-center gap-1 max-md:w-full', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={period.kind === 'year' ? 'Ano anterior' : 'Mês anterior'}
        disabled={period.kind === 'all'}
        onClick={() => step(-1)}
      >
        <ChevronLeft />
      </Button>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 min-w-0 flex-1 justify-between gap-2 font-medium md:w-52 md:flex-none"
            aria-label={`Período: ${periodLabel(period)}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              {isPending ? (
                <Spinner className="text-primary" aria-label="Buscando informações..." />
              ) : (
                <CalendarDays className="text-muted-foreground" />
              )}
              <span className="truncate">{periodLabel(period)}</span>
            </span>
            <ChevronDown className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(20rem,calc(100vw-2rem))]" align="center">
          <MonthGrid
            year={viewYear}
            onYearChange={setViewYear}
            selected={selectedMonth}
            onSelect={({ year, month }) => applyPeriod({ kind: 'month', year, month })}
          />
          <div className="grid grid-cols-2 gap-1.5 border-t pt-2.5">
            <Button
              type="button"
              variant={period.kind === 'year' && period.year === viewYear ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPeriod({ kind: 'year', year: viewYear })}
            >
              Ano {viewYear}
              {viewYearCount ? ` (${viewYearCount})` : ''}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPeriod({ kind: 'month', year: currentYear, month: currentMonth })}
            >
              Mês atual
            </Button>
            <Button
              type="button"
              variant={period.kind === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="col-span-2"
              onClick={() => applyPeriod({ kind: 'all' })}
            >
              Todos os períodos
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={period.kind === 'year' ? 'Próximo ano' : 'Próximo mês'}
        disabled={period.kind === 'all'}
        onClick={() => step(1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
