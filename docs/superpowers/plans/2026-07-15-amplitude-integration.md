# Amplitude Analytics and Session Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Amplitude the default browser analytics provider with autocapture, 100% Session Replay sampling, and explicit attribution-aware interaction events.

**Architecture:** Keep the Amplitude import and initialization in a dedicated browser-only module loaded by `SiteAnalytics.astro`. Expose that module through a window bridge consumed by the existing analytics abstraction, so the existing Vercel, self-hosted, and disabled modes remain isolated and testable. A module-level initialization promise ensures repeated installation or event calls do not call `initAll` more than once.

**Tech Stack:** Astro 6, TypeScript, Yarn 4, `@amplitude/unified`, Vitest.

## Global Constraints

- Only browser-executed code may import or initialize `@amplitude/unified`.
- Use `amplitude.initAll('4999ee21afb5d662d56000007168ee7f', { analytics: { autocapture: true }, sessionReplay: { sampleRate: 1 } })`.
- Initialize Amplitude at most once per browser lifecycle.
- Keep the existing analytics event names and attribution property contract.
- Use Yarn and do not add a second analytics SDK.

---

### Task 1: Add the tested Amplitude browser bridge

**Files:**
- Create: `src/lib/amplitude-client.ts`
- Create: `tests/amplitude-client.test.ts`

**Interfaces:**
- Produces `AMPLITUDE_API_KEY`, `AMPLITUDE_INIT_OPTIONS`, `createAmplitudeBridge`, `amplitudeBridge`, and `initializeAmplitude`.
- `createAmplitudeBridge(client)` returns `{ initialize(): Promise<void>; event(name, properties?): void; pageview(path, properties?): void }`.

- [ ] **Step 1: Write the failing test**

Test an injected fake client. Assert that two `initialize()` calls and an event before initialization produce one `initAll` call with the supplied key and exact options, then one `track` call. Assert that `pageview` is a no-op because required Amplitude autocapture owns pageviews.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `yarn vitest run tests/amplitude-client.test.ts`

Expected: FAIL because `src/lib/amplitude-client.ts` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Import `* as amplitude` from `@amplitude/unified`. Keep `let initializationPromise: Promise<void> | undefined` inside `createAmplitudeBridge`; assign it only on the first `initialize()` call. Implement `event` as `void initialize().then(() => client.track(name, properties), () => undefined)`. Export a singleton `amplitudeBridge = createAmplitudeBridge(amplitude)` and `initializeAmplitude = amplitudeBridge.initialize`.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `yarn vitest run tests/amplitude-client.test.ts`

Expected: PASS, including the one-call and exact-options assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/amplitude-client.ts tests/amplitude-client.test.ts
git commit -m "feat(analytics): add guarded Amplitude browser bridge"
```

### Task 2: Add the Amplitude provider to the analytics abstraction

**Files:**
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/analytics-client.ts`
- Modify: `tests/analytics.test.ts`

**Interfaces:**
- `AnalyticsProvider` gains `'amplitude'`.
- `AnalyticsApiDependencies` gains `amplitudeDispatch?: (event: 'event' | 'pageview', nameOrPath?: string, properties?: AnalyticsEventProperties) => void`.
- The Amplitude provider dispatches custom events with `withAttribution(properties)` and skips explicit pageview dispatches.

- [ ] **Step 1: Write the failing tests**

Change the default config expectation to `{ provider: 'amplitude', enabled: true, endpoint: null, enableSpeedInsights: false, autoTrackPageviews: false }`. Add an Amplitude event test that calls `api.event('link_click', { link_id: 'threads' })` and expects `amplitudeDispatch('event', 'link_click', { attribution_first_source: 'qr', link_id: 'threads' })`. Add an Amplitude pageview test that asserts the dispatch is not called.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `yarn vitest run tests/analytics.test.ts`

Expected: FAIL because the default provider and Amplitude dispatch branch do not exist.

- [ ] **Step 3: Implement the provider branch**

Add `'amplitude'` to `ANALYTICS_PROVIDERS`, accept it in `normalizeProvider`, return it as the default, and return `enableSpeedInsights: false` and `autoTrackPageviews: false` for it. In `createAnalyticsApi`, dispatch Amplitude events after sanitizing and merging attribution; leave its `pageview` branch empty. In `installAnalytics`, pass the `window.dwAmplitude` bridge to `amplitudeDispatch` and emit `landing_attribution` for Amplitude as well as Vercel.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `yarn vitest run tests/analytics.test.ts`

Expected: PASS, with all existing Vercel/self-hosted/none tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics-client.ts tests/analytics.test.ts
git commit -m "feat(analytics): route custom events to Amplitude"
```

### Task 3: Install the browser bridge at the Astro client boundary

**Files:**
- Modify: `src/components/SiteAnalytics.astro`
- Modify: `tests/production-flows.test.ts`

**Interfaces:**
- The processed client script imports `amplitudeBridge` and `initializeAmplitude` only inside the browser script.
- When `config.provider === 'amplitude'`, it sets `window.dwAmplitude = amplitudeBridge`, calls `initializeAmplitude()`, and then calls `installAnalytics(config)`.

- [ ] **Step 1: Write the failing source-boundary tests**

Assert that `SiteAnalytics.astro` contains the client-script imports, the Amplitude provider guard, `window.dwAmplitude = amplitudeBridge`, and `initializeAmplitude()`. Assert that the Amplitude import is not in the Astro frontmatter block before the first `---` separator.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `yarn vitest run tests/production-flows.test.ts`

Expected: FAIL because the client boundary has not been updated.

- [ ] **Step 3: Implement the client-only wiring**

Import the bridge in the processed `<script>`, parse the existing JSON config, assign the bridge and initialize only for the Amplitude provider, then install the shared analytics API. Render Vercel Analytics and Speed Insights only when the provider is Vercel.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `yarn vitest run tests/production-flows.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SiteAnalytics.astro tests/production-flows.test.ts
git commit -m "feat(analytics): initialize Amplitude from Astro client entry"
```

### Task 4: Verify the complete application build and handoff

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`
- Review: all files changed by Tasks 1–3

- [ ] **Step 1: Run the complete tests**

Run: `yarn test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run Astro's type and template checks**

Run: `yarn astro check`

Expected: no new diagnostics from the Amplitude integration.

- [ ] **Step 3: Build the production bundle**

Run: `yarn build`

Expected: Astro build, Pagefind, and the existing post-build sync complete successfully.

- [ ] **Step 4: Check the final diff and commit dependency/build changes**

Run: `git diff --check` and `git status --short`. Confirm only Amplitude integration files plus `package.json`/`yarn.lock` are staged; leave pre-existing `.agents/` and `.claude/skills/` untracked paths untouched.

```bash
git add package.json yarn.lock
git commit -m "chore: install Amplitude unified SDK"
```

- [ ] **Step 5: Tell the user how to verify before production**

Tell the user to start the application, open the homepage or `/links`, trigger a tracked link/form interaction, and confirm the event and Session Replay appear in Amplitude. State that production deployment should happen only after that browser-level verification.
