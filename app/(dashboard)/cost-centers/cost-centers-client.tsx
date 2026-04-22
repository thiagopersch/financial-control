'use client';

import { CostCentersList } from './components/cost-centers-list';

interface CostCentersClientProps {
  costCenters: Awaited<ReturnType<typeof import('@/lib/queries/cost-centers').getCostCenters>>;
}

export function CostCentersClient({ costCenters }: CostCentersClientProps) {
  return <CostCentersList costCenters={costCenters} onRefresh={() => {}} />;
}
