import { TableSkeleton } from '@/components/ui/page-skeletons';

export default function Loading() {
  return <TableSkeleton rows={8} columns={4} />;
}
