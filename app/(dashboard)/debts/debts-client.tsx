'use client';

import { DebtsList } from '@/app/(dashboard)/debts/components/debts-list';
import type { DebtDTO } from '@/lib/queries/debts';
import { useRouter } from 'next/navigation';

interface DebtsClientProps {
  debts: DebtDTO[];
}

export function DebtsClient({ debts }: DebtsClientProps) {
  const router = useRouter();
  return <DebtsList debts={debts} onRefresh={() => router.refresh()} />;
}
