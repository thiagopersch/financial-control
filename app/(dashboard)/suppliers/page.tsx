import { getSuppliersPaginated } from '@/lib/queries/suppliers';
import { SuppliersClient } from './suppliers-client';

const ALLOWED_PAGE_SIZES = [10, 20, 50, 100];

export default async function SuppliersPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    personType?: string;
    isActive?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;

  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(searchParams.pageSize))
    ? Number(searchParams.pageSize)
    : 10;
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const { suppliers, totalCount } = await getSuppliersPaginated({
    q: searchParams.q,
    personType: searchParams.personType,
    isActive: searchParams.isActive,
    page,
    pageSize,
  });

  return (
    <div className="py-6">
      <SuppliersClient
        suppliers={suppliers}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
