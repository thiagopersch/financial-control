'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VARIABLE_CATALOG } from '@/lib/notification-templates/variable-catalog';
import { Variable } from 'lucide-react';

interface VariablePickerProps {
  onInsert: (key: string) => void;
  label?: string;
  disabled?: boolean;
  /** Renders just the icon in a compact button (e.g. inside a table cell), dropping the label. */
  iconOnly?: boolean;
}

export function VariablePicker({
  onInsert,
  label = 'Adicionar variável',
  disabled,
  iconOnly,
}: VariablePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            disabled={disabled}
            title={label}
          >
            <Variable className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={disabled}>
            <Variable className="h-3.5 w-3.5" />
            {label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {VARIABLE_CATALOG.map((page) => (
          <DropdownMenuSub key={page.id}>
            <DropdownMenuSubTrigger>{page.label}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {page.fields.map((field) => (
                <DropdownMenuItem key={field.key} onSelect={() => onInsert(field.key)}>
                  {field.label}
                  <span className="text-muted-foreground ml-auto text-xs">{`{{${field.key}}}`}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
