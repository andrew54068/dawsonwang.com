import { PERSON_SAME_AS_URLS, PERSON_X_HANDLE, PERSON_X_URL } from '../data/profiles';

const personSameAsUrls = Array.from(new Set([...PERSON_SAME_AS_URLS, PERSON_X_URL]));

export const SITE_URL = 'https://dawsonwang.com';
export const SITE_NAME = 'Dawson Wang';
export const SITE_LOCALE = 'zh_TW';
export const SITE_LANGUAGE = 'zh-Hant-TW';
export const DEFAULT_DESCRIPTION = 'Dawson Wang — 幫台灣團隊把 AI 工具落地到實際工作流。9 年新創軟體開發經驗，從 PoC、客製 agent workflow 到團隊培訓與上線交付。';
export const DEFAULT_OG_IMAGE = '/og-default.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_ALT = 'Dawson Wang — AI 工具落地實踐者';
export const SOCIAL_X_HANDLE = PERSON_X_HANDLE;

export function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, SITE_URL).toString();
}

// Escape exactly the same five characters Astro / the BaseLayout writer escapes
// when interpolating description values into HTML `content="…"` attributes. Kept
// local to seo.ts so the budgeting logic and the escape rule are co-located —
// any future drift in either has to be made in one place.
function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

// Budget descriptions against their HTML-encoded length, not their decoded
// character count. The value returned here is later inserted into HTML
// `content="…"` attributes where `"` becomes `&quot;` (5 chars), `&` becomes
// `&amp;`, `<` / `>` / `'` similarly inflate. A decoded-only budget silently
// blew the Google SERP ~160-char ceiling on day posts containing ASCII quotes
// (issue #166). maxLength is now treated as a ceiling on the *rendered* HTML
// length: short / quote-free text behaves identically to before (the encoded
// length equals the decoded length); text with escapeable characters is
// truncated further so the rendered attribute stays within budget.
export function cleanDescription(value: string, maxLength = 155) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (escapeHtmlAttribute(compact).length <= maxLength) return compact;

  // Truncate the source string until the *escaped* result, plus a trailing
  // ellipsis (1 char), fits the budget. Walk back from `maxLength` so the
  // happy path (no escapeable chars in the kept prefix) costs one slice; with
  // escapeable chars we may shed a few more source chars per `&quot;`.
  const ellipsis = '…';
  let cut = Math.min(compact.length, maxLength - 1);
  while (cut > 0 && escapeHtmlAttribute(compact.slice(0, cut)).length + ellipsis.length > maxLength) {
    cut -= 1;
  }
  // Mirror the existing trailing-punctuation cleanup so we don't end on a
  // comma / fullwidth period / semicolon / colon / whitespace before the
  // ellipsis. The regex is intentionally identical to the prior behaviour.
  const trimmed = compact.slice(0, cut).replace(/[，。、,;；:\s]+$/u, '');
  return `${trimmed}${ellipsis}`;
}

export function canonicalPath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function jsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export interface BreadcrumbCrumb {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(crumbs: BreadcrumbCrumb[], pageId?: string) {
  // Optional pageId carries the absolute URL of the page emitting this breadcrumb.
  // When provided, the BreadcrumbList gets `@id: ${pageId}#breadcrumb` so the
  // page-level node (Article / CollectionPage / SearchResultsPage) can reference
  // it via schema.org's canonical `breadcrumb` property — closes the graph-orphan.
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(pageId ? { '@id': `${pageId}#breadcrumb` } : {}),
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  };
}

export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: 'Dawson Wang',
  url: SITE_URL,
  image: absoluteUrl('/dawson.webp'),
  jobTitle: 'AI workflow implementation consultant',
  description: DEFAULT_DESCRIPTION,
  knowsLanguage: ['zh-Hant-TW', 'en'],
  knowsAbout: [
    'AI workflow implementation',
    'Claude Code',
    'MCP server',
    'Agent workflow',
    'Full-stack software development',
    'Developer relations',
  ],
  // Bidirectional root-graph link: Person ↔ WebSite. WebSite.publisher/mainEntity/copyrightHolder
  // all point at #person; this is the reverse edge declaring the WebSite as the Person's
  // canonical page. Data-independent helper enrichment — see website-seo-optimization skill
  // "Root-graph enrichment technique".
  mainEntityOfPage: { '@id': `${SITE_URL}/#website` },
  // Knowledge Graph entity-linking: canonical off-site profile URLs sourced from
  // src/data/profiles.ts. Tells search engines this Person entity is the same real-world
  // person behind those external profiles. Extend src/data/profiles.ts to add more.
  sameAs: personSameAsUrls,
};

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'zh-Hant-TW',
  publisher: { '@id': `${SITE_URL}/#person` },
  // Schema.org canonical signal that this personal site is *primarily about* its owner.
  // Stronger than `publisher` alone (which only declares who publishes content).
  mainEntity: { '@id': `${SITE_URL}/#person` },
  copyrightHolder: { '@id': `${SITE_URL}/#person` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};
