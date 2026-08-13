'use client';

import { Input } from '@/components/ui/input';
import * as React from 'react';

interface CurrencyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> {
  value: number | null | undefined;
  onChange: (value: number) => void;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  ...props
}: CurrencyInputProps) {
  const displayValue = value
    ? Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '';

  return (
    <Input
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        const numeric = digits ? parseInt(digits, 10) / 100 : 0;
        onChange(numeric);
      }}
      {...props}
    />
  );
}
