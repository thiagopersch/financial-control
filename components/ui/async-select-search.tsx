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

export interface AsyncSelectSearchOption {
  value: string;
  label: string;
}

interface AsyncSelectSearchProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** Called on mount (with '') and, debounced, on every keystroke. */
  fetchOptions: (query: string) => Promise<AsyncSelectSearchOption[]>;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  /** Debounce delay before re-fetching while typing. */
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function AsyncSelectSearch({
  value,
  onValueChange,
  fetchOptions,
  placeholder = 'Selecione...',
  emptyText = 'Nenhum resultado encontrado.',
  loadingText = 'Buscando...',
  debounceMs = 300,
  className,
  disabled,
}: AsyncSelectSearchProps) {
  const [options, setOptions] = React.useState<AsyncSelectSearchOption[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);

  const requestIdRef = React.useRef(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFetch = React.useCallback(
    async (query: string) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const results = await fetchOptions(query);
        if (requestIdRef.current === requestId) setOptions(results);
      } finally {
        if (requestIdRef.current === requestId) setIsLoading(false);
      }
    },
    [fetchOptions],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch to seed the picker's default options
    runFetch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputValueChange = (next: string) => {
    setInputValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runFetch(next), debounceMs);
  };

  const selectedItem = React.useMemo<AsyncSelectSearchOption | null>(() => {
    if (!value) return null;
    return options.find((o) => o.value === value) ?? { value, label: selectedLabel ?? value };
  }, [options, value, selectedLabel]);

  return (
    <Combobox
      items={options}
      value={selectedItem}
      inputValue={inputValue}
      onInputValueChange={handleInputValueChange}
      onValueChange={(v) => {
        const item = v as AsyncSelectSearchOption | null;
        onValueChange(item?.value ?? null);
        setSelectedLabel(item?.label ?? null);
      }}
      isItemEqualToValue={(item, val) => item.value === val.value}
      filter={null}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        showClear={!!value}
        className={cn('w-full', className)}
      />
      <ComboboxContent>
        <ComboboxEmpty>{isLoading ? loadingText : emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(option: AsyncSelectSearchOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
