'use client';

import { inputSx } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import InputBase from '@mui/material/InputBase';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

export interface AsyncSelectSearchOption {
  value: string;
  label: string;
}

interface AsyncSelectSearchProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** Chamado ao montar (com '') e, com debounce, a cada busca digitada. */
  fetchOptions: (query: string) => Promise<AsyncSelectSearchOption[]>;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  /** Atraso do debounce antes de consultar de novo enquanto digita. */
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Autocomplete com busca no servidor (MUI `Autocomplete`): a consulta só é
 * disparada `debounceMs` depois da última tecla, e respostas antigas que
 * chegam fora de ordem são descartadas.
 */
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
  const [inputValue, setInputValue] = React.useState('');
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);
  // Resultado da última busca concluída; enquanto a consulta atual não volta, está carregando.
  const [result, setResult] = React.useState<{
    query: string;
    options: AsyncSelectSearchOption[];
  } | null>(null);
  const query = useDebouncedValue(inputValue, debounceMs);
  const fetchRef = React.useRef(fetchOptions);
  React.useEffect(() => {
    fetchRef.current = fetchOptions;
  });

  React.useEffect(() => {
    let cancelled = false;
    fetchRef
      .current(query)
      .then((options) => {
        if (!cancelled) setResult({ query, options });
      })
      .catch(() => {
        if (!cancelled) setResult({ query, options: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const options = result?.options ?? [];
  const isLoading = result?.query !== query;

  const selectedItem = React.useMemo<AsyncSelectSearchOption | null>(() => {
    if (!value) return null;
    return options.find((o) => o.value === value) ?? { value, label: selectedLabel ?? value };
  }, [options, value, selectedLabel]);

  return (
    <Autocomplete
      className={className}
      options={options}
      value={selectedItem}
      inputValue={inputValue}
      onInputChange={(_e, next, reason) => {
        // Ao selecionar, o MUI preenche o texto com o rótulo: não refaz a busca.
        if (reason !== 'reset') setInputValue(next);
        else setInputValue('');
      }}
      onChange={(_e, item) => {
        onValueChange(item?.value ?? null);
        setSelectedLabel(item?.label ?? null);
      }}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      // Filtro feito pelo servidor.
      filterOptions={(x) => x}
      loading={isLoading}
      loadingText={loadingText}
      noOptionsText={emptyText}
      disabled={disabled}
      size="small"
      popupIcon={<ChevronDownIcon size={16} />}
      renderInput={(params) => (
        <InputBase
          ref={params.slotProps.input.ref}
          onMouseDown={params.slotProps.input.onMouseDown}
          inputProps={params.slotProps.htmlInput}
          placeholder={placeholder}
          disabled={params.disabled}
          fullWidth
          endAdornment={
            <>
              {isLoading ? <CircularProgress color="inherit" size={14} sx={{ mr: 1 }} /> : null}
              {params.slotProps.input.endAdornment}
            </>
          }
          className={params.slotProps.input.className}
          sx={{ ...inputSx, pr: '56px !important' }}
        />
      )}
    />
  );
}
