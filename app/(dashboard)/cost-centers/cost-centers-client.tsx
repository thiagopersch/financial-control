'use client';

import { useRouter } from 'next/navigation';
import { CostCentersList } from './components/cost-centers-list';

interface CostCentersClientProps {
  costCenters: Awaited<
    ReturnType<typeof import('@/lib/queries/cost-centers').getCostCentersPaginated>
  >['costCenters'];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function CostCentersClient({
  costCenters,
  totalCount,
  page,
  pageSize,
}: CostCentersClientProps) {
  const router = useRouter();

  return (
    <CostCentersList
      costCenters={costCenters}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onRefresh={() => router.refresh()}
    />
  );
}
