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

function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseDigits(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = '0,00',
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    value ? formatBRL(Number(value)) : '',
  );
  const [prevValue, setPrevValue] = React.useState(value);
  const [isFocused, setIsFocused] = React.useState(false);
  const lastEmittedRef = React.useRef<number | null>(value ?? null);

  if (prevValue !== value) {
    setPrevValue(value);
    if (!isFocused) {
      setDisplayValue(value ? formatBRL(Number(value)) : '');
      lastEmittedRef.current = value ?? 0;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const numeric = parseDigits(raw);
    setDisplayValue(numeric > 0 ? formatBRL(numeric) : '');
    if (numeric !== lastEmittedRef.current) {
      lastEmittedRef.current = numeric;
      onChange(numeric);
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
    onFocus?.(e);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false);
    const current = lastEmittedRef.current ?? 0;
    setDisplayValue(current > 0 ? formatBRL(current) : '');
    onChange(current);
    onBlur?.(e);
  }

  return (
    <Input
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}
