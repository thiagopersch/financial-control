'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { SxProps, Theme } from '@mui/material/styles';
import { Inbox } from 'lucide-react';
import { useRef, useState } from 'react';

import { ListPagination } from '@/components/ui/list-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';
import { cn } from '@/lib/utils';

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
  /** Estilo da linha vindo do tema (cor por situação) em vez de classe Tailwind. */
  getRowSx?: (row: TData) => SxProps<Theme>;
  pageSize?: number;
  manualPagination?: ManualPaginationProps;
  /** Rendered below the table, inside the card, constrained to its visible width (does not scroll horizontally). */
  footer?: React.ReactNode;
  /** When provided, the pagination bar is portaled into this element instead of rendered below the table. */
  paginationSlot?: HTMLElement | null;
  onRowClick?: (row: TData) => void;
}

const ACTIONS_COLUMN_ID = 'actions';
/** A partir daqui as linhas da página são virtualizadas (só as visíveis vão para o DOM). */
const VIRTUALIZE_ROWS_THRESHOLD = 50;
const ESTIMATED_ROW_HEIGHT = 49;

const stickyActionsSx = {
  position: 'sticky',
  right: 0,
  zIndex: 1,
  width: '1px',
  bgcolor: 'background.paper',
  boxShadow: 'inset 1px 0 0 0 var(--mui-palette-divider)',
} as const;

/** Tabela de listagem (TanStack Table + MUI Table) com estado vazio e paginação. */
export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = 'Nenhum resultado encontrado.',
  initialSorting = [],
  getRowClassName,
  getRowSx,
  pageSize = DEFAULT_PAGE_SIZE,
  manualPagination,
  footer,
  paginationSlot,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    state: { sorting },
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const virtualize = rows.length > VIRTUALIZE_ROWS_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 10,
  });
  const virtualRows = virtualize ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualRows.length ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length
    ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0;
  const visibleRows: Row<TData>[] = virtualize ? virtualRows.map((v) => rows[v.index]) : rows;

  const currentPage = manualPagination
    ? manualPagination.page
    : table.getState().pagination.pageIndex + 1;
  const currentPageSize = manualPagination
    ? manualPagination.pageSize
    : table.getState().pagination.pageSize;
  const totalCount = manualPagination ? manualPagination.totalCount : data.length;

  const goToPage = (page: number) => {
    if (manualPagination) manualPagination.onPageChange(page);
    else table.setPageIndex(page - 1);
  };

  const changePageSize = (size: number) => {
    if (manualPagination) manualPagination.onPageSizeChange(size);
    else table.setPageSize(size);
  };

  const colSpan = table.getVisibleLeafColumns().length || columns.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 1.5 }}>
        <Box ref={scrollRef} sx={virtualize ? { maxHeight: '70vh', overflowY: 'auto' } : undefined}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={virtualize ? { position: 'sticky', top: 0, zIndex: 2 } : undefined}
                    >
                      <Box
                        component="span"
                        sx={
                          header.column.id === ACTIONS_COLUMN_ID
                            ? { display: 'block', ...stickyActionsSx, bgcolor: 'action.hover' }
                            : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </Box>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length ? (
                <>
                  {paddingTop > 0 && (
                    <tr aria-hidden>
                      <td colSpan={colSpan} style={{ height: paddingTop, padding: 0, border: 0 }} />
                    </tr>
                  )}
                  {visibleRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn(
                        'group/row',
                        onRowClick && 'cursor-pointer',
                        getRowClassName?.(row.original),
                      )}
                      sx={getRowSx?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) =>
                        cell.column.id === ACTIONS_COLUMN_ID ? (
                          <Box
                            component="td"
                            key={cell.id}
                            sx={{
                              ...stickyActionsSx,
                              px: 1,
                              borderBottom: 1,
                              borderColor: 'divider',
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Box>
                        ) : (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  ))}
                  {paddingBottom > 0 && (
                    <tr aria-hidden>
                      <td
                        colSpan={colSpan}
                        style={{ height: paddingBottom, padding: 0, border: 0 }}
                      />
                    </tr>
                  )}
                </>
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan} className="h-32 text-center">
                    {/* Estado vazio */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.secondary',
                        py: 2,
                      }}
                    >
                      <Inbox size={28} strokeWidth={1.5} />
                      {emptyMessage}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        {footer && (
          <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover', p: 1.5 }}>
            {footer}
          </Box>
        )}
      </Paper>

      <ListPagination
        page={currentPage}
        pageSize={currentPageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
        paginationSlot={paginationSlot}
      />
    </Box>
  );
}
