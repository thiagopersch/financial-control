import { getAccounts } from '@/lib/queries/accounts';
import { getPaymentMethods } from '@/lib/queries/payment-methods';
import { PaymentMethodsClient } from './payment-methods-client';

export default async function PaymentMethodsPage() {
  const [paymentMethods, accounts] = await Promise.all([getPaymentMethods(), getAccounts()]);

  return (
    <div className="py-6">
      <PaymentMethodsClient paymentMethods={paymentMethods} accounts={accounts} />
    </div>
  );
}
