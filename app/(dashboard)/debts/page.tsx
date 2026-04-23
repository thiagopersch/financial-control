import { DebtsClient } from '@/app/(dashboard)/debts/debts-client';
import { getDebts } from '@/lib/queries/debts';

export default async function DebtsPage() {
  const debts = await getDebts();

  return <DebtsClient debts={debts} />;
}
