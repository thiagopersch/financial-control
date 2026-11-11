'use client';

import { inputSx } from '@/components/ui/input';
import { VIRTUALIZE_OPTIONS_THRESHOLD, VirtualListbox } from '@/components/ui/virtual-listbox';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

export interface SelectSearchOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Agrupa as opções sob um cabeçalho (ex.: tipo de gatilho). */
  group?: string;
}

interface SelectSearchProps {
  options: SelectSearchOption[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  /** Permite limpar a seleção (padrão: true). */
  clearable?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Select com busca (MUI `Autocomplete`). O filtro é local (as opções já estão
 * carregadas); listas longas são virtualizadas.
 */
export function SelectSearch({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione...',
  emptyText = 'Nenhum resultado encontrado.',
  className,
  disabled,
  clearable = true,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: SelectSearchProps) {
  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );
  const grouped = options.some((o) => o.group);
  const virtualize = !grouped && options.length > VIRTUALIZE_OPTIONS_THRESHOLD;

  return (
    <Autocomplete
      className={className}
      options={options}
      value={selected}
      onChange={(_e, option) => onValueChange(option?.value ?? null)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      groupBy={grouped ? (option) => option.group ?? '' : undefined}
      disabled={disabled}
      disableClearable={!clearable as false}
      noOptionsText={emptyText}
      autoHighlight
      size="small"
      popupIcon={<ChevronDownIcon size={16} />}
      slotProps={{
        listbox: virtualize ? { component: VirtualListbox } : undefined,
        paper: { sx: { boxShadow: 3 } },
      }}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props} sx={{ gap: 1, fontSize: '0.875rem' }}>
          {option.icon}
          {option.label}
        </Box>
      )}
      renderInput={(params) => (
        <InputBase
          ref={params.slotProps.input.ref}
          onMouseDown={params.slotProps.input.onMouseDown}
          inputProps={{
            ...params.slotProps.htmlInput,
            id: id ?? params.id,
            'aria-invalid': ariaInvalid,
            'aria-describedby': ariaDescribedBy,
          }}
          placeholder={placeholder}
          disabled={params.disabled}
          fullWidth
          error={ariaInvalid === true}
          endAdornment={params.slotProps.input.endAdornment}
          startAdornment={
            selected?.icon ? (
              <Box sx={{ display: 'flex', mr: 0.5 }}>{selected.icon}</Box>
            ) : undefined
          }
          className={params.slotProps.input.className}
          sx={{ ...inputSx, pr: '56px !important' }}
        />
      )}
    />
  );
}
