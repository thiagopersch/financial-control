import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      {withAction && <Skeleton className="h-10 w-36" />}
    </div>
  );
}

function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2',
        count === 4 && 'lg:grid-cols-4',
        count === 3 && 'lg:grid-cols-3',
        count === 5 && 'lg:grid-cols-5',
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartCardSkeleton({
  className,
  height = 'h-64',
}: {
  className?: string;
  height?: string;
}) {
  return (
    <Card className={cn('border-none shadow-md', className)}>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn('w-full rounded-md', height)} />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({
  rows = 8,
  columns = 5,
  withFilters = true,
  withHeader = true,
}: {
  rows?: number;
  columns?: number;
  withFilters?: boolean;
  withHeader?: boolean;
}) {
  return (
    <div className="space-y-6">
      {withHeader && <PageHeaderSkeleton />}

      {withFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
      )}

      <div className="dark:bg-accent overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="dark:bg-accent flex gap-4 border-b bg-slate-50/50 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b px-4 py-4 last:border-b-0">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-3 px-2 sm:flex-row">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FormSkeleton({
  fields = 6,
  withHeader = true,
}: {
  fields?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="space-y-6">
      {withHeader && <PageHeaderSkeleton withAction={false} />}

      <Card className="border-none shadow-md">
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: fields }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardsGridSkeleton({
  count = 6,
  withHeader = true,
}: {
  count?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="space-y-6">
      {withHeader && <PageHeaderSkeleton />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChartDashboardSkeleton({ withTabs = true }: { withTabs?: boolean }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      {withTabs && (
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
      )}
      <StatsCardsSkeleton count={3} />
      <ChartCardSkeleton height="h-80" />
    </div>
  );
}

function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsCardsSkeleton count={4} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartCardSkeleton className="md:col-span-2 lg:col-span-4" />
        <ChartCardSkeleton className="lg:col-span-3" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ChartCardSkeleton height="h-48" />
        <ChartCardSkeleton height="h-48" />
        <ChartCardSkeleton height="h-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCardSkeleton height="h-48" />
        <ChartCardSkeleton height="h-48" />
      </div>
      <TableSkeleton rows={5} columns={4} withHeader={false} withFilters={false} />
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md md:col-span-2">
          <CardContent className="space-y-4 pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export {
  CardsGridSkeleton,
  ChartCardSkeleton,
  ChartDashboardSkeleton,
  DashboardPageSkeleton,
  DetailPageSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  StatsCardsSkeleton,
  TableSkeleton,
};
