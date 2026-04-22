'use client';

import { SuppliersList } from './components/suppliers-list';

interface SuppliersClientProps {
  suppliers: Awaited<ReturnType<typeof import('@/lib/queries/suppliers').getSuppliers>>;
}

export function SuppliersClient({ suppliers }: SuppliersClientProps) {
  return <SuppliersList suppliers={suppliers} onRefresh={() => {}} />;
}
