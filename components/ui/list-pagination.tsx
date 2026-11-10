'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants/pagination';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { createPortal } from 'react-dom';

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
        <Typography variant="body2" color="text.secondary">
          Página {page} de {pageCount} — {totalCount} registros
        </Typography>
        <Pagination
          count={pageCount}
          page={Math.min(page, pageCount)}
          onChange={(_e, next) => onPageChange(next)}
          shape="rounded"
          size="small"
          showFirstButton
          showLastButton
          siblingCount={1}
          aria-label="Paginação"
        />
      </div>
    </div>
  );
}
