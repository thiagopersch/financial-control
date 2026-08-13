'use client';

import { useRouter } from 'next/navigation';
import { SuppliersList } from './components/suppliers-list';

interface SuppliersClientProps {
  suppliers: Awaited<
    ReturnType<typeof import('@/lib/queries/suppliers').getSuppliersPaginated>
  >['suppliers'];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function SuppliersClient({ suppliers, totalCount, page, pageSize }: SuppliersClientProps) {
  const router = useRouter();

  return (
    <SuppliersList
      suppliers={suppliers}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onRefresh={() => router.refresh()}
    />
  );
}
