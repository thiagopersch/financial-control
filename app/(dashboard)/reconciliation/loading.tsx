import {
  PageHeaderSkeleton,
  StatsCardsSkeleton,
  TableSkeleton,
} from '@/components/ui/page-skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsCardsSkeleton count={3} />
      <TableSkeleton rows={8} columns={5} withHeader={false} withFilters={false} />
    </div>
  );
}
