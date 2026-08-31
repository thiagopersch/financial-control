'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { usePersistedFiltersStore } from './use-filters-store';

const DEFAULT_IGNORED_PARAMS = ['page', 'pageSize', 'q'];
/** Geridas separadamente pelo MonthSelector (período global) — nunca persistidas por página. */
const PERIOD_PARAMS = ['year', 'month'];

export function useUrlFilters(ignoredParams: string[] = DEFAULT_IGNORED_PARAMS) {
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const store = usePersistedFiltersStore();
  const hydrated = useRef(false);

  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => !ignoredParams.includes(key),
  );

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (hasActiveFilters) return;

    const saved = store.filtersByPage[pathname];
    if (!saved) return;

    const params = new URLSearchParams(searchParams);
    for (const [key, value] of new URLSearchParams(saved)) {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (params: URLSearchParams) => {
    params.delete('page');

    const toPersist = new URLSearchParams(params);
    for (const key of [...DEFAULT_IGNORED_PARAMS, ...PERIOD_PARAMS]) {
      toPersist.delete(key);
    }
    if (Array.from(toPersist.keys()).length > 0) {
      store.setPageFilters(pathname, toPersist.toString());
    } else {
      store.clearPageFilters(pathname);
    }

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete('q');
    } else {
      params.set('q', value);
    }
    applyFilters(params);
  };

  const handleClearFilters = () => {
    store.clearPageFilters(pathname);
    router.push(window.location.pathname);
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
