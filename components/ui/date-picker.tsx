'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PickerTriggerProps {
  hasValue: boolean;
  label: ReactNode;
  placeholder: string;
  onClear?: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Gatilho compartilhado dos date pickers: botão que abre o popover + botão "limpar"
 * irmão (fora do <button>, para não aninhar elementos interativos).
 */
export function PickerTrigger({
  hasValue,
  label,
  placeholder,
  onClear,
  className,
  children,
}: PickerTriggerProps) {
  const showClear = hasValue && !!onClear;
  return (
    <div className={cn('relative w-full', className)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 w-full justify-start text-left font-normal',
            showClear && 'pr-9',
            !hasValue && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{hasValue ? label : placeholder}</span>
        </Button>
      </PopoverTrigger>
      {showClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Limpar data"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          onClick={onClear}
        >
          <X />
        </Button>
      )}
      {children}
    </div>
  );
}

interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  /** Exibe o botão de limpar quando há data selecionada (padrão: true). */
  clearable?: boolean;
}

export function DatePicker({
  date,
  setDate,
  placeholder = 'Selecione uma data',
  className,
  clearable = true,
}: DatePickerProps) {
  return (
    <Popover>
      <PickerTrigger
        hasValue={!!date}
        label={date ? format(date, 'PPP', { locale: ptBR }) : null}
        placeholder={placeholder}
        onClear={clearable ? () => setDate(undefined) : undefined}
        className={className}
      >
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} autoFocus locale={ptBR} />
        </PopoverContent>
      </PickerTrigger>
    </Popover>
  );
}
