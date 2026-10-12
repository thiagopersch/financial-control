/**
 * Filtros de listagem ficam fora da URL: o localStorage (store Zustand) é a fonte de verdade
 * e um cookie por página espelha o valor para que os Server Components consigam filtrar.
 * A URL guarda apenas o período global e a paginação.
 */

/** Período global (MonthSelector) — permanece na URL. */
export const PERIOD_PARAMS = ['year', 'month'];
/** Paginação — permanece na URL. */
export const PAGINATION_PARAMS = ['page', 'pageSize'];
export const NON_FILTER_PARAMS = [...PERIOD_PARAMS, ...PAGINATION_PARAMS];

const PAGE_FILTERS_COOKIE_PREFIX = 'pf_';
const PAGE_FILTERS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getPageFiltersCookieName(pathname: string) {
  return `${PAGE_FILTERS_COOKIE_PREFIX}${pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '_')}`;
}

/** Mantém só as chaves de filtro (remove período/paginação). */
export function pickFilterParams(params: URLSearchParams) {
  const filters = new URLSearchParams(params);
  for (const key of NON_FILTER_PARAMS) filters.delete(key);
  return filters;
}

/** Client: grava (ou remove, quando vazio) o cookie de filtros da página. */
export function writePageFiltersCookie(pathname: string, query: string) {
  const name = getPageFiltersCookieName(pathname);
  document.cookie = query
    ? `${name}=${encodeURIComponent(query)}; path=/; max-age=${PAGE_FILTERS_COOKIE_MAX_AGE}; samesite=lax`
    : `${name}=; path=/; max-age=0; samesite=lax`;
}

/** Client: lê o cookie de filtros da página (querystring, ou `''`). */
export function readPageFiltersCookie(pathname: string) {
  const name = `${getPageFiltersCookieName(pathname)}=`;
  const entry = document.cookie.split('; ').find((item) => item.startsWith(name));
  return entry ? decodeURIComponent(entry.slice(name.length)) : '';
}
