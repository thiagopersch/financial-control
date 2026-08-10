import {
  ChartCardSkeleton,
  PageHeaderSkeleton,
  TableSkeleton,
} from '@/components/ui/page-skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ChartCardSkeleton height="h-72" />
      <TableSkeleton rows={6} columns={5} withHeader={false} withFilters={false} />
    </div>
  );
}
