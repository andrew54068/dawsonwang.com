export interface SearchFallbackDoc {
  day: number;
  subtitle: string;
  body: string;
}

export type SearchFallbackMatchSource = 'subtitle' | 'body' | 'subtitle+body';

export interface SearchFallbackHit {
  day: number;
  subtitle: string;
  excerpt: string;
  matchSource: SearchFallbackMatchSource;
  score: number;
}

const EXCERPT_RADIUS = 48;
const EXCERPT_MAX = 140;

function normalizeNfkc(value: string): string {
  const normalize = (String.prototype as { normalize?: (this: string, form?: string) => string }).normalize;
  return normalize ? normalize.call(value, 'NFKC') : value;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeSearchText(value: string): string {
  return normalizeNfkc(compactWhitespace(value)).toLowerCase();
}

function caseInsensitiveIndexOf(haystack: string, needle: string): number {
  return haystack.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
}

function buildExcerpt(body: string, query: string): string {
  const compactBody = compactWhitespace(body);
  if (!compactBody) return '';

  const compactQuery = compactWhitespace(query);
  let index = compactQuery ? caseInsensitiveIndexOf(compactBody, compactQuery) : -1;

  if (index === -1) {
    const normalizedBody = normalizeSearchText(compactBody);
    const normalizedQuery = normalizeSearchText(compactQuery);
    if (normalizedQuery) index = normalizedBody.indexOf(normalizedQuery);
  }

  if (index === -1) {
    return compactBody.length > EXCERPT_MAX ? `${compactBody.slice(0, EXCERPT_MAX - 1)}…` : compactBody;
  }

  const sliceStart = Math.max(0, index - EXCERPT_RADIUS);
  const sliceEnd = Math.min(compactBody.length, index + compactQuery.length + EXCERPT_RADIUS);
  const prefix = sliceStart > 0 ? '…' : '';
  const suffix = sliceEnd < compactBody.length ? '…' : '';
  return `${prefix}${compactBody.slice(sliceStart, sliceEnd).trim()}${suffix}`;
}

function coerceDoc(value: unknown): SearchFallbackDoc | null {
  if (!value || typeof value !== 'object') return null;

  const doc = value as Record<string, unknown>;
  const day = Number(doc.day);
  const subtitle = typeof doc.subtitle === 'string' ? compactWhitespace(doc.subtitle) : '';
  const body = typeof doc.body === 'string' ? compactWhitespace(doc.body) : '';

  if (!isFinite(day) || day <= 0 || !subtitle || !body) return null;
  return { day, subtitle, body };
}

export function serializeSearchFallbackIndex(docs: SearchFallbackDoc[]): string {
  const normalizedDocs = docs
    .map((doc) => coerceDoc(doc))
    .filter((doc): doc is SearchFallbackDoc => Boolean(doc));
  return JSON.stringify(normalizedDocs).replace(/</g, '\\u003c');
}

export function parseSearchFallbackIndexJson(json: string): SearchFallbackDoc[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => coerceDoc(entry))
      .filter((entry): entry is SearchFallbackDoc => Boolean(entry));
  } catch {
    return [];
  }
}

export function runSearchFallback(
  docs: SearchFallbackDoc[],
  query: string,
  limit = 15,
): SearchFallbackHit[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const hits = docs
    .map((doc) => {
      const normalizedSubtitle = normalizeSearchText(doc.subtitle);
      const normalizedBody = normalizeSearchText(doc.body);
      const subtitleIndex = normalizedSubtitle.indexOf(normalizedQuery);
      const bodyIndex = normalizedBody.indexOf(normalizedQuery);
      const subtitleMatch = subtitleIndex !== -1;
      const bodyMatch = bodyIndex !== -1;

      if (!subtitleMatch && !bodyMatch) return null;

      let score = 0;
      if (subtitleMatch) score += 200 + Math.max(0, 40 - subtitleIndex);
      if (bodyMatch) score += 80 + Math.max(0, 20 - bodyIndex);

      return {
        day: doc.day,
        subtitle: doc.subtitle,
        excerpt: buildExcerpt(doc.body, query),
        matchSource: subtitleMatch && bodyMatch
          ? 'subtitle+body'
          : subtitleMatch
            ? 'subtitle'
            : 'body',
        score,
      } satisfies SearchFallbackHit;
    })
    .filter((entry): entry is SearchFallbackHit => Boolean(entry));

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.day - a.day;
  });

  return hits.slice(0, limit);
}
