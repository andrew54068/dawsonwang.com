/**
 * Shareable /search URL state.
 *
 * `q` stays canonical because it is baked into the WebSite / SearchResultsPage
 * SearchAction JSON-LD (see lib/seo.ts). `keywords` and `query` are accepted on
 * read so a hand-typed or hand-edited link still lands on a populated result set.
 */

export type SearchMode = 'keyword' | 'semantic';

export const DEFAULT_SEARCH_MODE: SearchMode = 'keyword';

export interface SearchState {
  query: string;
  mode: SearchMode;
}

/** First match wins, so a link carrying both `q` and `keywords` resolves to `q`. */
const QUERY_KEYS = ['q', 'keywords', 'query'] as const;
const MODE_KEYS = ['mode', 'type'] as const;

const SEMANTIC_ALIASES = new Set([
  'semantic',
  'sem',
  'meaning',
  'vector',
  'embedding',
  'ai',
  '語意',
]);

export function normalizeMode(raw: string | null | undefined): SearchMode {
  if (!raw) return DEFAULT_SEARCH_MODE;
  return SEMANTIC_ALIASES.has(raw.trim().toLowerCase()) ? 'semantic' : DEFAULT_SEARCH_MODE;
}

function toParams(input: string | URLSearchParams): URLSearchParams {
  return typeof input === 'string' ? new URLSearchParams(input) : input;
}

function firstValue(params: URLSearchParams, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && value.trim()) return value.trim();
  }
  return null;
}

/** `?keywords=自動化&type=semantic` -> `{ query: '自動化', mode: 'semantic' }` */
export function parseSearchParams(input: string | URLSearchParams): SearchState {
  const params = toParams(input);
  return {
    query: firstValue(params, QUERY_KEYS) ?? '',
    mode: normalizeMode(firstValue(params, MODE_KEYS)),
  };
}

/**
 * Canonical query string for a search state, `''` when there is nothing worth
 * sharing. `mode` is omitted at the default so plain keyword links stay short.
 */
export function buildSearchQuery(state: Partial<SearchState>): string {
  const query = state.query?.trim() ?? '';
  const mode = state.mode ?? DEFAULT_SEARCH_MODE;
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (mode !== DEFAULT_SEARCH_MODE) params.set('mode', mode);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/** `/search?q=…&mode=semantic` — pass an absolute `base` for a copyable link. */
export function buildSearchUrl(state: Partial<SearchState>, base = '/search'): string {
  return `${base}${buildSearchQuery(state)}`;
}
