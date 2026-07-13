# Dawson Wang Links Page Design

**Date:** 2026-07-13
**Route:** `/links`
**Status:** Approved for implementation

## Goal

Replace the Portaly link hub with a first-party page on dawsonwang.com that gives visitors one fast, trustworthy place to find Dawson Wang's social profiles, public work, writing, and booking links.

## Design direction

The page is a focused, mobile-first link hub rather than a second homepage. It uses the existing site's dark/light semantic color tokens, Space Grotesk / Noto Sans TC typography, and Dawson's existing portrait asset so it feels native to dawsonwang.com while keeping the interaction surface small.

The visual signature is a slim vertical gradient signal rail beside the link groups. Each link is a quiet, high-contrast card attached to that rail; hover and focus move the card slightly toward the rail and expose the accent color. This gives the page a memorable visual system without adding decorative content or external dependencies.

## Alternatives considered

1. **Standalone `/links` hub — selected.** A compact page optimized for social-profile traffic, with no global navigation or footer chrome. It minimizes time-to-link and keeps the page independent from the homepage's longer sales narrative.
2. **Reuse the full homepage at `/links`.** This would inherit existing content and SEO structure, but visitors would need to scan through case studies, services, proof, and inquiry content before reaching the intended links.
3. **Embed or proxy the Portaly page.** This preserves the current experience but keeps the external dependency and gives the first-party page no control over availability, styling, or analytics.

## Content structure

The page contains:

- A compact header with a small home link, portrait, `Dawson Wang`, and the positioning line `把 AI 工具搬進你的實際工作流。`
- A `社群` group with Threads, Facebook, and Instagram.
- A `探索` group with `作品集` and `文章`, linking to the supplied `www.dawsonwang.com` URLs exactly.
- A `合作` group with `諮詢預約` and `合作洽談`, linking to the supplied Google Calendar URLs exactly.
- A small first-party footer line linking back to `/`.

External destinations open in a new tab with `noopener noreferrer`; first-party destinations stay in the same tab. Every link has a visible label and a descriptive accessible name.

## Implementation architecture

- Add `src/data/link-hub.ts` as the single source of truth for groups, labels, URLs, destination kind, and optional microcopy.
- Extend `BaseLayout.astro` with an opt-out for global `Nav` and `Footer`, keeping the default unchanged for all existing pages.
- Add `src/pages/links.astro` as the route and page-level metadata entry point.
- Keep page-specific styles in the route's `<style>` block so the link hub's layout and signature rail remain isolated from the existing homepage components.
- Use the existing `/dawson.webp` asset with explicit dimensions and an informative alt attribute. No new dependency or remote image is required.

## Responsive and accessibility behavior

- The content column is capped at 620px and remains centered on larger screens; horizontal padding keeps cards readable on narrow screens.
- The portrait, headings, and links remain readable at the existing mobile viewport baseline.
- Link targets are real anchors with visible keyboard focus rings, a minimum touch target of 44px, and sufficient color contrast in both existing themes.
- `prefers-reduced-motion: reduce` removes the rail pulse and hover translation.
- The page is server-rendered and has no client-side state or required JavaScript.

## Verification

- Unit tests verify the seven supplied link destinations, grouping, and route wiring.
- `yarn test` runs the full existing test suite.
- `yarn astro check` validates Astro and TypeScript diagnostics.
- `yarn build` verifies the generated `/links/index.html` route and production asset pipeline.
- Browser verification checks the rendered page at desktop and mobile widths, visible labels, focus state, and the exact link hrefs.
