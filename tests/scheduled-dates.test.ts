import { describe, expect, it } from 'vitest';
import {
  clampDayToMonth,
  computeScheduledDueDate,
  shiftToDayOfMonth,
} from '@/lib/utils/scheduled-dates';

const ymd = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

describe('clampDayToMonth', () => {
  it('keeps days that fit in the month', () => {
    expect(clampDayToMonth(2026, 10, 15)).toBe(15);
  });

  it('clamps to the last day of short months', () => {
    expect(clampDayToMonth(2026, 1, 31)).toBe(28);
    expect(clampDayToMonth(2028, 1, 31)).toBe(29);
    expect(clampDayToMonth(2026, 10, 31)).toBe(30);
  });
});

describe('computeScheduledDueDate', () => {
  it('uses the due day within the occurrence month/year', () => {
    expect(ymd(computeScheduledDueDate(new Date(2026, 10, 5), 20))).toEqual([2026, 11, 20]);
  });

  it('allows a due day before the execution day in the same month', () => {
    expect(ymd(computeScheduledDueDate(new Date(2026, 9, 28), 10))).toEqual([2026, 10, 10]);
  });

  it('falls back to the occurrence date when there is no due day', () => {
    const occurrence = new Date(2026, 10, 5, 9, 30);
    const due = computeScheduledDueDate(occurrence, null);
    expect(due.getTime()).toBe(occurrence.getTime());
    expect(due).not.toBe(occurrence);
  });

  it('clamps to the end of short months', () => {
    expect(ymd(computeScheduledDueDate(new Date(2026, 1, 1), 31))).toEqual([2026, 2, 28]);
    expect(ymd(computeScheduledDueDate(new Date(2028, 1, 1), 31))).toEqual([2028, 2, 29]);
    expect(ymd(computeScheduledDueDate(new Date(2026, 10, 1), 31))).toEqual([2026, 11, 30]);
  });
});

describe('shiftToDayOfMonth', () => {
  it('moves the next execution to the new day keeping month and year', () => {
    expect(ymd(shiftToDayOfMonth(new Date(2026, 10, 5), 10))).toEqual([2026, 11, 10]);
    expect(ymd(shiftToDayOfMonth(new Date(2026, 10, 25), 3))).toEqual([2026, 11, 3]);
  });

  it('clamps to the month length without spilling into the next month', () => {
    expect(ymd(shiftToDayOfMonth(new Date(2026, 1, 15), 31))).toEqual([2026, 2, 28]);
    expect(ymd(shiftToDayOfMonth(new Date(2026, 0, 31), 30))).toEqual([2026, 1, 30]);
  });

  it('preserves the time of day', () => {
    const shifted = shiftToDayOfMonth(new Date(2026, 10, 5, 14, 45), 10);
    expect([shifted.getHours(), shifted.getMinutes()]).toEqual([14, 45]);
  });
});
