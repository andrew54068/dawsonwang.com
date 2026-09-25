// Canonical off-site profile URLs for the real-world Dawson Wang.
// Rendered into the root-graph Person JSON-LD as `sameAs` for Knowledge Graph
// entity-linking. Add new verified profiles here; no edits needed in `src/lib/seo.ts`.
//
// Each entry MUST be an absolute canonical profile URL pointing at Dawson's
// real account on that platform (no UTM, tracking params, or redirects).
export const PERSON_SAME_AS_URLS: readonly string[] = [
  'https://github.com/andrew54068',
];

// Canonical X / Twitter profile used for social-card attribution meta tags.
// Keep the handle and URL together here so BaseLayout and future profile graph
// enrichments read from a single source of truth.
export const PERSON_X_URL = 'https://x.com/dawson54068';
export const PERSON_X_HANDLE = '@dawson54068';
