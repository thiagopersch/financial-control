'use client';

import { useRouter } from 'next/navigation';
import { CreditCardsList } from './components/credit-cards-list';
import type { AccountDTO } from '@/lib/queries/accounts';

interface CreditCardsClientProps {
  creditCards: Awaited<ReturnType<typeof import('@/lib/queries/credit-cards').getCreditCards>>;
  accounts: AccountDTO[];
}

export function CreditCardsClient({ creditCards, accounts }: CreditCardsClientProps) {
  const router = useRouter();

  return (
    <CreditCardsList
      creditCards={creditCards}
      accounts={accounts}
      onRefresh={() => router.refresh()}
    />
  );
}
