'use client';

import { useRouter } from 'next/navigation';
import { CategoriesList } from './components/categories-list';

interface CategoriesClientProps {
  categories: Awaited<
    ReturnType<typeof import('@/lib/queries/categories').getCategoriesPaginated>
  >['categories'];
  totalCount: number;
  page: number;
  pageSize: number;
  colors: string[];
}

export function CategoriesClient({
  categories,
  totalCount,
  page,
  pageSize,
  colors,
}: CategoriesClientProps) {
  const router = useRouter();

  return (
    <CategoriesList
      categories={categories}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      colors={colors}
      onRefresh={() => router.refresh()}
    />
  );
}
