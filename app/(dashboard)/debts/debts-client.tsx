'use client';

import { DebtsList } from '@/app/(dashboard)/debts/components/debts-list';
import type { DebtDTO } from '@/lib/queries/debts';

interface DebtsClientProps {
  debts: DebtDTO[];
}

export function DebtsClient({ debts }: DebtsClientProps) {
  return <DebtsList debts={debts} onRefresh={() => {}} />;
}
