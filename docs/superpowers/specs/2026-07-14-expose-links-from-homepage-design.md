# Expose Links Hub from Homepage

**Date:** 2026-07-14
**Route:** `/links`
**Status:** Approved in conversation; awaiting written-spec review

## Goal

Make the first-party `/links` hub discoverable from the homepage without competing with the homepage's primary consulting and inquiry journey.

## Decision

Add one secondary link to the existing global footer:

`社群與其他入口 →` → `/links`

Do not add `/links` to the hero or primary navigation. The homepage already exposes the primary destinations (`作品集`, `所有文章`, `主題`, `搜尋`) and the main conversion action (`預約諮詢`). The links hub is a useful secondary destination for social-profile visitors, but promoting it above the fold would duplicate those journeys and dilute the inquiry CTA.

## Link-hub cleanup

Change the `作品集` and `文章` destinations in `src/data/link-hub.ts` from absolute `www` URLs to first-party paths:

- `https://www.dawsonwang.com/proof` → `/proof`
- `https://www.dawsonwang.com/days` → `/days`

Mark those two entries as `external: false`. Social and Google Calendar destinations remain external and continue to open in a new tab with `noopener noreferrer`.

## Scope

### In scope

- Add the footer link and preserve the existing footer layout and typography.
- Update the link-hub data contract for first-party destinations.
- Update regression tests for footer discoverability, exact internal paths, and external/internal target metadata.

### Out of scope

- No homepage section, hero copy, or primary-nav change.
- No redesign of `/links`.
- No changes to social or calendar URLs.
- No analytics event or tracking-parameter changes.

## Implementation details

- Modify `src/components/Footer.astro` by adding `/links` to the existing footer navigation list.
- Modify `src/data/link-hub.ts` so only the two same-site destinations use relative paths and `external: false`.
- Extend the existing `tests/link-hub.test.ts` and `tests/production-flows.test.ts` assertions rather than creating a new test suite.

## Acceptance criteria

- The homepage footer visibly contains a link labeled `社群與其他入口` pointing to `/links`.
- The `/links` page still renders all seven destinations.
- `作品集` and `文章` resolve to `/proof` and `/days` and are not marked external.
- Threads, Facebook, Instagram, and both calendar links remain external.
- Existing navigation, homepage content, and footer behavior remain unchanged apart from the new footer item.
- Focused tests, the full test suite, Astro diagnostics, and the production build pass.
