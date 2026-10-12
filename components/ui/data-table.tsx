'use client';
// hmr-poll-test

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { ListPagination } from '@/components/ui/list-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';

interface ManualPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  initialSorting?: SortingState;
  getRowClassName?: (row: TData) => string;
  pageSize?: number;
  manualPagination?: ManualPaginationProps;
  /** Rendered below the table, inside the card, constrained to its visible width (does not scroll horizontally). */
  footer?: React.ReactNode;
  /** When provided, the pagination bar is portaled into this element instead of rendered below the table. */
  paginationSlot?: HTMLElement | null;
  onRowClick?: (row: TData) => void;
}

const ACTIONS_COLUMN_ID = 'actions';

// Keeps the actions column pinned to the right edge while the table scrolls horizontally.
const STICKY_ACTIONS_CLASS =
  'sticky right-0 z-10 w-px shadow-[inset_1px_0_0_0_var(--color-border)]';

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = 'Nenhum resultado encontrado.',
  initialSorting = [],
  getRowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
  manualPagination,
  footer,
  paginationSlot,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: !!manualPagination,
    pageCount: manualPagination
      ? Math.max(1, Math.ceil(manualPagination.totalCount / manualPagination.pageSize))
      : undefined,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const currentPage = manualPagination
    ? manualPagination.page
    : table.getState().pagination.pageIndex + 1;
  const currentPageSize = manualPagination
    ? manualPagination.pageSize
    : table.getState().pagination.pageSize;
  const totalCount = manualPagination ? manualPagination.totalCount : data.length;

  const goToPage = (page: number) => {
    if (manualPagination) {
      manualPagination.onPageChange(page);
    } else {
      table.setPageIndex(page - 1);
    }
  };

  const changePageSize = (size: number) => {
    if (manualPagination) {
      manualPagination.onPageSizeChange(size);
    } else {
      table.setPageSize(size);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="dark:bg-accent overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="dark:bg-accent dark:hover:bg-accent bg-slate-50/50 hover:bg-slate-50/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.id === ACTIONS_COLUMN_ID &&
                        cn(STICKY_ACTIONS_CLASS, 'dark:bg-accent bg-slate-50'),
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'group/row',
                    onRowClick && 'cursor-pointer',
                    getRowClassName?.(row.original),
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === ACTIONS_COLUMN_ID &&
                          cn(
                            STICKY_ACTIONS_CLASS,
                            'dark:bg-accent bg-white group-hover/row:bg-slate-50 dark:group-hover/row:bg-neutral-800',
                          ),
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {footer && <div className="dark:bg-accent border-t bg-slate-50/50 p-3">{footer}</div>}
      </div>

      <ListPagination
        page={currentPage}
        pageSize={currentPageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
        paginationSlot={paginationSlot}
      />
    </div>
  );
}
