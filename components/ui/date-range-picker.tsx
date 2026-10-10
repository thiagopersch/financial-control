'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

import { Calendar } from '@/components/ui/calendar';
import { PickerTrigger } from '@/components/ui/date-picker';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

export type { DateRange };

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const formatDay = (date: Date) => format(date, 'dd/MM/yyyy', { locale: ptBR });

function formatRange(range?: DateRange) {
  if (!range?.from) return null;
  if (!range.to) return `A partir de ${formatDay(range.from)}`;
  return `${formatDay(range.from)} – ${formatDay(range.to)}`;
}

/** Seleção de intervalo de datas (de → até) em um único campo, com botão de limpar. */
export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecione o período',
  className,
}: DateRangePickerProps) {
  const isMobile = useIsMobile();

  return (
    <Popover>
      <PickerTrigger
        hasValue={!!value?.from}
        label={formatRange(value)}
        placeholder={placeholder}
        onClear={() => onChange(undefined)}
        className={className}
      >
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            defaultMonth={value?.from}
            numberOfMonths={isMobile ? 1 : 2}
            autoFocus
            locale={ptBR}
          />
        </PopoverContent>
      </PickerTrigger>
    </Popover>
  );
}
