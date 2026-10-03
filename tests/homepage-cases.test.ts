import { describe, expect, test } from 'vitest';
import path from 'node:path';
import { access } from 'node:fs/promises';
import * as homepageCases from '../src/data/homepage-cases';
import { loadAllDays } from '../src/lib/content-loader';

describe('homepage case sharing', () => {
  test('each case illustration is a readable public asset with descriptive alternative text', async () => {
    for (const entry of homepageCases.CASE_STUDIES) {
      expect(entry.image.alt.trim().length, entry.slug).toBeGreaterThan(0);
      expect(entry.image.width, entry.slug).toBeGreaterThan(0);
      expect(entry.image.height, entry.slug).toBeGreaterThan(0);
      await expect(access(path.resolve('public', entry.image.src.slice(1)))).resolves.toBeUndefined();
    }
  });
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
