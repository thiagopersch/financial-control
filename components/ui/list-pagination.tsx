'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface ListPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** When provided, the page-size select is portaled into this element instead of rendered inline. */
  paginationSlot?: HTMLElement | null;
}

export function ListPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  paginationSlot,
}: ListPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPreviousPage = page > 1;
  const canNextPage = page < pageCount;

  const pageSizeSelect = (
    <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
      <SelectTrigger className="h-9 w-full md:w-fit">
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

  return (
    <div className="flex flex-col gap-4">
      {paginationSlot ? createPortal(pageSizeSelect, paginationSlot) : pageSizeSelect}

      <div className="flex flex-col-reverse items-center justify-between gap-3 px-2 sm:flex-row">
        <div className="text-muted-foreground text-sm">
          Página {page} de {pageCount} — {totalCount} registros
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canPreviousPage}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPreviousPage}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNextPage}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageCount)}
            disabled={!canNextPage}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
