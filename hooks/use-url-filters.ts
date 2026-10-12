'use client';

import { usePeriodTransition } from '@/components/period-transition';
import {
  PERIOD_PARAMS,
  pickFilterParams,
  readPageFiltersCookie,
  writePageFiltersCookie,
} from '@/lib/utils/page-filters';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { usePersistedFiltersStore } from './use-filters-store';

/** Params que não contam como "filtro ativo" (a busca tem indicador próprio). */
const DEFAULT_IGNORED_PARAMS = ['q'];

interface UseUrlFiltersOptions {
  /** Params que não contam como "filtro ativo". */
  ignoredParams?: string[];
  /**
   * Restaura também o período global (`year`/`month`) da URL no mount e o inclui no
   * `searchParams` retornado. Use junto com `<MonthSelector restoreOnMount={false} />` —
   * dois replaces concorrentes no mount fazem um sobrescrever o outro.
   */
  includePeriod?: boolean;
}

const subscribeNoop = () => () => {};

/**
 * Filtros e busca de uma listagem, fora da URL: ficam no localStorage (store Zustand) e são
 * espelhados num cookie (`pf_<página>`) que o Server Component lê via `getPageFilters`.
 * A URL guarda só o período (`year`/`month`) e a paginação (`page`/`pageSize`).
 */
export function useUrlFilters({
  ignoredParams = DEFAULT_IGNORED_PARAMS,
  includePeriod = false,
}: UseUrlFiltersOptions = {}) {
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const urlParams = useSearchParams();
  const pathname = usePathname();
  const store = usePersistedFiltersStore();
  const { startPeriodTransition } = usePeriodTransition();
  const initialized = useRef(false);
  // O servidor não enxerga o localStorage: até hidratar, expõe filtros vazios para o HTML do
  // client bater com o do servidor (os dados já chegam filtrados pelo cookie).
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const savedFilters = hydrated ? (store.filtersByPage[pathname] ?? '') : '';
  const yearParam = urlParams.get('year');
  const monthParam = urlParams.get('month');

  const searchParams = useMemo(() => {
    const params = new URLSearchParams(savedFilters);
    if (includePeriod) {
      if (yearParam) params.set('year', yearParam);
      if (monthParam) params.set('month', monthParam);
    }
    return params;
  }, [savedFilters, includePeriod, yearParam, monthParam]);

  const hasActiveFilters = Array.from(new URLSearchParams(savedFilters).keys()).some(
    (key) => !ignoredParams.includes(key),
  );

  const persistFilters = (filters: URLSearchParams) => {
    const query = filters.toString();
    if (query) store.setPageFilters(pathname, query);
    else store.clearPageFilters(pathname);
    writePageFiltersCookie(pathname, query);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    let urlChanged = false;

    // Links/bookmarks antigos com filtros na URL: migra para o storage e limpa a URL.
    const legacyFilters = pickFilterParams(params);
    let saved = store.filtersByPage[pathname] ?? '';
    if (legacyFilters.toString()) {
      saved = legacyFilters.toString();
      store.setPageFilters(pathname, saved);
      for (const key of Array.from(legacyFilters.keys())) params.delete(key);
      urlChanged = true;
    }

    if (includePeriod && !params.has('year') && !params.has('month')) {
      const now = new Date();
      const period = store.period
        ? new URLSearchParams(store.period)
        : new URLSearchParams({
            year: String(now.getFullYear()),
            month: String(now.getMonth() + 1).padStart(2, '0'),
          });
      for (const key of PERIOD_PARAMS) {
        const value = period.get(key);
        if (value) params.set(key, value);
      }
      urlChanged = true;
    }

    // Cookie ausente/desatualizado (expirou, foi limpo): o servidor renderizou sem os filtros.
    const cookieOutOfSync = readPageFiltersCookie(pathname) !== saved;
    if (cookieOutOfSync) writePageFiltersCookie(pathname, saved);

    if (urlChanged) {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    } else if (cookieOutOfSync) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Re-renderiza o Server Component com o cookie novo, voltando para a página 1. */
  const reload = () => {
    const params = new URLSearchParams(window.location.search);
    const hadPage = params.has('page');
    params.delete('page');
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    startPeriodTransition(() => (hadPage ? router.replace(url) : router.refresh()));
  };

  const applyFilters = (params: URLSearchParams) => {
    persistFilters(pickFilterParams(params));
    reload();
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(savedFilters);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    applyFilters(params);
  };

  /** Limpa filtros e busca da página; mantém o período selecionado. */
  const handleClearFilters = () => {
    persistFilters(new URLSearchParams());
    reload();
  };

  const toggleFilters = () => setShowFilters((prev) => !prev);

  return {
    searchParams,
    showFilters,
    toggleFilters,
    hasActiveFilters,
    applyFilters,
    handleSearch,
    handleClearFilters,
  };
}
