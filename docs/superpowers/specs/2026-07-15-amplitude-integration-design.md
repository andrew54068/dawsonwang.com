# Amplitude Analytics and Session Replay Design

## Goal

Use Amplitude as the site's default browser analytics provider, including Session Replay, while preserving the existing Vercel, self-hosted, and disabled provider modes for explicit configuration.

## Requirements

- The application is JavaScript/TypeScript-based, so install `@amplitude/unified` with Yarn.
- Import `@amplitude/unified` only from a browser-executed Astro script.
- Initialize with the supplied API key and the exact required options:

  ```ts
  amplitude.initAll('4999ee21afb5d662d56000007168ee7f', {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
  ```

- Guard initialization so one browser lifecycle makes at most one `initAll` call.
- Preserve the existing `link_click`, `inquiry_submit`, and UTM attribution events.
- Do not import Amplitude from Astro frontmatter, API routes, or any server module.

## Architecture

`src/lib/amplitude-client.ts` owns the sole Amplitude import, the exact initialization options, and a module-level initialization promise. It exposes a small browser bridge that queues explicit events until initialization completes.

`src/components/SiteAnalytics.astro` remains the client entry point. When the resolved provider is `amplitude`, its processed `<script>` attaches the bridge to `window` and initializes Amplitude before installing the existing analytics API. The shared analytics API dispatches custom events to the bridge; pageviews are left to Amplitude's required autocapture setting so the site does not create duplicate pageview events.

`src/lib/analytics.ts` adds the `amplitude` provider and makes it the default. `vercel`, `self-hosted`, and `none` remain available through `PUBLIC_ANALYTICS_PROVIDER`. Vercel components render only for the Vercel provider, and the existing server endpoint is unchanged.

## Event contract

- Amplitude autocapture records browser pageviews and supported interaction signals.
- `landing_attribution` is emitted once on a tagged landing when the resolved provider is Amplitude. It includes the normalized first/last UTM properties.
- `link_click` keeps the existing `link_id` and `placement` properties and includes normalized attribution.
- `inquiry_submit` keeps the existing placement property and includes normalized attribution.
- No form values or server request payloads are sent as analytics properties by this integration.

## Verification

Tests must prove the provider resolution, event dispatch, exact initialization options, once-only initialization, and client-only import boundary. Run the focused tests, the complete Vitest suite, `yarn astro check`, and `yarn build` before handing off. This change is not considered production-verified until a running browser sends an event visible in the Amplitude dashboard.
