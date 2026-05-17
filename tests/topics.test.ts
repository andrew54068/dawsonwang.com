import { test, expect } from 'vitest';
import { topicsForDay, daysForTopic, topicBySlug } from '../src/lib/topics';
import { chipVariantFor } from '../src/lib/topics';

test('topicBySlug returns topic by slug', () => {
  const t = topicBySlug('claude-code');
  expect(t?.title).toBe('Claude Code');
});

test('topicBySlug returns undefined for unknown slug', () => {
  expect(topicBySlug('nonexistent')).toBeUndefined();
});

test('topicsForDay returns mapped topic slugs', () => {
  // day 121 mapped to claude-code in the seed data
  expect(topicsForDay(121)).toContain('claude-code');
});

test('topicsForDay returns empty array for untagged day', () => {
  expect(topicsForDay(99999)).toEqual([]);
});

test('daysForTopic returns day numbers tagged for a slug', () => {
  const days = daysForTopic('claude-code');
  expect(days).toContain(121);
});

test('daysForTopic sorts newest-first', () => {
  // Both day 120 and 121 seeded with 'claude-code' in DAY_TOPICS.
  const days = daysForTopic('claude-code');
  expect(days).toEqual([...days].sort((a, b) => b - a));
});

test('chipVariantFor returns the topic chip color', () => {
  expect(chipVariantFor('claude-code')).toBe('teal');
  expect(chipVariantFor('social-platforms')).toBe('brick');
  expect(chipVariantFor('agents')).toBe('ochre');
  expect(chipVariantFor('content-workflow')).toBe('sage');
});

test('chipVariantFor defaults to outline for untagged or unknown slugs', () => {
  expect(chipVariantFor('browser-automation')).toBe('outline');
  expect(chipVariantFor('security')).toBe('outline');
  expect(chipVariantFor('does-not-exist')).toBe('outline');
});
