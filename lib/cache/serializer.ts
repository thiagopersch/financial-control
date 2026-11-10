import { Prisma } from '@prisma/client';

/**
 * JSON com suporte a `Date` e `Prisma.Decimal`: os dados cacheados voltam com
 * os mesmos tipos que a query original devolveu.
 */
const DATE_TAG = '$date';
const DECIMAL_TAG = '$decimal';

export function serialize(value: unknown): string {
  return JSON.stringify(value, function replacer(this: Record<string, unknown>, key, current) {
    const raw = this[key];
    if (raw instanceof Date) return { [DATE_TAG]: raw.toISOString() };
    if (Prisma.Decimal.isDecimal(raw)) return { [DECIMAL_TAG]: raw.toString() };
    return current;
  });
}

export function deserialize<T>(text: string): T {
  return JSON.parse(text, (_key, current) => {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      const keys = Object.keys(current);
      if (keys.length === 1) {
        if (keys[0] === DATE_TAG) return new Date(current[DATE_TAG]);
        if (keys[0] === DECIMAL_TAG) return new Prisma.Decimal(current[DECIMAL_TAG]);
      }
    }
    return current;
  }) as T;
}
