import { getCollection } from 'astro:content';
import { SITE_URL } from '../lib/seo';
import { topicsWithPosts } from '../lib/topics';

export async function GET() {
  const days = await getCollection('days');
  const validDayNumbers = days.map(day => day.data.dayNumber);
  const latest = days.sort((a, b) => b.data.dayNumber - a.data.dayNumber).slice(0, 20);
  const topics = topicsWithPosts(validDayNumbers);

  const lines = [
    '# Dawson Wang',
    '',
    '> AI workflow implementation consultant in Taiwan. Helps teams move AI tools from experiments into production workflows, including Claude Code, custom skills, MCP servers, agent workflows, and team enablement.',
    '',
    '## Core pages',
    `- [Home](${SITE_URL}/): AI 工具落地服務、作品證明、預約諮詢`,
    `- [Projects](${SITE_URL}/projects): portfolio — side projects built during the Day 1–${latest[0]?.data.dayNumber ?? days.length} build log (MCP servers, Claude Code plugins, a macOS driver, automation bots, web apps, most with public source) plus the public-record reach charts`,
    `- [Speaking](${SITE_URL}/speaking): AI lecturer profile — hospital staff training, vocational high school teacher workshops, and Ministry of Health-supported AI courses, with public slide decks`,
    `- [Business registration guide](${SITE_URL}/business-registration): Taiwan sole proprietorship setup timeline with sanitized field notes, costs, lead times, tax obligations, and common pitfalls`,
    `- [All posts](${SITE_URL}/days): daily AI workflow implementation notes`,
    `- [Topics](${SITE_URL}/topics): posts grouped by AI workflow themes`,
    `- [Search](${SITE_URL}/search): site search`,
    `- [RSS](${SITE_URL}/rss.xml): RSS 2.0 feed of latest posts`,
    '',
    '## Topics',
    ...topics.map(topic => `- [${topic.title}](${SITE_URL}/topics/${topic.slug}): ${topic.blurb}`),
    '',
    '## Latest posts',
    ...latest.map(day => `- [Day ${day.data.dayNumber}: ${day.data.subtitle}](${SITE_URL}/day/${day.data.dayNumber})`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
