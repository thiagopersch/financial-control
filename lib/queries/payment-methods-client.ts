import useSWR, { type SWRConfiguration } from 'swr';
import type { PaymentMethodDTO } from '@/lib/queries/payment-methods';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const paymentMethodsKey = '/api/payment-methods';

export function usePaymentMethods(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ paymentMethods: PaymentMethodDTO[] }>(
    paymentMethodsKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    paymentMethods: data?.paymentMethods || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
