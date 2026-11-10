'use client';

import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import * as React from 'react';

/**
 * Campo de data (MUI X `DatePicker`, locale pt-BR via LocalizationProvider no
 * layout). Digitável (dd/mm/aaaa) ou pelo calendário; botão de limpar opcional.
 */
interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  /** Exibe o botão de limpar quando há data selecionada (padrão: true). */
  clearable?: boolean;
  label?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  date,
  setDate,
  placeholder = 'Selecione uma data',
  className,
  clearable = true,
  label,
  disabled,
  minDate,
  maxDate,
}: DatePickerProps) {
  return (
    <MuiDatePicker
      className={className}
      label={label}
      value={date ?? null}
      onChange={(value) => {
        if (value === null) setDate(undefined);
        else if (value instanceof Date && !Number.isNaN(value.getTime())) setDate(value);
      }}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      format="dd/MM/yyyy"
      slotProps={{
        textField: { size: 'small', fullWidth: true, inputProps: { placeholder } } as never,
        field: { clearable },
        popper: { sx: { '& .MuiPaper-root': { boxShadow: 3 } } },
      }}
    />
  );
}
