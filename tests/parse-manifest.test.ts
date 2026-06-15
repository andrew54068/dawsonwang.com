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
    threads: { published_at: '2026-02-19T00:00:00Z', post_url: 'https://www.threads.com/@andrew54068/post/day50' },
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
    threads: { published_at: '2026-05-03T00:00:00Z', post_url: 'https://www.threads.com/@andrew54068/post/day122' },
  };
  const result = parseManifest(raw);
  expect(result.threads?.stats).toEqual({});
});

test('parses latest-schema manifests, strips null metrics, and tolerates null platforms', () => {
  const raw = {
    day: 159,
    threads: {
      published_at: '2026-06-08T17:24:28.440Z',
      post_url: 'https://www.threads.com/@andrew54068/post/DZVUpKbj1MM',
      latest: {
        views: 55501,
        views_approximate: null,
        follows: null,
        likes: 145,
        replies: 8,
        reposts: 12,
        quotes: null,
        collected_at: '2026-06-09T00:00:00Z',
      },
    },
    facebook: null,
    linkedin: {
      published_at: '2026-06-08T17:24:47.967Z',
      post_url: 'https://www.linkedin.com/feed/update/urn:li:activity:7469801527746973696/',
      latest: {
        impressions: 1200,
        reactions: null,
        comments: 1,
        reposts: null,
        collected_at: '2026-06-09T00:00:00Z',
      },
    },
  };

  const result = parseManifest(raw);
  expect(result.facebook).toBeUndefined();
  expect(result.threads?.stats).toEqual({
    views: 55501,
    likes: 145,
    replies: 8,
    reposts: 12,
  });
  expect(result.linkedin?.stats).toEqual({
    impressions: 1200,
    comments: 1,
  });
});
