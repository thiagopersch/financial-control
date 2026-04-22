import { getAccounts } from '@/lib/queries/accounts';
import { AccountsClient } from './accounts-client';

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="py-6">
      <AccountsClient accounts={accounts} />
    </div>
  );
}
