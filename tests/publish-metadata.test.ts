import { test, expect } from 'vitest';
import {
  latestDefinedPublishedAt,
  publishedAtForManifest,
  toRfc822IfPresent,
} from '../src/lib/publish-metadata';

test('publishedAtForManifest returns the first available platform timestamp in precedence order', () => {
  expect(publishedAtForManifest({
    threads: { publishedAt: '2026-05-03T09:00:00.000Z' },
    facebook: { publishedAt: '2026-05-03T08:00:00.000Z' },
    linkedin: { publishedAt: '2026-05-03T07:00:00.000Z' },
  })).toBe('2026-05-03T09:00:00.000Z');

  expect(publishedAtForManifest({
    facebook: { publishedAt: '2026-05-03T08:00:00.000Z' },
    linkedin: { publishedAt: '2026-05-03T07:00:00.000Z' },
  })).toBe('2026-05-03T08:00:00.000Z');
});

test('publishedAtForManifest returns undefined when every platform timestamp is missing', () => {
  expect(publishedAtForManifest({
    threads: {},
    facebook: {},
    linkedin: {},
  })).toBeUndefined();
  expect(publishedAtForManifest(undefined)).toBeUndefined();
});

test('latestDefinedPublishedAt returns the newest defined timestamp and ignores missing values', () => {
  expect(latestDefinedPublishedAt([
    undefined,
    '2026-05-01T10:00:00.000Z',
    null,
    '2026-05-02T09:00:00.000Z',
  ])).toBe('2026-05-02T09:00:00.000Z');

  expect(latestDefinedPublishedAt([undefined, null])).toBeUndefined();
});

test('toRfc822IfPresent omits missing or invalid timestamps instead of fabricating a current date', () => {
  expect(toRfc822IfPresent(undefined)).toBeUndefined();
  expect(toRfc822IfPresent(null)).toBeUndefined();
  expect(toRfc822IfPresent('not-a-date')).toBeUndefined();
});

test('toRfc822IfPresent converts an ISO timestamp to RFC 822', () => {
  expect(toRfc822IfPresent('2026-05-03T09:00:00.000Z')).toBe('Sun, 03 May 2026 09:00:00 GMT');
});
