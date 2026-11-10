import { describe, expect, it } from 'vitest';
import { MAX_API_PAGE_SIZE, paginationMeta, parsePagination } from '@/lib/utils/pagination';

const params = (q: string) => new URLSearchParams(q);

describe('parsePagination', () => {
  it('uses defaults when nothing is passed', () => {
    expect(parsePagination(params(''))).toEqual({
      page: 1,
      pageSize: 50,
      skip: 0,
      take: 50,
      q: undefined,
    });
  });

  it('computes skip/take from page and pageSize', () => {
    expect(parsePagination(params('page=3&pageSize=20'))).toMatchObject({ skip: 40, take: 20 });
  });

  it('never returns more than the max page size', () => {
    expect(parsePagination(params('pageSize=5000')).take).toBe(MAX_API_PAGE_SIZE);
    expect(parsePagination(params('limit=300')).take).toBe(MAX_API_PAGE_SIZE);
  });

  it('falls back on invalid values and trims the search term', () => {
    expect(parsePagination(params('page=-2&pageSize=abc&q=%20cafe%20'))).toMatchObject({
      page: 1,
      pageSize: 50,
      q: 'cafe',
    });
  });
});

describe('paginationMeta', () => {
  it('reports at least one page', () => {
    expect(paginationMeta(1, 50, 0).totalPages).toBe(1);
    expect(paginationMeta(2, 50, 101).totalPages).toBe(3);
  });
});
