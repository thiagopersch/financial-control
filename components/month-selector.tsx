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
  availableRange?: {
    minDate: Date | string | null;
    maxDate: Date | string | null;
  };
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

export function MonthSelector({ availableRange }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const minDate = availableRange?.minDate
    ? new Date(availableRange.minDate)
    : new Date(currentYear - 5, 0, 1);
  const maxDate = availableRange?.maxDate ? new Date(availableRange.maxDate) : new Date();

  const years = useMemo(() => {
    const result: number[] = [];
    for (let year = minDate.getFullYear(); year <= maxDate.getFullYear(); year++) {
      result.push(year);
    }
    return result;
  }, [minDate, maxDate]);

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

  const onYearChange = (value: string) => {
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

  const onMonthChange = (value: string) => {
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

  const getYearDisplay = () => {
    if (selectedYear === null || selectedYear === '') return 'Selecione o ano...';
    if (selectedYear === 'all') return 'Todos os Períodos';
    if (selectedYear === 'year') return `Ano Completo ${currentYear}`;
    return selectedYear;
  };

  const getMonthDisplay = () => {
    if (!selectedMonth || selectedMonth === '') return 'Selecione o mês...';
    if (selectedMonth === 'all') return 'Todos os meses';
    const month = MONTHS.find((m) => m.value === selectedMonth);
    return month?.label || 'Selecione o mês...';
  };

  return (
    <div className="flex items-center gap-2 max-md:w-full">
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
              {year}
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
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
