import { getCollection } from 'astro:content';
import { SITE_URL } from '../lib/seo';
import { allTopics } from '../lib/topics';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function entry(path: string, priority: string, changefreq: string, lastmod?: string) {
  const loc = `${SITE_URL}${path}`;
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export async function GET() {
  const days = await getCollection('days');
  const topics = allTopics();
  const now = new Date().toISOString();
  const latestPublishedAt = days
    .map(day => day.data.manifest?.threads?.publishedAt
      ?? day.data.manifest?.facebook?.publishedAt
      ?? day.data.manifest?.linkedin?.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? now;

  const urls = [
    entry('/', '1.0', 'weekly', latestPublishedAt),
    entry('/proof', '0.9', 'weekly', latestPublishedAt),
    entry('/days', '0.9', 'daily', latestPublishedAt),
    entry('/topics', '0.7', 'weekly', latestPublishedAt),
    entry('/search', '0.5', 'monthly', latestPublishedAt),
    ...topics.map(topic => entry(`/topics/${topic.slug}`, '0.7', 'weekly', latestPublishedAt)),
    ...days
      .sort((a, b) => b.data.dayNumber - a.data.dayNumber)
      .map(day => {
        const publishedAt = day.data.manifest?.threads?.publishedAt
          ?? day.data.manifest?.facebook?.publishedAt
          ?? day.data.manifest?.linkedin?.publishedAt
          ?? latestPublishedAt;
        return entry(`/day/${day.data.dayNumber}`, '0.8', 'monthly', publishedAt);
      }),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
