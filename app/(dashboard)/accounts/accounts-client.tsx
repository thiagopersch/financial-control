'use client';

import { AccountsList } from './components/accounts-list';

interface AccountsClientProps {
  accounts: Awaited<ReturnType<typeof import('@/lib/queries/accounts').getAccounts>>;
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  return <AccountsList accounts={accounts} onRefresh={() => {}} />;
}
