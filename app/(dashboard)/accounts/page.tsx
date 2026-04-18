import { AccountsList } from "@/components/accounts/accounts-list";
import { getAccounts } from "@/lib/queries/accounts";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="py-6">
      <AccountsList accounts={accounts} />
    </div>
  );
}
