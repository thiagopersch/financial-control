import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersistedFiltersState {
  /** pathname -> querystring de filtros de conteúdo (sem `page`/`year`/`month`) */
  filtersByPage: Record<string, string>;
  /** querystring global de período (`year`/`month`), compartilhada entre páginas com MonthSelector */
  period: string;
  setPageFilters: (pageKey: string, params: string) => void;
  clearPageFilters: (pageKey: string) => void;
  setPeriod: (params: string) => void;
}

export const usePersistedFiltersStore = create<PersistedFiltersState>()(
  persist(
    (set) => ({
      filtersByPage: {},
      period: '',
      setPageFilters: (pageKey, params) =>
        set((state) => ({
          filtersByPage: { ...state.filtersByPage, [pageKey]: params },
        })),
      clearPageFilters: (pageKey) =>
        set((state) => {
          if (!(pageKey in state.filtersByPage)) return state;
          const next = { ...state.filtersByPage };
          delete next[pageKey];
          return { filtersByPage: next };
        }),
      setPeriod: (params) => set({ period: params }),
    }),
    {
      name: 'financial-filters',
    },
  ),
);
