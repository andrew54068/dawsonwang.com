# Campaign and QR Attribution Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Capture whitelisted UTM attribution in the browsing session and attach it to pageviews, link-hub clicks, and successful inquiry events.

**Architecture:** Add a pure attribution module that parses the four supported UTM keys, stores first-touch and last-touch state in sessionStorage, and flattens the state into scalar analytics properties. Extend the existing analytics client/API rather than adding a second transport; self-hosted analytics receives full flattened attribution, while Vercel custom events receive compact event-specific data that fits the lowest paid provider limit.

**Tech Stack:** Astro 6, TypeScript, Vitest, Yarn 4, existing Vercel/self-hosted analytics adapters.

## Global Constraints

- Accept exactly utm_source, utm_medium, utm_campaign, and utm_content.
- Reject empty values and values longer than 100 characters.
- Store only first-party session state under dw_attribution; do not set a server-readable cookie.
- Preserve first-touch values and replace last-touch values when a new tagged URL is visited.
- Keep analytics properties scalar and exclude inquiry form contents and personally identifying fields.
- Keep Vercel custom-event data to at most two scalar properties; Vercel event names, custom keys, and scalar values must be no longer than 255 characters.
- Keep the no-JavaScript inquiry fallback unchanged.
- Do not add durable analytics storage in this change; the current self-hosted endpoint continues to log validated events.

---

### Task 1: Add the pure attribution state module

**Files:**
- Create: src/lib/analytics-attribution.ts
- Create: tests/analytics-attribution.test.ts

**Interfaces:**
- Produces ATTRIBUTION_STORAGE_KEY, captureAttribution(search, storage), and toAnalyticsProperties(state).
- captureAttribution returns { state: AttributionState, hasIncoming: boolean }.
- AttributionState contains firstTouch and lastTouch objects keyed only by the four supported UTM names.

- [ ] Step 1: Write the failing attribution tests

Create tests/analytics-attribution.test.ts:

~~~ts
import { describe, expect, test } from 'vitest';
import {
  ATTRIBUTION_STORAGE_KEY,
  captureAttribution,
  toAnalyticsProperties,
} from '../src/lib/analytics-attribution';

function storage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; },
  };
}

