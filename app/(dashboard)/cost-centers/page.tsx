import { getCostCentersPaginated } from '@/lib/queries/cost-centers';
import { CostCentersClient } from './cost-centers-client';
import { parsePageSize } from '@/lib/constants/pagination';

export default async function CostCentersPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    parent?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;

  const pageSize = parsePageSize(searchParams.pageSize);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const { costCenters, totalCount } = await getCostCentersPaginated({
    q: searchParams.q,
    parent: searchParams.parent,
    page,
    pageSize,
  });

  return (
    <div className="py-6">
      <CostCentersClient
        costCenters={costCenters}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
