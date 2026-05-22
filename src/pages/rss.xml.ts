import { getCollection } from 'astro:content';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  absoluteUrl,
  cleanDescription,
} from '../lib/seo';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(value: string | undefined | null): string {
  if (!value) return new Date().toUTCString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

const MAX_ITEMS = 30;

export async function GET() {
  const days = await getCollection('days');
  const sorted = days
    .slice()
    .sort((a, b) => b.data.dayNumber - a.data.dayNumber)
    .slice(0, MAX_ITEMS);

  const latestPublishedAt = sorted
    .map(day => day.data.manifest?.threads?.publishedAt
      ?? day.data.manifest?.facebook?.publishedAt
      ?? day.data.manifest?.linkedin?.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? new Date().toISOString();

  const selfUrl = absoluteUrl('/rss.xml');
  const siteHome = absoluteUrl('/');
  const lastBuild = toRfc822(latestPublishedAt);

  const itemsXml = sorted.map(day => {
    const publishedAt = day.data.manifest?.threads?.publishedAt
      ?? day.data.manifest?.facebook?.publishedAt
      ?? day.data.manifest?.linkedin?.publishedAt
      ?? latestPublishedAt;
    const url = absoluteUrl(`/day/${day.data.dayNumber}`);
    const titleRaw = `Day ${day.data.dayNumber} ${day.data.subtitle ?? ''}`.trim();
    const descRaw = cleanDescription(day.data.body ?? day.data.subtitle ?? DEFAULT_DESCRIPTION, 280);
    return [
      '    <item>',
      `      <title>${escapeXml(titleRaw)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${escapeXml(toRfc822(publishedAt))}</pubDate>`,
      `      <description>${escapeXml(descRaw)}</description>`,
      '    </item>',
    ].join('\n');
  }).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${escapeXml(siteHome)}</link>`,
    `    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>`,
    `    <language>zh-Hant-TW</language>`,
    `    <lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />`,
    itemsXml,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
