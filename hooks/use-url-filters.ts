'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const DEFAULT_IGNORED_PARAMS = ['page', 'pageSize', 'q'];

export function useUrlFilters(ignoredParams: string[] = DEFAULT_IGNORED_PARAMS) {
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => !ignoredParams.includes(key),
  );

  const applyFilters = (params: URLSearchParams) => {
    params.delete('page');
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
