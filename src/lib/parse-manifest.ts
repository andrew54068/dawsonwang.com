import { z } from 'zod';

const metricNumber = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.number().optional(),
);

const ThreadsStats = z.object({
  views: metricNumber,
  likes: metricNumber,
  reposts: metricNumber,
  replies: metricNumber,
  quotes: metricNumber,
  follows: metricNumber,
});

const FacebookStats = z.object({
  views: metricNumber,
  reach: metricNumber,
  reactions: metricNumber,
  comments: metricNumber,
  shares: metricNumber,
  saves: metricNumber,
});

const LinkedInStats = z.object({
  impressions: metricNumber,
  reactions: metricNumber,
  comments: metricNumber,
  reposts: metricNumber,
});

const PlatformBlock = <T extends z.ZodType>(stats: T) =>
  z.object({
    published_at: z.string(),
    post_url: z.url(),
    stats: stats.optional().nullable(),
    latest: stats.optional().nullable(),
  }).nullable().optional();

const ManifestSchema = z.object({
  day: z.number(),
  threads: PlatformBlock(ThreadsStats),
  facebook: PlatformBlock(FacebookStats),
  linkedin: PlatformBlock(LinkedInStats),
});

function normalizePublishedAt(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function stripNumericMetrics<T extends Record<string, number | undefined>>(stats?: T | null): T {
  return Object.fromEntries(
    Object.entries(stats ?? {}).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)),
  ) as T;
}

export interface ParsedManifest {
  day: number;
  threads?: { publishedAt?: string; postUrl: string; stats: z.infer<typeof ThreadsStats> };
  facebook?: { publishedAt?: string; postUrl: string; stats: z.infer<typeof FacebookStats> };
  linkedin?: { publishedAt?: string; postUrl: string; stats: z.infer<typeof LinkedInStats> };
}

function selectStats<T extends Record<string, number | undefined>>(platform?: {
  latest?: T | null;
  stats?: T | null;
} | null): T {
  const latest = stripNumericMetrics(platform?.latest);
  if (Object.keys(latest).length > 0) return latest;

  const legacy = stripNumericMetrics(platform?.stats);
  if (Object.keys(legacy).length > 0) return legacy;

  return {} as T;
}

export function parseManifest(raw: unknown): ParsedManifest {
  const parsed = ManifestSchema.parse(raw);

  return {
    day: parsed.day,
    ...(parsed.threads ? {
      threads: {
        publishedAt: normalizePublishedAt(parsed.threads.published_at),
        postUrl: parsed.threads.post_url,
        stats: selectStats(parsed.threads),
      },
    } : {}),
    ...(parsed.facebook ? {
      facebook: {
        publishedAt: normalizePublishedAt(parsed.facebook.published_at),
        postUrl: parsed.facebook.post_url,
        stats: selectStats(parsed.facebook),
      },
    } : {}),
    ...(parsed.linkedin ? {
      linkedin: {
        publishedAt: normalizePublishedAt(parsed.linkedin.published_at),
        postUrl: parsed.linkedin.post_url,
        stats: selectStats(parsed.linkedin),
      },
    } : {}),
  };
}
