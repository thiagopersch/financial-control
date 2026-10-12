'use client';

import type { Row } from '@tanstack/react-table';
import { CheckCircle2, Edit, MoreHorizontal, Trash2, type LucideIcon } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
}

interface ActionsDataTableProps<T> {
  row: Row<T>;
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
  disabledDelete?: boolean;
  /** Highlighted (green) action rendered at the top of the menu. */
  onMarkAsPaid?: (row: T) => void;
  disabledMarkAsPaid?: boolean;
  /** Module-specific items rendered between edit and delete. */
  extraActions?: ActionItem[];
}

export function ActionsDataTable<T extends { id: string }>({
  row,
  onEdit,
  onDelete,
  disabledDelete,
  onMarkAsPaid,
  disabledMarkAsPaid,
  extraActions = [],
}: ActionsDataTableProps<T>) {
  const hasMiddleItems = !!onEdit || extraActions.length > 0;

  return (
    <div className="flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            className="h-8 w-8 hover:bg-neutral-300 dark:hover:bg-neutral-700"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-auto min-w-44"
          onClick={(e) => e.stopPropagation()}
        >
          {onMarkAsPaid && (
            <>
              <DropdownMenuItem
                onClick={() => onMarkAsPaid(row.original)}
                disabled={disabledMarkAsPaid}
                className="font-semibold text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700 dark:text-emerald-400 dark:focus:text-emerald-300 [&_svg]:text-emerald-600! dark:[&_svg]:text-emerald-400!"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marcar como pago
              </DropdownMenuItem>
              {(hasMiddleItems || onDelete) && <DropdownMenuSeparator />}
            </>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          {extraActions.map(({ label, icon: Icon, onSelect, disabled }) => (
            <DropdownMenuItem key={label} onClick={onSelect} disabled={disabled}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </DropdownMenuItem>
          ))}
          {onDelete && (
            <>
              {hasMiddleItems && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => onDelete(row.original.id)}
                disabled={disabledDelete}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive!"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
