import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { deserialize, serialize } from '@/lib/cache/serializer';

describe('cache serializer', () => {
  it('round-trips Dates and Decimals with their original types', () => {
    const value = {
      when: new Date('2026-11-01T12:00:00.000Z'),
      amount: new Prisma.Decimal('1234.56'),
      nested: [{ at: new Date('2026-01-31T00:00:00.000Z') }],
      plain: 'texto',
    };
    const back = deserialize<typeof value>(serialize(value));
    expect(back.when).toBeInstanceOf(Date);
    expect(back.when.toISOString()).toBe('2026-11-01T12:00:00.000Z');
    expect(Prisma.Decimal.isDecimal(back.amount)).toBe(true);
    expect(back.amount.toString()).toBe('1234.56');
    expect(back.nested[0].at).toBeInstanceOf(Date);
    expect(back.plain).toBe('texto');
  });
});
