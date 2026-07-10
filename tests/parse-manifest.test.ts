import { test, expect } from 'vitest';
import { parseManifest } from '../src/lib/parse-manifest';

test('parses full manifest with all platforms', () => {
  const raw = {
    day: 121,
    threads: {
      published_at: '2026-05-01T16:02:54.088Z',
      post_url: 'https://www.threads.com/@andrew54068/post/DXzVGSSGrEl',
      stats: { views: 16487 },
    },
    facebook: {
      published_at: '2026-05-01T16:00:00.000Z',
      post_url: 'https://www.facebook.com/permalink/123',
      stats: { reactions: 42 },
    },
    linkedin: {
      published_at: '2026-05-01T16:02:43.617Z',
      post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7456010154363281408/',
      stats: { impressions: 12, comments: 1 },
    },
  };
  const result = parseManifest(raw);
  expect(result.day).toBe(121);
  expect(result.threads?.postUrl).toBe('https://www.threads.com/@andrew54068/post/DXzVGSSGrEl');
  expect(result.threads?.stats.views).toBe(16487);
  expect(result.facebook?.stats.reactions).toBe(42);
  expect(result.linkedin?.stats.impressions).toBe(12);
});

test('handles missing platforms (early days without LinkedIn)', () => {
  const raw = {
    day: 50,
    threads: { published_at: '2026-02-19T00:00:00Z', post_url: 'https://...' },
  };
  const result = parseManifest(raw);
  expect(result.linkedin).toBeUndefined();
  expect(result.facebook).toBeUndefined();
  expect(result.threads?.stats).toEqual({});
});

test('normalizes blank published_at values to undefined without dropping the platform record', () => {
  const raw = {
    day: 44,
    threads: {
      published_at: '   ',
      post_url: 'https://www.threads.com/@andrew54068/post/DUtUFc8k9Um',
    },
  };
  const result = parseManifest(raw);
  expect(result.threads?.publishedAt).toBeUndefined();
  expect(result.threads?.postUrl).toBe('https://www.threads.com/@andrew54068/post/DUtUFc8k9Um');
  expect(result.threads?.stats).toEqual({});
});

test('returns no-stats record when stats not yet collected', () => {
  const raw = {
    day: 122,
    threads: { published_at: '2026-05-03T00:00:00Z', post_url: 'https://x' },
  };
  const result = parseManifest(raw);
  expect(result.threads?.stats).toEqual({});
});

test('reads engagement from the current `latest` snapshot format, stripping null fields', () => {
  const raw = {
    day: 87,
    threads: {
      published_at: '2026-03-28T17:04:18.752Z',
      post_url: 'https://www.threads.com/@andrew54068/post/DWbxol1mleQ',
      latest: { views: 179, likes: 4, reposts: 1, replies: null, quotes: null, follows: null, collected_at: '2026-04-17T05:54:20.114Z' },
      snapshots: [{ views: 179, interval: 'legacy', collected_at: '2026-04-17T05:54:20.114Z' }],
    },
    facebook: {
      published_at: '2026-03-28T16:00:00.000Z',
      post_url: 'https://www.facebook.com/permalink/1',
      latest: { reach: 320, reactions: 12, comments: null, shares: null, saves: null, views: null, collected_at: '2026-04-01T00:00:00Z' },
    },
    linkedin: {
      published_at: '2026-03-28T16:02:00.000Z',
      post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:1/',
      latest: { impressions: 540, reactions: 3, comments: null, reposts: null, collected_at: '2026-04-01T00:00:00Z' },
    },
  };
  const result = parseManifest(raw);
  expect(result.threads?.stats).toEqual({ views: 179, likes: 4, reposts: 1 });
  expect(result.facebook?.stats).toEqual({ reach: 320, reactions: 12 });
  expect(result.linkedin?.stats).toEqual({ impressions: 540, reactions: 3 });
});

test('returns empty stats when the latest snapshot has no numbers collected yet', () => {
  const raw = {
    day: 165,
    facebook: {
      published_at: '2026-06-14T16:39:40.676Z',
      post_url: 'https://www.facebook.com/permalink/2',
      latest: { reactions: null, comments: null, shares: null, reach: null, saves: null, views: null, collected_at: null },
    },
  };
  const result = parseManifest(raw);
  expect(result.facebook?.stats).toEqual({});
});

test('prefers the current latest snapshot over a legacy stats block when both are present', () => {
  const raw = {
    day: 100,
    threads: {
      published_at: '2026-04-10T17:32:54.291Z',
      post_url: 'https://x',
      stats: { views: 11 },
      latest: { views: 9000 },
    },
  };
  const result = parseManifest(raw);
  expect(result.threads?.stats.views).toBe(9000);
});
