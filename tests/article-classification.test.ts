import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import classifications from '../src/data/article-classification.json';
import { ARTICLE_TYPES, FRESHNESS, classificationForDay, type ArticleClassification } from '../src/lib/article-taxonomy';
import { topicsForDay } from '../src/lib/topics';

const reviewed = classifications as Record<number, ArticleClassification>;

test('every article in the reviewed snapshot has editorial classification and provenance', () => {
  const days = Array.from({ length: 291 }, (_, i) => i + 1).filter(day => day !== 262);
  expect(Object.keys(reviewed).map(Number)).toEqual(expect.arrayContaining(days));
  const knownTypes = new Set<string>(ARTICLE_TYPES.map(t => t.slug));
  const knownFreshness = new Set<string>(FRESHNESS.map(t => t.slug));
  for (const value of Object.values(reviewed)) {
    expect(value.types.length).toBeGreaterThanOrEqual(1);
    expect(value.types.length).toBeLessThanOrEqual(2);
    expect(new Set(value.types).size).toBe(value.types.length);
    expect(value.types.every(t => knownTypes.has(t))).toBe(true);
    expect(value.freshness.length).toBeGreaterThanOrEqual(1);
    expect(value.freshness.length).toBeLessThanOrEqual(3);
    expect(new Set(value.freshness).size).toBe(value.freshness.length);
    expect(value.freshness.every(t => knownFreshness.has(t))).toBe(true);
    expect(value.reason.length).toBeGreaterThan(10);
    expect(value.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  }
});

test('recorded classification matches the exact source bytes that were reviewed', () => {
  const content = path.resolve(import.meta.dirname, '../100days/content');
  for (const dir of readdirSync(content).filter(name => /^day\d+$/.test(name))) {
    const day = Number(dir.slice(3));
    const value = reviewed[day];
    // Later articles remain publishable before a new editorial pass.
    if (!value) continue;
    expect(createHash('sha256').update(readFileSync(path.join(content, dir, 'source.md'))).digest('hex'), `Day ${day} source changed; review its classification`).toBe(value.sourceHash);
  }
});

test('basic concepts are distinct from beginner tools and support mixed freshness', () => {
  expect(classificationForDay(186)?.types).toContain('fundamentals');
  expect(classificationForDay(186)?.freshness).toEqual(expect.arrayContaining(['evergreen', 'versioned']));
  expect(classificationForDay(276)?.types).toContain('fundamentals');
  expect(topicsForDay(276)).toContain('prompt-context');
  expect(classificationForDay(107)?.types).toContain('tutorials');
  expect(classificationForDay(107)?.types).not.toContain('fundamentals');
  expect(classificationForDay(185)?.freshness).toContain('timely');
  expect(classificationForDay(204)?.types).toEqual(expect.arrayContaining(['methods', 'cases']));
});
