import { TOPICS, DAY_TOPICS, type Topic, type ChipVariant } from '../data/topics';

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find(t => t.slug === slug);
}

export function topicsForDay(dayNumber: number): string[] {
  return DAY_TOPICS[dayNumber] ?? [];
}

/** Returns day numbers tagged for `slug`, sorted newest-first (descending). */
export function daysForTopic(slug: string): number[] {
  return Object.entries(DAY_TOPICS)
    .filter(([, slugs]) => slugs.includes(slug))
    .map(([day]) => parseInt(day, 10))
    .sort((a, b) => b - a);
}

export function allTopics(): Topic[] {
  return TOPICS;
}

/** Returns only topics that currently map to at least one tagged day. */
export function topicsWithPosts(): Topic[] {
  return TOPICS.filter(topic => daysForTopic(topic.slug).length > 0);
}

export function chipVariantFor(slug: string): ChipVariant {
  return TOPICS.find(t => t.slug === slug)?.chipVariant ?? 'outline';
}
