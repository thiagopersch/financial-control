import { getAccounts } from '@/lib/queries/accounts';
import { getPaymentMethodsPaginated } from '@/lib/queries/payment-methods';
import { PaymentMethodsClient } from './payment-methods-client';
import { parsePageSize } from '@/lib/constants/pagination';

export default async function PaymentMethodsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    isCreditCard?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;

  const pageSize = parsePageSize(searchParams.pageSize);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const [{ paymentMethods, totalCount }, accounts] = await Promise.all([
    getPaymentMethodsPaginated({
      q: searchParams.q,
      isCreditCard: searchParams.isCreditCard,
      page,
      pageSize,
    }),
    getAccounts(),
  ]);

  return (
    <div className="py-6">
      <PaymentMethodsClient
        paymentMethods={paymentMethods}
        accounts={accounts}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
