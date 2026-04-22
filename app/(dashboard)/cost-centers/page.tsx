import { getCostCenters } from '@/lib/queries/cost-centers';
import { CostCentersClient } from './cost-centers-client';

export default async function CostCentersPage() {
  const costCenters = await getCostCenters();

  return (
    <div className="py-6">
      <CostCentersClient costCenters={costCenters} />
    </div>
  );
}
