import { test, expect } from 'vitest';
import { computeStatsSummary, isTopPerformer } from '../src/lib/metrics';
import { parseManifest } from '../src/lib/parse-manifest';

test('isTopPerformer returns false for unflagged day', () => {
  expect(isTopPerformer(99999)).toBe(false);
});

test('computeStatsSummary aggregates latest-schema manifest stats for proof charts', () => {
  const days = [
    {
      data: {
        dayNumber: 8,
        manifest: parseManifest({
          day: 8,
          threads: {
            published_at: '2026-01-08T00:00:00Z',
            post_url: 'https://www.threads.com/@andrew54068/post/day8',
            latest: { views: 55501, likes: 145 },
          },
        }),
      },
    },
    {
      data: {
        dayNumber: 98,
        manifest: parseManifest({
          day: 98,
          facebook: {
            published_at: '2026-04-08T00:00:00Z',
            post_url: 'https://www.facebook.com/permalink/98',
            latest: { reach: 37168, reactions: 99 },
          },
          linkedin: {
            published_at: '2026-04-08T00:00:00Z',
            post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:98/',
            latest: { impressions: 207 },
          },
        }),
      },
    },
    {
      data: {
        dayNumber: 159,
        manifest: parseManifest({
          day: 159,
          threads: {
            published_at: '2026-06-08T00:00:00Z',
            post_url: 'https://www.threads.com/@andrew54068/post/day159',
            latest: { views: null, likes: null },
          },
          facebook: {
            published_at: '2026-06-08T00:00:00Z',
            post_url: 'https://www.facebook.com/permalink/159',
            latest: { reach: null, reactions: null },
          },
        }),
      },
    },
  ];

  const summary = computeStatsSummary(days);
  expect(summary.totalDays).toBe(3);
  expect(summary.threadsSeries).toEqual([{ day: 8, value: 55501 }]);
  expect(summary.facebookSeries).toEqual([{ day: 98, value: 37168 }]);
  expect(summary.totalThreadsViews).toBe(55501);
  expect(summary.totalFacebookReach).toBe(37168);
  expect(summary.totalLinkedInImpressions).toBe(207);
});
