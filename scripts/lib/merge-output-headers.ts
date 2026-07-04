// Merge `vercel.json` `headers` rules into a Vercel Build Output API v3 config.json.
//
// Why this exists: the site's security headers (CSP, X-Frame-Options, …) live in
// `vercel.json`. Vercel's Git-integration build (and `vercel build`) compile those
// into `.vercel/output/config.json` automatically — but a bare `astro build`
// (which the GitHub-free local deploy uses to avoid the vercel-install.sh hook)
// does NOT. Deploying that output with `vercel deploy --prebuilt` would therefore
// silently drop every security header. This module re-inserts them as Build Output
// API header routes so a prebuilt deploy keeps the exact same headers.

export interface VercelHeaderKV {
  key: string;
  value: string;
}

export interface VercelHeaderRule {
  source: string;
  headers: VercelHeaderKV[];
}

export interface VercelJson {
  headers?: VercelHeaderRule[];
}

export interface BuildOutputRoute {
  src?: string;
  headers?: Record<string, string>;
  continue?: boolean;
  handle?: string;
  dest?: string;
  [k: string]: unknown;
}

export interface BuildOutputConfig {
  version: number;
  routes?: BuildOutputRoute[];
  [k: string]: unknown;
}

/**
 * Anchor a `vercel.json` header `source` (path-to-regexp) as a Build Output API
 * `src` regex. Vercel's own compiler anchors sources, so we do the same; an
 * already-anchored src is returned unchanged. The site uses only `/(.*)`, which
 * becomes `^/(.*)$` — a valid regex matching every path.
 */
export function toBuildOutputSrc(source: string): string {
  let s = source.trim();
  if (!s.startsWith('^')) s = '^' + s;
  if (!s.endsWith('$')) s = s + '$';
  return s;
}

/** Turn one vercel.json header rule into a Build Output API header route. */
export function headerRouteFrom(rule: VercelHeaderRule): BuildOutputRoute {
  const headers: Record<string, string> = {};
  for (const h of rule.headers) headers[h.key] = h.value;
  return { src: toBuildOutputSrc(rule.source), headers, continue: true };
}

function routeKey(r: BuildOutputRoute): string {
  return JSON.stringify({ src: r.src, headers: r.headers });
}

/**
 * Prepend a header route for each `vercel.json` rule to config.routes. Header
 * routes carry `continue: true` so headers are applied and routing proceeds to
 * the existing filesystem/handler routes. Idempotent: a rule already present
 * (same src + headers) is skipped, so re-running the deploy never duplicates.
 *
 * Returns the new config plus how many routes were actually added.
 */
export function mergeVercelHeadersIntoConfig(
  vercelJson: VercelJson,
  config: BuildOutputConfig,
): { config: BuildOutputConfig; added: number } {
  const rules = vercelJson.headers ?? [];
  const routes: BuildOutputRoute[] = Array.isArray(config.routes) ? [...config.routes] : [];
  if (rules.length === 0) return { config: { ...config, routes }, added: 0 };

  const existing = new Set(routes.filter((r) => r && r.headers && r.continue).map(routeKey));
  const toPrepend: BuildOutputRoute[] = [];
  for (const rule of rules) {
    const route = headerRouteFrom(rule);
    if (existing.has(routeKey(route))) continue;
    toPrepend.push(route);
    existing.add(routeKey(route));
  }
  return { config: { ...config, routes: [...toPrepend, ...routes] }, added: toPrepend.length };
}
