import { test, expect, describe } from 'vitest';
import {
  parseSearchParams,
  buildSearchQuery,
  buildSearchUrl,
  normalizeMode,
  DEFAULT_SEARCH_MODE,
} from '../src/lib/search-params';

describe('parseSearchParams', () => {
  test('reads the canonical ?q= used by the SearchAction JSON-LD', () => {
    expect(parseSearchParams('?q=automation')).toEqual({ query: 'automation', mode: 'keyword' });
  });

  test('accepts ?keywords= and ?query= aliases', () => {
    expect(parseSearchParams('?keywords=prompt').query).toBe('prompt');
    expect(parseSearchParams('?query=prompt').query).toBe('prompt');
  });

  test('q wins when a link carries both q and keywords', () => {
    expect(parseSearchParams('?keywords=second&q=first').query).toBe('first');
  });

  test('skips blank aliases and falls through to the next key', () => {
    expect(parseSearchParams('?q=&keywords=mcp').query).toBe('mcp');
    expect(parseSearchParams('?q=%20%20&keywords=mcp').query).toBe('mcp');
  });

  test('decodes and trims non-ASCII queries', () => {
    expect(parseSearchParams('?keywords=%20%E8%87%AA%E5%8B%95%E5%8C%96%20').query).toBe('自動化');
  });

  test('reads the search type from ?mode= or ?type=', () => {
    expect(parseSearchParams('?q=a&mode=semantic').mode).toBe('semantic');
    expect(parseSearchParams('?q=a&type=semantic').mode).toBe('semantic');
    expect(parseSearchParams('?q=a&mode=keyword').mode).toBe('keyword');
  });

  test('unknown or missing mode falls back to keyword', () => {
    expect(parseSearchParams('?q=a').mode).toBe(DEFAULT_SEARCH_MODE);
    expect(parseSearchParams('?q=a&mode=fuzzy').mode).toBe('keyword');
  });

  test('empty search string yields an empty keyword state', () => {
    expect(parseSearchParams('')).toEqual({ query: '', mode: 'keyword' });
  });

  test('accepts a URLSearchParams instance', () => {
    const params = new URLSearchParams({ keywords: 'agent', type: 'semantic' });
    expect(parseSearchParams(params)).toEqual({ query: 'agent', mode: 'semantic' });
  });
});

describe('normalizeMode', () => {
  test('semantic aliases are case- and whitespace-insensitive', () => {
    for (const raw of [' Semantic ', 'SEM', 'vector', 'ai', '語意']) {
      expect(normalizeMode(raw)).toBe('semantic');
    }
  });

  test('anything else is keyword', () => {
    for (const raw of [null, undefined, '', 'keyword', 'kw', 'nonsense']) {
      expect(normalizeMode(raw)).toBe('keyword');
    }
  });
});

describe('buildSearchQuery', () => {
  test('omits mode at the default so keyword links stay short', () => {
    expect(buildSearchQuery({ query: 'automation', mode: 'keyword' })).toBe('?q=automation');
  });

  test('includes mode when semantic', () => {
    expect(buildSearchQuery({ query: 'automation', mode: 'semantic' })).toBe(
      '?q=automation&mode=semantic',
    );
  });

  test('keeps a bare mode when there is no query yet', () => {
    expect(buildSearchQuery({ query: '', mode: 'semantic' })).toBe('?mode=semantic');
  });

  test('empty default state produces no query string', () => {
    expect(buildSearchQuery({})).toBe('');
    expect(buildSearchQuery({ query: '   ', mode: 'keyword' })).toBe('');
  });

  test('percent-encodes the query', () => {
    expect(buildSearchQuery({ query: '自動化' })).toBe('?q=%E8%87%AA%E5%8B%95%E5%8C%96');
  });
});

describe('buildSearchUrl', () => {
  test('defaults to the /search path', () => {
    expect(buildSearchUrl({ query: 'mcp', mode: 'semantic' })).toBe('/search?q=mcp&mode=semantic');
  });

  test('accepts an absolute base for a copyable share link', () => {
    expect(buildSearchUrl({ query: 'mcp' }, 'https://www.dawsonwang.com/search')).toBe(
      'https://www.dawsonwang.com/search?q=mcp',
    );
  });
});

test('round-trips: a built URL parses back to the same state', () => {
  for (const state of [
    { query: 'claude code', mode: 'keyword' as const },
    { query: '自動化 & prompt 設計', mode: 'semantic' as const },
  ]) {
    const url = buildSearchUrl(state);
    expect(parseSearchParams(url.slice(url.indexOf('?')))).toEqual(state);
  }
});
