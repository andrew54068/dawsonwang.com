import { getCollection } from 'astro:content';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  absoluteUrl,
  cleanDescription,
} from '../lib/seo';
import {
  latestDefinedPublishedAt,
  publishedAtForManifest,
  toRfc822IfPresent,
} from '../lib/publish-metadata';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const MAX_ITEMS = 30;

export async function GET() {
  const days = await getCollection('days');
  const sorted = days
    .slice()
    .sort((a, b) => b.data.dayNumber - a.data.dayNumber)
    .slice(0, MAX_ITEMS);

  const latestPublishedAt = latestDefinedPublishedAt(sorted.map(day => publishedAtForManifest(day.data.manifest)))
    ?? new Date().toISOString();

  const selfUrl = absoluteUrl('/rss.xml');
  const siteHome = absoluteUrl('/');
  const lastBuild = toRfc822IfPresent(latestPublishedAt) ?? new Date().toUTCString();

  const itemsXml = sorted.map(day => {
    const publishedAt = publishedAtForManifest(day.data.manifest);
    const pubDate = toRfc822IfPresent(publishedAt);
    const url = absoluteUrl(`/day/${day.data.dayNumber}`);
    const titleRaw = `Day ${day.data.dayNumber} ${day.data.subtitle ?? ''}`.trim();
    const descRaw = cleanDescription(day.data.body ?? day.data.subtitle ?? DEFAULT_DESCRIPTION, 280);
    return [
      '    <item>',
      `      <title>${escapeXml(titleRaw)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      pubDate ? `      <pubDate>${escapeXml(pubDate)}</pubDate>` : '',
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
