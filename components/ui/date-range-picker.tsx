'use client';

import { DatePicker } from '@/components/ui/date-picker';
import Box from '@mui/material/Box';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Intervalo de datas (de → até) com dois campos MUI X `DatePicker`; o "até"
 * não aceita data anterior ao "de". Limpar os dois remove o filtro.
 */
export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const update = (next: DateRange) => onChange(next.from || next.to ? next : undefined);
  return (
    <Box className={className} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      <DatePicker
        label="De"
        date={value?.from}
        maxDate={value?.to}
        setDate={(from) => update({ from, to: value?.to })}
        placeholder="dd/mm/aaaa"
      />
      <DatePicker
        label="Até"
        date={value?.to}
        minDate={value?.from}
        setDate={(to) => update({ from: value?.from, to })}
        placeholder="dd/mm/aaaa"
      />
    </Box>
  );
}
