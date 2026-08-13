import { getCategoriesPaginated, getDistinctCategoryColors } from '@/lib/queries/categories';
import { CategoriesClient } from './categories-client';

const ALLOWED_PAGE_SIZES = [10, 20, 50, 100];

export default async function CategoriesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    color?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;

  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(searchParams.pageSize))
    ? Number(searchParams.pageSize)
    : 10;
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const [{ categories, totalCount }, colors] = await Promise.all([
    getCategoriesPaginated({
      q: searchParams.q,
      type: searchParams.type,
      color: searchParams.color,
      page,
      pageSize,
    }),
    getDistinctCategoryColors(),
  ]);

  return (
    <div className="py-6">
      <CategoriesClient
        categories={categories}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        colors={colors}
      />
    </div>
  );
}
