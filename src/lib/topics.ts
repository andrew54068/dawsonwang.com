import { TOPICS, DAY_TOPICS, type Topic, type ChipVariant } from '../data/topics';

function normalizeValidDaySet(validDayNumbers?: Iterable<number>) {
  return validDayNumbers ? new Set(validDayNumbers) : undefined;
}

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find(t => t.slug === slug);
}

export function topicsForDay(dayNumber: number): string[] {
  return DAY_TOPICS[dayNumber] ?? [];
}

/** Returns day numbers tagged for `slug`, sorted newest-first (descending). */
export function daysForTopic(slug: string, validDayNumbers?: Iterable<number>): number[] {
  const validDaySet = normalizeValidDaySet(validDayNumbers);

  return Object.entries(DAY_TOPICS)
    .filter(([day, slugs]) => {
      const dayNumber = parseInt(day, 10);
      return slugs.includes(slug) && (!validDaySet || validDaySet.has(dayNumber));
    })
    .map(([day]) => parseInt(day, 10))
    .sort((a, b) => b - a);
}

export function allTopics(): Topic[] {
  return TOPICS;
}

/** Returns only topics backed by at least one real loaded day. */
export function topicsWithPosts(validDayNumbers?: Iterable<number>): Topic[] {
  return TOPICS.filter(topic => daysForTopic(topic.slug, validDayNumbers).length > 0);
}

export function chipVariantFor(slug: string): ChipVariant {
  return TOPICS.find(t => t.slug === slug)?.chipVariant ?? 'outline';
}
