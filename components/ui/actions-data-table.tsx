'use client';

import type { Row } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from './button';

interface ActionsDataTableProps<T> {
  row: Row<T>;
  onEdit: (row: T) => void;
  onDelete: (id: string) => void;
  disabledDelete?: boolean;
}

export function ActionsDataTable<T extends { id: string }>({
  row,
  onEdit,
  onDelete,
  disabledDelete,
}: ActionsDataTableProps<T>) {
  return (
    <div className="space-x-2 text-right whitespace-nowrap">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(row.original)}
        className="h-8 w-8 hover:bg-neutral-300 dark:hover:bg-neutral-700"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(row.original.id)}
        disabled={disabledDelete}
        className="hover:bg-destructive/10 text-destructive dark:hover:bg-destructive/20 h-8 w-8 disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
