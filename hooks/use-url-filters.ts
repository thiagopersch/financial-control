'use client';

import { usePeriodTransition } from '@/components/period-transition';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { usePersistedFiltersStore } from './use-filters-store';

const DEFAULT_IGNORED_PARAMS = ['page', 'pageSize', 'q'];
/** Geridas separadamente pelo MonthSelector (período global) — nunca persistidas por página. */
const PERIOD_PARAMS = ['year', 'month'];

interface UseUrlFiltersOptions {
  /** Params que não contam como "filtro ativo". */
  ignoredParams?: string[];
  /** Persiste também a busca (`q`) junto com os filtros da página. */
  persistSearch?: boolean;
  /**
   * Restaura também o período global (`year`/`month`) no mesmo `router.replace` dos
   * filtros. Use junto com `<MonthSelector restoreOnMount={false} />` — dois replaces
   * concorrentes no mount fazem um sobrescrever o outro.
   */
  includePeriod?: boolean;
}

export function useUrlFilters({
  ignoredParams = DEFAULT_IGNORED_PARAMS,
  persistSearch = false,
  includePeriod = false,
}: UseUrlFiltersOptions = {}) {
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const store = usePersistedFiltersStore();
  const { startPeriodTransition } = usePeriodTransition();
  const hydrated = useRef(false);

  const notPersisted = [
    ...DEFAULT_IGNORED_PARAMS.filter((key) => !(persistSearch && key === 'q')),
    ...PERIOD_PARAMS,
  ];

  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => !ignoredParams.includes(key) && !(includePeriod && PERIOD_PARAMS.includes(key)),
  );

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const params = new URLSearchParams(searchParams);
    let changed = false;

    if (includePeriod && !params.has('year') && !params.has('month')) {
      const now = new Date();
      const period = store.period
        ? new URLSearchParams(store.period)
        : new URLSearchParams({
            year: String(now.getFullYear()),
            month: String(now.getMonth() + 1).padStart(2, '0'),
          });
      for (const [key, value] of period) params.set(key, value);
      changed = true;
    }

    const hasPageFilters = Array.from(searchParams.keys()).some(
      (key) => !notPersisted.includes(key),
    );
    const saved = store.filtersByPage[pathname];
    if (!hasPageFilters && saved) {
      for (const [key, value] of new URLSearchParams(saved)) params.set(key, value);
      changed = true;
    }

    if (changed) router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * `replace` evita uma entrada no histórico por navegação (ex.: busca enquanto digita).
   * Roda numa transition: a tela atual fica visível (com overlay) até a nova chegar.
   */
  const applyFilters = (params: URLSearchParams, { replace = false } = {}) => {
    params.delete('page');

    const toPersist = new URLSearchParams(params);
    for (const key of notPersisted) {
      toPersist.delete(key);
    }
    if (Array.from(toPersist.keys()).length > 0) {
      store.setPageFilters(pathname, toPersist.toString());
    } else {
      store.clearPageFilters(pathname);
    }

    const url = `${window.location.pathname}?${params.toString()}`;
    startPeriodTransition(() => (replace ? router.replace(url) : router.push(url)));
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    applyFilters(params, { replace: true });
  };

  /** Limpa filtros e busca da página; com `includePeriod`, mantém o período selecionado. */
  const handleClearFilters = () => {
    store.clearPageFilters(pathname);
    const params = new URLSearchParams();
    if (includePeriod) {
      for (const key of PERIOD_PARAMS) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }
    }
    const query = params.toString();
    router.push(query ? `${window.location.pathname}?${query}` : window.location.pathname);
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
