import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from 'vitest';
import { topicsForDay, daysForTopic, topicBySlug, topicsWithPosts, allTopics } from '../src/lib/topics';
import { chipVariantFor } from '../src/lib/topics';
import { DAY_TOPICS } from '../src/data/topics';

const CONTENT_DIR = path.resolve(import.meta.dirname, '../100days/content');

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
  const days = daysForTopic('claude-code');
  expect(days).toEqual([...days].sort((a, b) => b - a));
});

test('daysForTopic can restrict results to real loaded day numbers', () => {
  expect(daysForTopic('claude-code', [121])).toEqual([121]);
  expect(daysForTopic('agents', [121])).toEqual([]);
});

test('topicsWithPosts excludes zero-post topics from crawlable topic surfaces', () => {
  // Day 121 is claude-code + dev-tooling; day 120 adds token-cost.
  const topicSlugs = topicsWithPosts([120, 121]).map(topic => topic.slug);
  expect(topicSlugs).toEqual(expect.arrayContaining(['claude-code', 'dev-tooling', 'token-cost']));
  expect(topicSlugs).toHaveLength(3);
});

test('topicsWithPosts only returns topics backed by tagged loaded days', () => {
  const validDayNumbers = [121];
  const topics = topicsWithPosts(validDayNumbers);
  expect(topics.map(topic => topic.slug)).toEqual(['claude-code', 'dev-tooling']);
  expect(topics.every(topic => daysForTopic(topic.slug, validDayNumbers).length > 0)).toBe(true);
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

test('the taxonomy keeps an entry point for newcomers', () => {
  expect(topicBySlug('beginner')).toBeDefined();
  expect(daysForTopic('beginner').length).toBeGreaterThan(0);
});

test('topic slugs are unique', () => {
  const slugs = allTopics().map(topic => topic.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});

test('every tagged day carries at least one known topic slug', () => {
  const known = new Set(allTopics().map(topic => topic.slug));
  const broken = Object.entries(DAY_TOPICS).filter(
    ([, slugs]) => slugs.length === 0 || slugs.some(slug => !known.has(slug)),
  );
  expect(broken).toEqual([]);
});

test('every topic is backed by at least one day', () => {
  const orphans = allTopics().filter(topic => daysForTopic(topic.slug).length === 0);
  expect(orphans.map(topic => topic.slug)).toEqual([]);
});

test('every day in 100days/content is categorized', () => {
  const dayNumbers = fs.readdirSync(CONTENT_DIR)
    .filter(name => /^day\d+$/.test(name))
    .filter(name => fs.existsSync(path.join(CONTENT_DIR, name, 'source.md')))
    .map(name => parseInt(name.slice(3), 10));

  expect(dayNumbers.length).toBeGreaterThan(0);
  const untagged = dayNumbers.filter(n => topicsForDay(n).length === 0).sort((a, b) => a - b);
  expect(untagged).toEqual([]);
});
