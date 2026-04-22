import useSWR, { type SWRConfiguration } from 'swr';

export interface CreditCardDTO {
  id: string;
  accountId: string;
  limit: number;
  initialBalance: number;
  usedAmount: number;
  closingDay: number;
  dueDay: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
  availableLimit: number;
  usagePercentage: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const creditCardsKey = '/api/credit-cards';

export function useCreditCards(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ creditCards: CreditCardDTO[] }>(
    creditCardsKey,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    creditCards: data?.creditCards || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useCreditCardById(id: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ creditCard: CreditCardDTO }>(
    id ? `/api/credit-cards/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    },
  );

  return {
    creditCard: data?.creditCard || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
