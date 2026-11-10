import * as z from 'zod';

/** Teto absoluto de itens por página em qualquer rota de lista da API. */
export const MAX_API_PAGE_SIZE = 100;

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  /** Busca textual opcional (`?q=`), já normalizada. */
  q?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Lê `page`, `pageSize` e `q` da query string com Zod. Valores inválidos caem
 * nos padrões e `pageSize` nunca passa de `maxPageSize` — nenhuma rota de
 * lista devolve resultados sem limite.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  { defaultPageSize = 50, maxPageSize = MAX_API_PAGE_SIZE } = {},
): PaginationParams {
  const schema = z.object({
    page: z.coerce.number().int().min(1).catch(1),
    pageSize: z.coerce.number().int().min(1).catch(defaultPageSize),
    q: z.string().trim().max(100).optional().catch(undefined),
  });

  const parsed = schema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? searchParams.get('limit') ?? undefined,
    q: searchParams.get('q') ?? undefined,
  });

  const pageSize = Math.min(parsed.pageSize, maxPageSize);
  return {
    page: parsed.page,
    pageSize,
    skip: (parsed.page - 1) * pageSize,
    take: pageSize,
    q: parsed.q || undefined,
  };
}

export function paginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
