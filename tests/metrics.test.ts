import { test, expect } from 'vitest';
import { computeStatsSummary, isTopPerformer, type DayLike } from '../src/lib/metrics';
import { parseManifest } from '../src/lib/parse-manifest';

test('isTopPerformer returns false for unflagged day', () => {
  expect(isTopPerformer(99999)).toBe(false);
});

function buildDay(dayNumber: number, manifest: unknown): DayLike {
  return {
    data: {
      dayNumber,
      manifest: parseManifest(manifest),
    },
  };
}

test('computeStatsSummary aggregates latest-snapshot metrics and ignores null-only snapshots', () => {
  const days: DayLike[] = [
    buildDay(100, {
      day: 100,
      threads: {
        published_at: '2026-04-10T17:32:54.291Z',
        post_url: 'https://www.threads.com/@andrew54068/post/DX100',
        latest: { views: 9000, likes: null, reposts: null, replies: null, quotes: null, follows: null, collected_at: '2026-04-11T00:00:00Z' },
      },
      linkedin: {
        published_at: '2026-04-10T18:00:00.000Z',
        post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:100/',
        latest: { impressions: 30, reactions: null, comments: null, collected_at: '2026-04-11T00:00:00Z' },
      },
    }),
    buildDay(165, {
      day: 165,
      facebook: {
        published_at: '2026-06-14T16:39:40.676Z',
        post_url: 'https://www.facebook.com/permalink/165',
        latest: { reactions: null, comments: null, shares: null, reach: null, saves: null, views: null, collected_at: null },
      },
    }),
    buildDay(87, {
      day: 87,
      threads: {
        published_at: '2026-03-28T17:04:18.752Z',
        post_url: 'https://www.threads.com/@andrew54068/post/DWbxol1mleQ',
        latest: { views: 179, likes: 4, reposts: 1, replies: null, quotes: null, follows: null, collected_at: '2026-04-17T05:54:20.114Z' },
      },
      facebook: {
        published_at: '2026-03-28T16:00:00.000Z',
        post_url: 'https://www.facebook.com/permalink/87',
        latest: { reach: 320, reactions: 12, comments: null, shares: null, saves: null, views: null, collected_at: '2026-04-01T00:00:00Z' },
      },
      linkedin: {
        published_at: '2026-03-28T16:02:00.000Z',
        post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:87/',
        latest: { impressions: 540, reactions: 3, comments: null, collected_at: '2026-04-01T00:00:00Z' },
      },
    }),
  ];

  const summary = computeStatsSummary(days);

  expect(summary.totalDays).toBe(3);
  expect(summary.threadsSeries).toEqual([
    { day: 87, value: 179 },
    { day: 100, value: 9000 },
  ]);
  expect(summary.facebookSeries).toEqual([
    { day: 87, value: 320 },
  ]);
  expect(summary.totalThreadsViews).toBe(9179);
  expect(summary.totalFacebookReach).toBe(320);
  expect(summary.totalLinkedInImpressions).toBe(570);
});
