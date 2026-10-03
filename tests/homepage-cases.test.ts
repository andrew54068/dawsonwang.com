import { describe, expect, test } from 'vitest';
import path from 'node:path';
import * as homepageCases from '../src/data/homepage-cases';
import { loadAllDays } from '../src/lib/content-loader';

describe('homepage case sharing', () => {
  test('every displayed case has a real article readers can open', async () => {
    const cases = 'CASE_STUDIES' in homepageCases ? homepageCases.CASE_STUDIES : [];
    expect(cases.length).toBeGreaterThan(0);

    const days = await loadAllDays(path.resolve('100days/content'));
    const availableDays = new Set(days.map(day => day.dayNumber));
    for (const entry of cases) {
      expect(availableDays.has(entry.dayNumber), entry.slug).toBe(true);
      for (const day of entry.relatedDays ?? []) {
        expect(availableDays.has(day), entry.slug + ': Day ' + day).toBe(true);
      }
    }
  });
});
