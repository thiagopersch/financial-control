import { getCreditCards } from '@/lib/queries/credit-cards';
import { getAccounts } from '@/lib/queries/accounts';
import { CreditCardsClient } from './credit-cards-client';

export default async function CreditCardsPage() {
  const [creditCards, accounts] = await Promise.all([getCreditCards(), getAccounts()]);

  return (
    <div className="py-6">
      <CreditCardsClient creditCards={creditCards} accounts={accounts} />
    </div>
  );
}
