'use client';

import { inputSx } from '@/components/ui/input';
import { VIRTUALIZE_OPTIONS_THRESHOLD, VirtualListbox } from '@/components/ui/virtual-listbox';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Cor opcional exibida como bolinha (categorias, contas, status...). */
  color?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Texto exibido quando nada está selecionado (= sem filtro). */
  placeholder?: string;
  emptyText?: string;
  /** Quantos chips mostrar antes de resumir como "+N". */
  maxVisibleChips?: number;
  className?: string;
  disabled?: boolean;
  id?: string;
}

function ColorDot({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <Box
      component="span"
      sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', bgcolor: color }}
    />
  );
}

/**
 * Select de múltipla escolha com busca e chips (MUI `Autocomplete multiple`).
 * Seleção vazia representa "todos" — é o padrão dos filtros das listagens.
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Todos',
  emptyText = 'Nenhum resultado encontrado.',
  maxVisibleChips = 2,
  className,
  disabled,
  id,
}: MultiSelectProps) {
  const selected = React.useMemo(() => {
    const byValue = new Map(options.map((option) => [option.value, option]));
    return value
      .map((item) => byValue.get(item))
      .filter((option): option is MultiSelectOption => !!option);
  }, [options, value]);
  const virtualize = options.length > VIRTUALIZE_OPTIONS_THRESHOLD;

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      autoHighlight
      className={className}
      options={options}
      value={selected}
      onChange={(_e, next) => onValueChange(next.map((o) => o.value))}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      disabled={disabled}
      noOptionsText={emptyText}
      size="small"
      popupIcon={<ChevronDownIcon size={16} />}
      slotProps={{
        listbox: virtualize ? { component: VirtualListbox } : undefined,
        paper: { sx: { boxShadow: 3 } },
      }}
      renderOption={({ key, ...props }, option, { selected: isSelected }) => (
        <Box component="li" key={key} {...props} sx={{ gap: 1, fontSize: '0.875rem' }}>
          <Checkbox size="small" checked={isSelected} sx={{ p: 0.25 }} />
          <ColorDot color={option.color} />
          {option.label}
        </Box>
      )}
      renderValue={(values, getItemProps) => (
        <>
          {values.slice(0, maxVisibleChips).map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <Chip
                key={key}
                {...itemProps}
                size="small"
                icon={option.color ? <ColorDot color={option.color} /> : undefined}
                label={option.label}
                sx={{ maxWidth: '9rem', height: 22, '& .MuiChip-icon': { ml: 1 } }}
              />
            );
          })}
          {values.length > maxVisibleChips && (
            <Tooltip
              title={values
                .slice(maxVisibleChips)
                .map((o) => o.label)
                .join(', ')}
            >
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  borderRadius: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'primary.main',
                  bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{values.length - maxVisibleChips}
              </Box>
            </Tooltip>
          )}
        </>
      )}
      renderInput={(params) => (
        <InputBase
          ref={params.slotProps.input.ref}
          onMouseDown={params.slotProps.input.onMouseDown}
          inputProps={{
            ...params.slotProps.htmlInput,
            id: id ?? params.id,
            'aria-label': placeholder,
          }}
          placeholder={selected.length === 0 ? placeholder : undefined}
          disabled={params.disabled}
          fullWidth
          startAdornment={params.slotProps.input.startAdornment}
          endAdornment={params.slotProps.input.endAdornment}
          className={params.slotProps.input.className}
          sx={{
            ...inputSx,
            minHeight: 40,
            flexWrap: 'wrap',
            gap: 0.5,
            py: 0.5,
            pr: '56px !important',
            '& input': { minWidth: 48, flex: 1 },
          }}
        />
      )}
    />
  );
}
