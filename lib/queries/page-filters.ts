import { getPageFiltersCookieName, pickFilterParams } from '@/lib/utils/page-filters';
import { cookies } from 'next/headers';

/** Server: filtros persistidos da página (cookie espelhado do localStorage). */
export async function getPageFilters(pathname: string): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  // O Next já aplica `decodeURIComponent` ao ler o valor.
  const value = cookieStore.get(getPageFiltersCookieName(pathname))?.value;
  if (!value) return {};
  return Object.fromEntries(pickFilterParams(new URLSearchParams(value)));
}
