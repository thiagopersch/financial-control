'use client';

import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

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
  return <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

/**
 * Select de múltipla escolha com busca e chips. Seleção vazia representa
 * "todos" — é o padrão dos filtros das listagens.
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
  const anchor = useComboboxAnchor();

  const selected = React.useMemo(() => {
    const byValue = new Map(options.map((option) => [option.value, option]));
    return value
      .map((item) => byValue.get(item))
      .filter((option): option is MultiSelectOption => !!option);
  }, [options, value]);

  return (
    <Combobox
      multiple
      autoHighlight
      items={options}
      value={selected}
      onValueChange={(next) => onValueChange((next as MultiSelectOption[]).map((o) => o.value))}
      isItemEqualToValue={(item, val) => item.value === val.value}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchor}
        className={cn('dark:bg-input/30 min-h-10 w-full pr-1 shadow-xs', className)}
      >
        <ComboboxValue>
          {(values: MultiSelectOption[]) => (
            <>
              {values.slice(0, maxVisibleChips).map((option) => (
                <ComboboxChip key={option.value} className="max-w-[9rem]">
                  <ColorDot color={option.color} />
                  <span className="truncate">{option.label}</span>
                </ComboboxChip>
              ))}
              {values.length > maxVisibleChips && (
                <span
                  className="bg-primary/10 text-primary rounded-sm px-1.5 text-xs font-medium tabular-nums"
                  title={values
                    .slice(maxVisibleChips)
                    .map((option) => option.label)
                    .join(', ')}
                >
                  +{values.length - maxVisibleChips}
                </span>
              )}
              <ComboboxChipsInput
                id={id}
                placeholder={values.length === 0 ? placeholder : undefined}
                aria-label={placeholder}
                className="placeholder:text-muted-foreground min-w-12 bg-transparent"
              />
            </>
          )}
        </ComboboxValue>
        <ComboboxTrigger
          aria-label="Abrir opções"
          className="text-muted-foreground hover:bg-accent ml-auto flex size-7 shrink-0 items-center justify-center rounded-md"
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(option: MultiSelectOption) => (
            <ComboboxItem key={option.value} value={option}>
              <ColorDot color={option.color} />
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
