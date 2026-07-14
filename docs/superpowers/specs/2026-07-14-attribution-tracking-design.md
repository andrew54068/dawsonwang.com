# Campaign and QR Attribution Design

**Date:** 2026-07-14
**Scope:** Tagged landing links, first/last-touch analytics context, link clicks, and successful inquiry events
**Status:** Approved in conversation; awaiting written-spec review

## Goal

Identify which tagged URL brought a visitor to the site, preserve that source while the visitor browses, and attach it to meaningful interactions such as link-hub clicks and successful inquiry submissions.

## Decision

Use standard UTM parameters as the only accepted inbound attribution fields:

- utm_source: origin or platform, such as threads, qr, or site
- utm_medium: channel, such as social, offline, or footer
- utm_campaign: campaign or initiative
- utm_content: specific placement or creative, such as bio or slide-cta

Examples:

- /links?utm_source=threads&utm_medium=social&utm_campaign=profile&utm_content=bio
- /links?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta
- /links?utm_source=site&utm_medium=footer&utm_campaign=navigation&utm_content=links-hub

Only these four keys are parsed and persisted. Arbitrary query parameters, email addresses, names, and raw form values are never copied into attribution state.

## Attribution lifecycle

1. On page load, parse and length-limit the four UTM values.
2. Persist first-touch and last-touch values in sessionStorage under a namespaced key.
3. Preserve first-touch values for the current browsing session; replace last-touch values whenever a new tagged URL is visited.
4. If storage is unavailable or malformed, continue with in-memory attribution and do not break page rendering or analytics.
5. Flatten the attribution context into scalar analytics fields so both the self-hosted API and Vercel custom events can consume it.

The session scope avoids introducing a long-lived tracking identifier or cookie. A future 30-day first-party model can be added separately if cross-session marketing attribution becomes necessary.

## Events

- Pageviews include attribution_first_* and attribution_last_* properties when available. The self-hosted pageview payload accepts the same scalar properties shape as custom events.
- A tagged landing page emits one landing_attribution custom event for Vercel Analytics, whose pageview integration does not expose custom attribution properties through this code path.
- Each /links card emits link_click with link_id and placement: links_page.
- A successful client-enhanced inquiry emits inquiry_submit; the shared analytics API automatically attaches the persisted attribution context.

The existing no-JavaScript inquiry fallback remains unchanged. The current self-hosted endpoint continues to log validated events; adding durable storage is outside this change.

## Implementation architecture

- Add src/lib/analytics-attribution.ts with pure parsing, storage, and flattening helpers.
- Extend src/lib/analytics-client.ts to capture attribution during installation, merge it into events, and include it on self-hosted pageviews.
- Extend src/pages/api/analytics.ts to validate optional pageview properties.
- Add data attributes and a click listener to src/pages/links.astro.
- Emit the successful inquiry event from src/components/InquiryForm.astro.
- Tag the homepage footer's /links entry with the approved internal UTM values.

## Privacy and safety boundaries

- Accept exactly four UTM keys.
- Reject empty values and values longer than 100 characters.
- Store only first-party session state; do not set a server-readable cookie.
- Keep analytics properties scalar and JSON-safe.
- Do not include inquiry form contents or personally identifying fields in analytics events.

## Acceptance criteria

- A URL containing the four supported UTM parameters produces sanitized first/last-touch state.
- A later untagged page retains the session's attribution; a later tagged page updates only last-touch.
- Malformed storage and unavailable storage are harmless.
- Self-hosted pageviews and events contain flattened attribution properties.
- Vercel receives a landing_attribution event for a newly tagged landing visit.
- /links clicks emit link_click with the correct link ID and placement.
- Successful inquiry submission emits inquiry_submit; failed submission does not.
- Existing analytics behavior and all non-attribution page flows remain intact.
