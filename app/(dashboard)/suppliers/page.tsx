import { getPageFilters } from '@/lib/queries/page-filters';
import { getSuppliersPaginated } from '@/lib/queries/suppliers';
import { SuppliersClient } from './suppliers-client';
import { parsePageSize } from '@/lib/constants/pagination';

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
  // Filtros/busca vêm do cookie (espelho do localStorage); a URL traz só período e paginação.
  const searchParams: Awaited<typeof searchParamsPromise> = {
    ...(await getPageFilters('/suppliers')),
    ...(await searchParamsPromise),
  };

  const pageSize = parsePageSize(searchParams.pageSize);
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
