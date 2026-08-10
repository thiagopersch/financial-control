'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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
  footer?: React.ReactNode;
  /** When provided, the pagination bar is portaled into this element instead of rendered below the table. */
  paginationSlot?: HTMLElement | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = 'Nenhum resultado encontrado.',
  initialSorting = [],
  getRowClassName,
  pageSize = 15,
  manualPagination,
  footer,
  paginationSlot,
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
  const pageCount = manualPagination
    ? Math.max(1, Math.ceil(manualPagination.totalCount / manualPagination.pageSize))
    : table.getPageCount();
  const canPreviousPage = manualPagination ? currentPage > 1 : table.getCanPreviousPage();
  const canNextPage = manualPagination ? currentPage < pageCount : table.getCanNextPage();

  const goToPage = (page: number) => {
    if (manualPagination) {
      manualPagination.onPageChange(page);
    } else {
      table.setPageIndex(page - 1);
    }
  };

  const pageSizeSelect = (
    <Select
      value={String(manualPagination?.pageSize ?? pageSize)}
      onValueChange={(v) => manualPagination?.onPageSizeChange(Number(v))}
      disabled={!manualPagination}
    >
      <SelectTrigger className="h-9 w-fit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAGE_SIZE_OPTIONS.map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size} Itens por página
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const pageInfoBar = (
    <div className="flex flex-col-reverse items-center justify-between gap-3 px-2 sm:flex-row">
      <div className="text-muted-foreground text-sm">
        Página {currentPage} de {pageCount}
        {manualPagination && ` — ${manualPagination.totalCount} registros`}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={!canPreviousPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!canPreviousPage}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!canNextPage}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(pageCount)}
          disabled={!canNextPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="dark:bg-accent overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="dark:bg-accent bg-slate-50/50">
                  {headerGroup.headers.map((header) => {
                    const isActions = header.column.id === 'actions';
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          isActions && 'dark:bg-accent sticky right-0 z-10 bg-slate-50/50',
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'group transition-colors hover:bg-neutral-300/30 dark:hover:bg-neutral-300/30',
                      getRowClassName?.(row.original),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActions = cell.column.id === 'actions';
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            isActions &&
                              'dark:bg-accent sticky right-0 z-10 bg-white group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800',
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
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
            {footer && <TableFooter>{footer}</TableFooter>}
          </Table>
        </div>
      </div>

      {paginationSlot ? createPortal(pageSizeSelect, paginationSlot) : pageSizeSelect}
      {pageInfoBar}
    </div>
  );
}
