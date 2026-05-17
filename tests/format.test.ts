import { test, expect } from 'vitest';
import { formatViews, formatDate } from '../src/lib/format';

test('formatViews — under 10000', () => {
  expect(formatViews(847)).toBe('847');
});

test('formatViews — thousands', () => {
  expect(formatViews(16487)).toBe('1.6 萬');
  expect(formatViews(123456)).toBe('12 萬');
});

test('formatViews — boundary rounding at 99999 produces "10.0 萬"', () => {
  // Documents current rounding behavior: 99999/10000 = 9.9999 which toFixed(1) rounds to "10.0".
  // If product wants "9.9 萬" as the ceiling for the 萬 range, the second branch needs to clamp.
  expect(formatViews(99999)).toBe('10.0 萬');
});

test('formatDate — UTC ISO -> Taipei date', () => {
  expect(formatDate('2026-05-01T16:02:54.088Z')).toBe('2026/05/02');
});
