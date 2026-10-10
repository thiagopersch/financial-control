'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { parseYearMonthString } from '@/lib/utils/competence';

export const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_SHORT_LABELS = MONTH_LABELS.map((label) => label.slice(0, 3));

export type YearMonth = { year: number; month: number };

interface MonthGridProps {
  /** Ano exibido na grade (controlado). */
  year: number;
  onYearChange: (year: number) => void;
  /** Mês selecionado (1-12) — destacado quando o ano exibido for o mesmo. */
  selected?: YearMonth | null;
  onSelect: (value: YearMonth) => void;
  className?: string;
}

/**
 * Grade 4×3 de meses com navegação de ano — o mês pode ser escolhido com um
 * toque, sem precisar escolher o ano antes.
 */
export function MonthGrid({ year, onYearChange, selected, onSelect, className }: MonthGridProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ano anterior"
          onClick={() => onYearChange(year - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm font-semibold tabular-nums">{year}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Próximo ano"
          onClick={() => onYearChange(year + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {MONTH_SHORT_LABELS.map((label, index) => {
          const month = index + 1;
          const isSelected = selected?.year === year && selected.month === month;
          const isCurrent = currentYear === year && currentMonth === month;

          return (
            <button
              key={label}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${MONTH_LABELS[index]} de ${year}`}
              onClick={() => onSelect({ year, month })}
              className={cn(
                'focus-visible:ring-ring/50 relative flex h-10 items-center justify-center rounded-md border text-sm transition-colors outline-none focus-visible:ring-3',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : 'hover:bg-accent hover:text-accent-foreground border-transparent',
                !isSelected && isCurrent && 'border-primary/40 font-medium',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MonthPickerProps {
  /** Valor no formato `YYYY-MM`. */
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/** Campo de formulário para escolher apenas mês/ano; exibe `MM/AAAA`. */
export function MonthPicker({
  value,
  onChange,
  placeholder = 'Selecione mês/ano',
  className,
  disabled,
  ...rest
}: MonthPickerProps) {
  const selected = value ? parseYearMonthString(value) : null;
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(selected?.year ?? new Date().getFullYear());

  const handleOpenChange = (next: boolean) => {
    if (next) setViewYear(selected?.year ?? new Date().getFullYear());
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
          {...rest}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {selected ? (
            <span className="tabular-nums">
              {String(selected.month).padStart(2, '0')}/{selected.year}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <MonthGrid
          year={viewYear}
          onYearChange={setViewYear}
          selected={selected}
          onSelect={({ year, month }) => {
            onChange(`${year}-${String(month).padStart(2, '0')}`);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
