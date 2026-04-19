import { CreditCardsList } from "@/components/credit-cards/credit-cards-list";
import { getAccounts } from "@/lib/queries/accounts";
import { getCreditCards } from "@/lib/queries/credit-cards";

export default async function CreditCardsPage() {
  const [creditCards, accounts] = await Promise.all([
    getCreditCards(),
    getAccounts(),
  ]);

  return (
    <div className="py-6">
      <CreditCardsList creditCards={creditCards} accounts={accounts} />
    </div>
  );
}