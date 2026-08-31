'use client';

import { useEffect, useRef } from 'react';
import { usePersistedFiltersStore } from './use-filters-store';

const isEmptyValue = (value: string | undefined) => !value || value === 'all';

/**
 * Persiste (localStorage, via Zustand) um conjunto de filtros locais (useState) de uma página,
 * restaurando-os ao montar e limpando a persistência assim que todos os campos voltarem ao
 * valor "vazio"/"all" — ou seja, quando a página já chama seu próprio `handleClearFilters`.
 *
 * Para páginas que já usam a URL como fonte de verdade (via `useUrlFilters`/`MonthSelector`),
 * use esses hooks diretamente em vez deste — eles já têm a mesma persistência embutida.
 */
export function usePersistedPageFilters<T extends Record<string, string>>(
  pageKey: string,
  filters: T,
  restore: (saved: Partial<T>) => void,
) {
  const store = usePersistedFiltersStore();
  const hydrated = useRef(false);
  const skipNextSave = useRef(false);
  // Só o closure do primeiro render é usado (hidratação roda uma única vez), então não
  // precisa ser mantido atualizado a cada render — evita mutar o ref durante o render.
  const restoreRef = useRef(restore);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const saved = store.filtersByPage[pageKey];
    if (!saved) return;

    const parsed = Object.fromEntries(new URLSearchParams(saved)) as Partial<T>;
    skipNextSave.current = true;
    restoreRef.current(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const isEmpty = Object.values(filters).every((value) => isEmptyValue(value));
    if (isEmpty) {
      store.clearPageFilters(pageKey);
    } else {
      store.setPageFilters(pageKey, new URLSearchParams(filters).toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, JSON.stringify(filters)]);
}
