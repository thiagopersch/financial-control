'use client';

import type { AccountDTO } from '@/lib/queries/accounts';
import { PaymentMethodsList } from './components/payment-methods-list';

interface PaymentMethodsClientProps {
  paymentMethods: Awaited<
    ReturnType<typeof import('@/lib/queries/payment-methods').getPaymentMethods>
  >;
  accounts: AccountDTO[];
}

export function PaymentMethodsClient({ paymentMethods, accounts }: PaymentMethodsClientProps) {
  return (
    <PaymentMethodsList paymentMethods={paymentMethods} accounts={accounts} onRefresh={() => {}} />
  );
}
