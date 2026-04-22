import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FiltersStore {
  period: {
    from: string | undefined; // Use string for persistence
    to: string | undefined;
  };
  accountId: string | undefined;
  categoryId: string | undefined;
  type: string | undefined;
  minAmount: number | undefined;
  maxAmount: number | undefined;
  search: string;
  setPeriod: (from: string | undefined, to: string | undefined) => void;
  setAccountId: (id: string | undefined) => void;
  setCategoryId: (id: string | undefined) => void;
  setType: (type: string | undefined) => void;
  setMinAmount: (amount: number | undefined) => void;
  setMaxAmount: (amount: number | undefined) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

export const useFilters = create<FiltersStore>()(
  persist(
    (set) => ({
      period: { from: undefined, to: undefined },
      accountId: undefined,
      categoryId: undefined,
      type: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      search: '',
      setPeriod: (from, to) => set({ period: { from, to } }),
      setAccountId: (id) => set({ accountId: id }),
      setCategoryId: (id) => set({ categoryId: id }),
      setType: (type) => set({ type }),
      setMinAmount: (amount) => set({ minAmount: amount }),
      setMaxAmount: (amount) => set({ maxAmount: amount }),
      setSearch: (search) => set({ search }),
      resetFilters: () =>
        set({
          period: { from: undefined, to: undefined },
          accountId: undefined,
          categoryId: undefined,
          type: undefined,
          minAmount: undefined,
          maxAmount: undefined,
          search: '',
        }),
    }),
    {
      name: 'financial-filters',
    },
  ),
);
