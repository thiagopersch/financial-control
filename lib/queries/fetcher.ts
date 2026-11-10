import type { SWRConfiguration } from 'swr';

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly info?: unknown,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Fetcher único do SWR: checa `res.ok` e lança `FetchError` (antes cada módulo
 * tinha o seu, e a maioria tratava um 500 como dado válido).
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const info = await res.json().catch(() => null);
    throw new FetchError(
      (info as { error?: string } | null)?.error ?? `Erro ${res.status} ao buscar dados`,
      res.status,
      info,
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Configuração global do SWR (provider em `components/theme/mui-provider.tsx`):
 * mesma chave = uma única requisição em voo (deduplicação de 5s), sem refetch
 * ao focar a aba e mantendo os dados anteriores enquanto a nova página carrega.
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  dedupingInterval: 5000,
  revalidateOnFocus: false,
  keepPreviousData: true,
  errorRetryCount: 2,
  shouldRetryOnError: (error) => !(error instanceof FetchError && error.status < 500),
};
