import { expect, test } from 'vitest';
import { ARTICLE_TYPES, FRESHNESS, classificationForDay, matchesArticleFilters, parseArticleFilters, articleFilterQuery } from '../src/lib/article-taxonomy';

test('article types and freshness are separate vocabularies', () => {
  expect(ARTICLE_TYPES).toHaveLength(7);
  expect(FRESHNESS).toHaveLength(3);
  expect(ARTICLE_TYPES.find(t => t.slug === 'fundamentals')?.title).toBe('基本觀念');
});

test('filter URLs ignore invalid values and deduplicate valid values', () => {
  expect(parseArticleFilters(new URLSearchParams('type=fundamentals&type=bogus&type=fundamentals&topic=local-llm&freshness=evergreen&q= 量化 '))).toEqual({
    types: ['fundamentals'], topics: ['local-llm'], freshness: ['evergreen'], query: '量化',
  });
  const filters = parseArticleFilters(new URLSearchParams('type=methods&type=fundamentals&topic=security&q=權限'));
  expect(parseArticleFilters(new URLSearchParams(articleFilterQuery(filters)))).toEqual(filters);
});

test('filter values are case sensitive and search input is bounded', () => {
  const filters = parseArticleFilters(new URLSearchParams(`type=Fundamentals&topic=<script>&q=${'a'.repeat(250)}`));
  expect(filters.types).toEqual([]);
  expect(filters.topics).toEqual([]);
  expect(filters.query).toHaveLength(200);
});

const record = { dayNumber: 1, title: 'Q4 Q8 FP16 差在哪', topics: ['local-llm', 'model-fundamentals'], types: ['fundamentals'], freshness: ['evergreen', 'versioned'] };
const empty = { types: [], topics: [], freshness: [], query: '' };

test('OR within an axis and AND between axes, including mixed freshness', () => {
  expect(matchesArticleFilters(record, { ...empty, types: ['fundamentals', 'tools'], topics: ['security', 'local-llm'], freshness: ['evergreen'] })).toBe(true);
  expect(matchesArticleFilters(record, { ...empty, types: ['tools'], topics: ['local-llm'] })).toBe(false);
  expect(matchesArticleFilters(record, { ...empty, freshness: ['versioned'], query: 'fp16' })).toBe(true);
  expect(matchesArticleFilters(record, { ...empty, query: '不存在' })).toBe(false);
});

test('new articles without editorial tags remain visible without inventing long-term value', () => {
  expect(classificationForDay(99999)).toBeUndefined();
  const unreviewed = { dayNumber: 99999, title: '新文章', topics: ['agents'], types: [], freshness: [] };
  expect(matchesArticleFilters(unreviewed, empty)).toBe(true);
  expect(matchesArticleFilters(unreviewed, { ...empty, freshness: ['evergreen'] })).toBe(false);
  expect(matchesArticleFilters(unreviewed, { ...empty, topics: ['agents'] })).toBe(true);
});
