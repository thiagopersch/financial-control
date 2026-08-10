'use client';

import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

export interface SelectSearchOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectSearchProps {
  options: SelectSearchOption[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function SelectSearch({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione...',
  emptyText = 'Nenhum resultado encontrado.',
  className,
  disabled,
  id,
  ...rest
}: SelectSearchProps) {
  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(v) => onValueChange((v as SelectSearchOption | null)?.value ?? null)}
      isItemEqualToValue={(item, val) => item.value === val.value}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        showClear={!!value}
        className={cn('w-full', className)}
        {...rest}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(option: SelectSearchOption) => (
            <ComboboxItem key={option.value} value={option.value}>
              {option.icon}
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
