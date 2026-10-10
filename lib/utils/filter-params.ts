/**
 * Filtros de multi-seleção são serializados como lista separada por vírgula
 * (ex.: `status=PAID,PENDING`) tanto na URL quanto no store persistido.
 */

const EMPTY_VALUES = new Set(['', 'all']);

/** Valor do filtro "Pago por" para transações sem usuário vinculado. */
export const PAID_BY_NONE = 'none';

export function parseMultiParam(value?: string | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => !EMPTY_VALUES.has(item)),
    ),
  );
}

export function serializeMultiParam(values: string[]): string {
  return values.filter((value) => !EMPTY_VALUES.has(value)).join(',');
}

/** Define o param quando há valores ou o remove quando a seleção está vazia. */
export function setMultiParam(params: URLSearchParams, key: string, values: string[]) {
  const serialized = serializeMultiParam(values);
  if (serialized) params.set(key, serialized);
  else params.delete(key);
}

/** `{ in: [...] }` para o Prisma, ou `undefined` quando nada foi selecionado. */
export function toInFilter<T extends string>(values: T[]) {
  return values.length > 0 ? { in: values } : undefined;
}

/** Predicado para filtros aplicados no client: seleção vazia = aceita tudo. */
export function matchesMulti(selected: string[], value: string | null | undefined) {
  return selected.length === 0 || (value != null && selected.includes(value));
}
