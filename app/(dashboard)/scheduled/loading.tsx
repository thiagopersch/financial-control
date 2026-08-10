import { TableSkeleton } from '@/components/ui/page-skeletons';

export default function Loading() {
  return <TableSkeleton rows={6} columns={5} withFilters={false} />;
}
