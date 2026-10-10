export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 15;

/** Valida o tamanho de página vindo da URL/API; valores fora da lista caem no padrão. */
export function parsePageSize(value: unknown): number {
  const size = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
}
