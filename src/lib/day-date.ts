/** Day 1 is January 1, 2026. UTC keeps the calendar date independent of timezone. */
export function calendarDateForDay(dayNumber: number): string {
  return new Date(Date.UTC(2026, 0, dayNumber)).toISOString().slice(0, 10);
}
