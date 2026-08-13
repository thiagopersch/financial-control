'use client';

import type { AccountDTO } from '@/lib/queries/accounts';
import { useRouter } from 'next/navigation';
import { PaymentMethodsList } from './components/payment-methods-list';

interface PaymentMethodsClientProps {
  paymentMethods: Awaited<
    ReturnType<typeof import('@/lib/queries/payment-methods').getPaymentMethodsPaginated>
  >['paymentMethods'];
  accounts: AccountDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function PaymentMethodsClient({
  paymentMethods,
  accounts,
  totalCount,
  page,
  pageSize,
}: PaymentMethodsClientProps) {
  const router = useRouter();

  return (
    <PaymentMethodsList
      paymentMethods={paymentMethods}
      accounts={accounts}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onRefresh={() => router.refresh()}
    />
  );
}
