'use client';

import { CategoriesList } from './components/categories-list';

interface CategoriesClientProps {
  categories: Awaited<ReturnType<typeof import('@/lib/queries/categories').getCategories>>;
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  return <CategoriesList categories={categories} onRefresh={() => {}} />;
}
