/**
 * Same-origin guard for API routes.
 *
 * Server-to-server callers (curl, scripts) can spoof Origin trivially, so this
 * is not a security boundary on its own — it's a cost-control measure that
 * blocks the realistic abuse pattern (a third-party page calling our endpoints
 * from a browser, where the browser sets Origin honestly).
 *
 * For real rate limiting, layer a persistent KV-backed limiter on top.
 */

function parseHost(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

let cachedAllowed: Set<string> | null = null;
function allowedHosts(): Set<string> {
  if (cachedAllowed) return cachedAllowed;
  const raw =
    import.meta.env.ALLOWED_ORIGINS ??
    'https://dawsonwang.com,https://www.dawsonwang.com';
  const hosts = raw
    .split(',')
    .map((s: string) => parseHost(s.trim()))
    .filter((h: string | null): h is string => !!h);
  cachedAllowed = new Set(hosts);
  return cachedAllowed;
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  const host = parseHost(origin);
  if (!host) return false;
  return allowedHosts().has(host);
}

/** Trustworthy client IP. On Vercel, Astro populates clientAddress from
 *  x-real-ip / x-vercel-forwarded-for which are not client-spoofable. The
 *  request-header fallback exists for local dev and tests only. */
export function trustedClientIp(
  clientAddress: string | null | undefined,
  request: Request,
): string {
  if (clientAddress) return clientAddress;
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}