describe('analytics attribution', () => {
  test('parses only supported UTM values and rejects empty or oversized values', () => {
    const result = captureAttribution(
      \`?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta&email=person%40example.com&utm_term=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\`,
      storage(),
    );

    expect(result.hasIncoming).toBe(true);
    expect(result.state.firstTouch).toEqual({
      utm_source: 'qr',
      utm_medium: 'offline',
      utm_campaign: '2026-talk',
      utm_content: 'slide-cta',
    });
    expect(result.state.lastTouch).toEqual(result.state.firstTouch);
  });

  test('preserves first touch and updates last touch across tagged visits', () => {
    const store = storage();
    const first = captureAttribution('?utm_source=qr&utm_campaign=talk', store);
    const untagged = captureAttribution('/links', store);
    const later = captureAttribution('?utm_source=threads&utm_medium=social', store);

    expect(first.state.firstTouch).toEqual({ utm_source: 'qr', utm_campaign: 'talk' });
    expect(untagged.hasIncoming).toBe(false);
    expect(untagged.state).toEqual(first.state);
    expect(later.state.firstTouch).toEqual(first.state.firstTouch);
    expect(later.state.lastTouch).toEqual({
      utm_source: 'threads',
      utm_medium: 'social',
    });
  });

  test('ignores malformed or unavailable storage without throwing', () => {
    const brokenStorage = {
      getItem: () => '{not-json',
      setItem: () => { throw new Error('storage blocked'); },
    };

    expect(() => captureAttribution('?utm_source=qr', brokenStorage)).not.toThrow();
    expect(captureAttribution('?utm_source=qr', brokenStorage).state.firstTouch).toEqual({
      utm_source: 'qr',
    });
  });

  test('flattens first and last touch state into analytics properties', () => {
    const state = captureAttribution(
      '?utm_source=qr&utm_medium=offline&utm_content=badge',
      storage(),
    ).state;

    expect(toAnalyticsProperties(state)).toEqual({
      attribution_first_source: 'qr',
      attribution_first_medium: 'offline',
      attribution_first_content: 'badge',
      attribution_last_source: 'qr',
      attribution_last_medium: 'offline',
      attribution_last_content: 'badge',
    });
  });

  test('uses the namespaced storage key', () => {
    const writes: string[] = [];
    const store = {
      getItem: (key: string) => {
        expect(key).toBe(ATTRIBUTION_STORAGE_KEY);
        return null;
      },
      setItem: (key: string, value: string) => {
        expect(key).toBe(ATTRIBUTION_STORAGE_KEY);
        writes.push(value);
      },
    };

    captureAttribution('?utm_source=qr', store);
    expect(writes).toHaveLength(1);
  });
});
~~~

- [ ] Step 2: Run the new test and verify it fails because the module is absent

Run:

~~~bash
yarn vitest run tests/analytics-attribution.test.ts
~~~

Expected: FAIL with a module-resolution error for src/lib/analytics-attribution.

- [ ] Step 3: Implement the minimal pure attribution module

Create src/lib/analytics-attribution.ts:

~~~ts
export const ATTRIBUTION_STORAGE_KEY = 'dw_attribution';
const MAX_VALUE_LENGTH = 100;

const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type AttributionValues = Partial<Record<AttributionKey, string>>;

export interface AttributionState {
  firstTouch: AttributionValues;
  lastTouch: AttributionValues;
}

export interface AttributionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function clean(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_VALUE_LENGTH ? trimmed : undefined;
}

function parseValues(search: string): AttributionValues {
  const values: AttributionValues = {};
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return values;
  }

  for (const key of ATTRIBUTION_KEYS) {
    const value = clean(params.get(key));
    if (value) values[key] = value;
  }
  return values;
}

function isValues(value: unknown): value is AttributionValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, entry]) => (
    ATTRIBUTION_KEYS.includes(key as AttributionKey)
    && typeof entry === 'string'
    && clean(entry) !== undefined
  ));
}

function readState(storage?: AttributionStorage | null): AttributionState {
  if (!storage) return { firstTouch: {}, lastTouch: {} };
  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return { firstTouch: {}, lastTouch: {} };
    const parsed = JSON.parse(raw) as { firstTouch?: unknown; lastTouch?: unknown };
    return {
      firstTouch: isValues(parsed.firstTouch) ? parsed.firstTouch : {},
      lastTouch: isValues(parsed.lastTouch) ? parsed.lastTouch : {},
    };
  } catch {
    return { firstTouch: {}, lastTouch: {} };
  }
}

export function captureAttribution(
  search: string,
  storage?: AttributionStorage | null,
): { state: AttributionState; hasIncoming: boolean } {
  const incoming = parseValues(search);
  const hasIncoming = Object.keys(incoming).length > 0;
  const existing = readState(storage);
  if (!hasIncoming) return { state: existing, hasIncoming: false };

  const state: AttributionState = {
    firstTouch: Object.keys(existing.firstTouch).length > 0 ? existing.firstTouch : incoming,
    lastTouch: incoming,
  };

  try {
    storage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage failures must not affect page rendering or analytics.
  }

  return { state, hasIncoming: true };
}

export function toAnalyticsProperties(state: AttributionState): Record<string, string> {
  const properties: Record<string, string> = {};
  for (const [touch, values] of [['first', state.firstTouch], ['last', state.lastTouch]] as const) {
    for (const [key, value] of Object.entries(values)) {
      const shortKey = key.replace(/^utm_/, '');
      properties['attribution_' + touch + '_' + shortKey] = value;
    }
  }
  return properties;
}
~~~

- [ ] Step 4: Run the attribution tests and verify they pass

Run:

~~~bash
yarn vitest run tests/analytics-attribution.test.ts
~~~

Expected: PASS with 5 tests.

- [ ] Step 5: Commit the pure module

~~~bash
git add src/lib/analytics-attribution.ts tests/analytics-attribution.test.ts
git commit -m "feat: capture session campaign attribution"
~~~

### Task 2: Attach attribution to the analytics client and API

**Files:**
- Modify: src/lib/analytics-client.ts
- Modify: src/pages/api/analytics.ts
- Modify: tests/analytics.test.ts
- Modify: tests/analytics-route.test.ts

**Interfaces:**
- AnalyticsApiDependencies gains optional attribution: Record<string, string>.
- createAnalyticsApi merges full attribution into self-hosted custom events and self-hosted pageviews.
- createAnalyticsApi keeps the existing Vercel pageview dispatch shape and compacts Vercel custom events to at most two scalar properties.
- Vercel link_click data is exactly link_id and placement; Vercel landing_attribution and inquiry_submit use compact utm_source and utm_content values derived from last/incoming attribution when present.
- installAnalytics captures targetWindow.location.search using targetWindow.sessionStorage.

- [ ] Step 1: Write failing analytics assertions

Add these assertions to tests/analytics.test.ts:

~~~ts
  test('merges attribution into self-hosted pageviews and custom events', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'self-hosted' }), {
      fetchImpl: fetchMock,
      navigatorImpl: undefined,
      path: '/links?utm_source=qr',
      href: 'https://dawsonwang.com/links?utm_source=qr',
      referrer: '',
      title: 'Links | Dawson Wang',
      attribution: { attribution_first_source: 'qr' },
    });

    api.pageview();
    api.event('link_click', { link_id: 'threads' });

    const pageviewBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const eventBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(pageviewBody.properties).toEqual({ attribution_first_source: 'qr' });
    expect(eventBody.properties).toEqual({
      attribution_first_source: 'qr',
      link_id: 'threads',
    });
  });
~~~

Add a tagged Vercel installation test using the existing fake environment:

~~~ts
  test('emits one compact landing attribution event for a tagged Vercel visit', () => {
    const { targetWindow, targetDocument, va } = fakeEnvironment();
    targetWindow.location.search = '?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta';
    targetWindow.location.href = 'https://dawsonwang.com/links?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta';

    installAnalytics(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' }), targetWindow, targetDocument);

    expect(va).toHaveBeenCalledWith('event', {
      name: 'landing_attribution',
      data: {
        utm_source: 'qr',
        utm_content: 'slide-cta',
      },
    });
    const payload = va.mock.calls[0]?.[1] as { data?: Record<string, unknown> };
    expect(Object.keys(payload.data ?? {})).toHaveLength(2);
  });
~~~

Add Vercel custom event cap tests to prove a populated first/last attribution state never creates more than two custom properties, link_click keeps exactly link_id and placement, inquiry_submit omits placement/form-like fields and uses compact utm_source/utm_content, and long Vercel custom values are capped at 255 characters.

Add this pageview-properties assertion to tests/analytics-route.test.ts:

~~~ts
  test('accepts scalar attribution properties on pageviews', async () => {
    const res = await POST({
      request: buildRequest({
        type: 'pageview',
        path: '/links?utm_source=qr',
        url: 'https://dawsonwang.com/links?utm_source=qr',
        properties: { attribution_first_source: 'qr' },
      }),
    } as any);

    expect(res.status).toBe(202);
    expect(String(infoSpy.mock.calls[0]?.[1] ?? '')).toContain('attribution_first_source');
  });
~~~

- [ ] Step 2: Run the focused analytics tests and verify the new assertions fail

Run:

~~~bash
yarn vitest run tests/analytics.test.ts tests/analytics-route.test.ts
~~~

Expected: FAIL because attribution is not a dependency field, tagged installs do not emit compact landing_attribution, Vercel custom events are not capped, and pageview properties are not forwarded by the API.

- [ ] Step 3: Extend analytics-client.ts with attribution context

Implement the following changes:

~~~ts
import { captureAttribution, toAnalyticsProperties } from './analytics-attribution';

export interface AnalyticsApiDependencies {
  // existing fields remain unchanged
  attribution?: Record<string, string>;
}
~~~

Inside createAnalyticsApi, keep the full self-hosted attribution merge before sanitizing:

~~~ts
const withAttribution = (properties?: AnalyticsEventProperties) => (
  sanitizeProperties({ ...deps.attribution, ...properties })
);
~~~

Use withAttribution(properties) for self-hosted custom events. In the self-hosted pageview body, add properties: withAttribution(). Leave the Vercel pageview dispatch shape unchanged.

Add a separate Vercel custom-event compaction path:

~~~ts
const VERCEL_MAX_CUSTOM_PROPERTIES = 2;
const VERCEL_MAX_CUSTOM_LENGTH = 255;

// link_click: compact to link_id and placement.
// landing_attribution and inquiry_submit: compact to utm_source and utm_content.
// Other Vercel custom events: keep at most two sanitized scalar properties, using compact attribution only when budget remains.
~~~

Inside installAnalytics, capture the session state before createAnalyticsApi:

~~~ts
const storage = (() => {
  try {
    return targetWindow.sessionStorage;
  } catch {
    return undefined;
  }
})();
const captured = captureAttribution(targetWindow.location.search, storage);
const attribution = toAnalyticsProperties(captured.state);
~~~

Pass attribution into createAnalyticsApi. After assigning targetWindow.dwAnalytics, emit the provider-specific landing event:

~~~ts
if (config.provider === 'vercel' && captured.hasIncoming) {
  api.event('landing_attribution');
}
~~~

- [ ] Step 4: Update the API validator to accept pageview properties

In validatePayload in src/pages/api/analytics.ts, parse properties before the type branches:

~~~ts
const properties = body.properties === undefined ? undefined : body.properties;
if (properties !== undefined && !isAnalyticsProperties(properties)) return null;
~~~

Return properties from both pageview and event payloads:

~~~ts
if (type === 'pageview') {
  return { type, path, url, referrer, title, sentAt, properties };
}
~~~

Remove the event-only property validation because the shared validation now covers both branches.

- [ ] Step 5: Run the focused analytics tests and verify they pass

Run:

~~~bash
yarn vitest run tests/analytics.test.ts tests/analytics-route.test.ts tests/analytics-attribution.test.ts
~~~

Expected: PASS with all attribution and analytics transport assertions passing.

- [ ] Step 6: Commit the analytics transport changes

~~~bash
git add src/lib/analytics-client.ts src/pages/api/analytics.ts tests/analytics.test.ts tests/analytics-route.test.ts
git commit -m "feat: attach attribution to analytics events"
~~~

### Task 3: Wire link clicks, successful inquiries, and tagged footer traffic

**Files:**
- Modify: src/pages/links.astro
- Modify: src/components/InquiryForm.astro
- Modify: src/components/Footer.astro
- Modify: tests/link-hub.test.ts
- Modify: tests/production-flows.test.ts

**Interfaces:**
- Link cards expose data-link-id and data-link-placement attributes.
- The browser emits link_click with link_id and placement.
- A successful inquiry emits inquiry_submit after the API response is accepted.

- [ ] Step 1: Write failing source-contract assertions

Add to tests/link-hub.test.ts:

~~~ts
  test('instruments link cards with stable IDs and click events', () => {
    const page = source('src/pages/links.astro');
    expect(page).toContain('data-analytics-link');
    expect(page).toContain('data-link-id={link.id}');
    expect(page).toContain("trackEvent('link_click'");
    expect(page).toContain("placement: 'links_page'");
  });
~~~

Add to the homepage navigation test in tests/production-flows.test.ts:

~~~ts
    expect(footer).toContain('utm_source=site');
    expect(footer).toContain('utm_medium=footer');
    expect(footer).toContain('utm_content=links-hub');
~~~

Add to the homepage form test:

~~~ts
    expect(inquiryForm).toContain("trackEvent('inquiry_submit')");
~~~

- [ ] Step 2: Run the focused route tests and verify they fail

Run:

~~~bash
yarn vitest run tests/link-hub.test.ts tests/production-flows.test.ts
~~~

Expected: FAIL because the link cards, inquiry success path, and footer URL are not instrumented.

- [ ] Step 3: Add click instrumentation to links.astro

Add attributes to each link card:

~~~astro
<a
  class="link-card"
  href={link.href}
  data-analytics-link
  data-link-id={link.id}
  data-link-placement="links_page"
  target={link.external ? '_blank' : undefined}
  rel={link.external ? 'noopener noreferrer' : undefined}
>
~~~

Add this script after the page markup:

~~~astro
<script>
  import { trackEvent } from '../lib/analytics-client';

  document.querySelectorAll<HTMLAnchorElement>('[data-analytics-link]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('link_click', {
        link_id: link.dataset.linkId ?? 'unknown',
        placement: link.dataset.linkPlacement ?? 'links_page',
      });
    });
  });
</script>
~~~

- [ ] Step 4: Emit inquiry_submit only after successful submission

Import trackEvent alongside the existing inquiry client imports:

~~~ts
import { trackEvent } from '../lib/analytics-client';
~~~

Inside the existing message === null success branch, before hiding the form, add:

~~~ts
trackEvent('inquiry_submit');
~~~

Do not add the event to the failure or network-error branches.

- [ ] Step 5: Tag the homepage footer link

Change the footer links-hub anchor to:

~~~astro
<a
  class="hover:text-ink transition-colors duration-150 no-underline"
  href="/links?utm_source=site&utm_medium=footer&utm_campaign=navigation&utm_content=links-hub"
>
  社群與其他入口
</a>
~~~

- [ ] Step 6: Run the focused route and analytics tests and verify they pass

Run:

~~~bash
yarn vitest run tests/link-hub.test.ts tests/production-flows.test.ts tests/analytics.test.ts tests/analytics-route.test.ts tests/analytics-attribution.test.ts
~~~

Expected: PASS with all source contracts and analytics behavior green.

- [ ] Step 7: Commit the UI event wiring

~~~bash
git add src/pages/links.astro src/components/InquiryForm.astro src/components/Footer.astro tests/link-hub.test.ts tests/production-flows.test.ts
git commit -m "feat: track attribution touchpoints"
~~~

### Task 4: Verify the full site and review the final diff

**Files:**
- No new files; verify all files from Tasks 1–3.

- [ ] Step 1: Run the complete test suite

~~~bash
yarn test
~~~

Expected: all test files pass with zero failures.

- [ ] Step 2: Run Astro diagnostics and the production build

~~~bash
yarn astro check
yarn build
~~~

Expected: Astro reports zero errors; the build generates the existing routes including /links/index.html and completes successfully. Existing non-blocking warnings may remain.

- [ ] Step 3: Inspect the generated output and git diff

~~~bash
test -f .vercel/output/static/links/index.html
rg -n "landing_attribution|link_click|inquiry_submit|utm_source=site" .vercel/output/static/index.html .vercel/output/static/links/index.html
git diff --check
git status --short
~~~

Confirm the diff contains only attribution parsing/storage, analytics validation/transport, the three approved event touchpoints, tests, and plan/spec documentation. Leave unrelated .agents/ and .claude/skills/ paths untouched.

- [ ] Step 4: Commit the completed verification documentation

~~~bash
git status --short --branch
git log -4 --oneline
~~~

Use the existing task commits as the implementation history; do not commit generated build output or unrelated untracked directories.
