import { z } from 'zod';

// Engagement metrics live under each platform's `latest` snapshot in the publish
// manifest, and every field can be null until a snapshot is collected. Strip nulls
// before validation so the optional schema doesn't reject them, and so a not-yet-
// collected snapshot parses to a clean `{}` rather than an object full of nulls.
const stripNullValues = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null))
    : value;

const ThreadsStats = z.preprocess(stripNullValues, z.object({
  views: z.number(),
  likes: z.number(),
  reposts: z.number(),
  replies: z.number(),
  quotes: z.number(),
  follows: z.number(),
}).partial());

const FacebookStats = z.preprocess(stripNullValues, z.object({
  views: z.number(),
  reach: z.number(),
  reactions: z.number(),
  comments: z.number(),
  shares: z.number(),
  saves: z.number(),
}).partial());

const LinkedInStats = z.preprocess(stripNullValues, z.object({
  impressions: z.number(),
  reactions: z.number(),
  comments: z.number(),
}).partial());

const PlatformBlock = <T extends z.ZodType>(stats: T) =>
  z.object({
    published_at: z.string(),
    post_url: z.url(),
    // `latest` is the current manifest shape (most recent collected snapshot);
    // `stats` is the legacy pre-consolidation shape kept for backward compatibility.
    // Both share the same field schema; `latest` wins when present.
    latest: stats.nullish(),
    stats: stats.nullish(),
  }).nullish();

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

export interface ParsedManifest {
  day: number;
  threads?: { publishedAt?: string; postUrl: string; stats: z.infer<typeof ThreadsStats> };
  facebook?: { publishedAt?: string; postUrl: string; stats: z.infer<typeof FacebookStats> };
  linkedin?: { publishedAt?: string; postUrl: string; stats: z.infer<typeof LinkedInStats> };
}

export function parseManifest(raw: unknown): ParsedManifest {
  const parsed = ManifestSchema.parse(raw);
  return {
    day: parsed.day,
    threads: parsed.threads ? {
      publishedAt: normalizePublishedAt(parsed.threads.published_at),
      postUrl: parsed.threads.post_url,
      stats: parsed.threads.latest ?? parsed.threads.stats ?? {},
    } : undefined,
    facebook: parsed.facebook ? {
      publishedAt: normalizePublishedAt(parsed.facebook.published_at),
      postUrl: parsed.facebook.post_url,
      stats: parsed.facebook.latest ?? parsed.facebook.stats ?? {},
    } : undefined,
    linkedin: parsed.linkedin ? {
      publishedAt: normalizePublishedAt(parsed.linkedin.published_at),
      postUrl: parsed.linkedin.post_url,
      stats: parsed.linkedin.latest ?? parsed.linkedin.stats ?? {},
    } : undefined,
  };
}
