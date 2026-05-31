import { z } from 'zod';

const ThreadsStats = z.object({
  views: z.number().optional(),
  likes: z.number().optional(),
  reposts: z.number().optional(),
  replies: z.number().optional(),
  quotes: z.number().optional(),
  follows: z.number().optional(),
}).default({});

const FacebookStats = z.object({
  views: z.number().optional(),
  reach: z.number().optional(),
  reactions: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  saves: z.number().optional(),
}).default({});

const LinkedInStats = z.object({
  impressions: z.number().optional(),
  reactions: z.number().optional(),
  comments: z.number().optional(),
}).default({});

const PlatformBlock = <T extends z.ZodType>(stats: T) =>
  z.object({
    published_at: z.string(),
    post_url: z.url(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: stats.optional().default({} as any),
  }).optional();

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
    threads: parsed.threads && {
      publishedAt: normalizePublishedAt(parsed.threads.published_at),
      postUrl: parsed.threads.post_url,
      stats: parsed.threads.stats,
    },
    facebook: parsed.facebook && {
      publishedAt: normalizePublishedAt(parsed.facebook.published_at),
      postUrl: parsed.facebook.post_url,
      stats: parsed.facebook.stats,
    },
    linkedin: parsed.linkedin && {
      publishedAt: normalizePublishedAt(parsed.linkedin.published_at),
      postUrl: parsed.linkedin.post_url,
      stats: parsed.linkedin.stats,
    },
  };
}
