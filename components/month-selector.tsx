'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

interface MonthSelectorProps {
  transactionCounts?: Record<string, number>;
  monthCounts?: Record<string, number>;
  useNextYears?: boolean;
}

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function MonthSelector({
  transactionCounts,
  monthCounts,
  useNextYears = false,
}: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const years = useMemo(() => {
    if (useNextYears) {
      const result: number[] = [];
      for (let year = currentYear; year < currentYear + 10; year++) {
        result.push(year);
      }
      return result;
    }

    const yearsWithData = Object.keys(transactionCounts || {})
      .map(Number)
      .filter((year) => !Number.isNaN(year))
      .sort((a, b) => a - b);

    return yearsWithData.length > 0 ? yearsWithData : [currentYear];
  }, [transactionCounts, useNextYears, currentYear]);

  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const selectedYear = yearParam || currentYear.toString();
  const selectedMonth = !yearParam ? currentMonth.toString().padStart(2, '0') : monthParam || '';

  useEffect(() => {
    if (!yearParam && !monthParam) {
      const params = new URLSearchParams();
      params.set('year', currentYear.toString());
      params.set('month', currentMonth.toString().padStart(2, '0'));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [yearParam, monthParam, currentYear, currentMonth, pathname, router]);

  const isMonthDisabled = !selectedYear || selectedYear === 'all' || selectedYear === 'year';

  const onYearChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    params.delete('month');
    params.delete('from');
    params.delete('to');

    if (value === 'all') {
      // Todos os Períodos - usar year=all para manter na URL
      params.set('year', 'all');
      router.push(`${pathname}?${params.toString()}`);
    } else if (value === 'year') {
      // Ano Completo
      params.set('year', currentYear.toString());
      params.set('month', 'all');
      router.push(`${pathname}?${params.toString()}`);
    } else {
      // Ano específico selecionado
      params.set('year', value);
      // Não limpar month ao trocar ano - manter referência
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const onMonthChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    params.delete('from');
    params.delete('to');

    if (value === 'all') {
      // Todos os meses do ano selecionado
      params.set('month', 'all');
    } else {
      // Mês específico
      params.set('month', value);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 max-md:w-full max-md:flex-col">
      <span className="text-muted-foreground hidden text-sm font-medium sm:inline-block">
        Período:
      </span>

      {/* Primeiro Select - Ano */}
      <Select value={selectedYear || ''} onValueChange={onYearChange}>
        <SelectTrigger className="w-full cursor-pointer border shadow-sm">
          <SelectValue placeholder="Selecione o ano..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Períodos</SelectItem>
          <SelectItem value="year">Ano Completo {currentYear}</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {transactionCounts?.[year.toString()]
                ? `${year} • ${transactionCounts[year.toString()]} transações`
                : year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Segundo Select - Mês */}
      <Select value={selectedMonth || ''} onValueChange={onMonthChange} disabled={isMonthDisabled}>
        <SelectTrigger className="w-full cursor-pointer border shadow-sm disabled:opacity-50">
          <SelectValue placeholder="Selecione o mês..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os meses</SelectItem>
          {MONTHS.map((month) => {
            const count = monthCounts?.[`${selectedYear}-${month.value}`];
            return (
              <SelectItem key={month.value} value={month.value}>
                {count ? `${month.label} • ${count} transações` : month.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
