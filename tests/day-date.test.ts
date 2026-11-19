import { expect, test } from 'vitest';
import { calendarDateForDay } from '../src/lib/day-date';

test.each([
  [1, '2026-01-01'],
  [56, '2026-02-25'],
  [59, '2026-02-28'],
  [60, '2026-03-01'],
  [223, '2026-08-11'],
])('Day %i belongs to %s', (dayNumber, expected) => {
  expect(calendarDateForDay(dayNumber)).toBe(expected);
});
