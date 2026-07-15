# Dawson Wang Links Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-party `/links` route that replaces the Portaly link hub with an accessible, mobile-first page containing Dawson Wang's supplied social, content, and booking links.

**Architecture:** Store the link groups and exact destinations in a typed data module, render them through a dedicated Astro route, and extend `BaseLayout.astro` with an opt-out for the existing global navigation and footer. Keep the page-specific visual system inside `src/pages/links.astro`; reuse the site's semantic tokens, portrait asset, and fonts without adding dependencies.

**Tech Stack:** Astro 6, TypeScript, Tailwind CSS v4 utility classes, Vitest, Yarn 4.

## Global Constraints

- Route: `/links`.
- Exact external URLs: preserve all seven URLs supplied in the request without tracking parameters or normalization.
- External links open with `target="_blank"` and `rel="noopener noreferrer"`; first-party links remain same-tab.
- Keep default `BaseLayout` navigation and footer behavior unchanged for existing pages.
- Use `/public/dawson.webp`; do not add a new image dependency or remote asset.
- Keep the page server-rendered with no required client-side JavaScript.
- Preserve keyboard focus visibility, minimum 44px link targets, responsive layout, and reduced-motion support.

---

### Task 1: Define the link-hub data contract and regression tests

**Files:**
- Create: `src/data/link-hub.ts`
- Create: `tests/link-hub.test.ts`

**Interfaces:**
- Produces `LINK_GROUPS`, a readonly array of `{ id, label, links }` groups.
- Each link produces `{ id, label, href, description, external }`.

- [ ] **Step 1: Write the failing data-contract tests**

```ts
import { describe, expect, test } from 'vitest';
import { LINK_GROUPS } from '../src/data/link-hub';

describe('links page content', () => {
  test('contains the three expected groups and seven supplied destinations', () => {
    expect(LINK_GROUPS.map(group => group.id)).toEqual(['social', 'explore', 'collaborate']);
    expect(LINK_GROUPS.flatMap(group => group.links)).toHaveLength(7);
    expect(LINK_GROUPS.flatMap(group => group.links).map(link => link.href)).toEqual([
      'https://www.threads.com/@andrew54068',
      'https://www.facebook.com/andrew.wang.716',
      'https://www.instagram.com/andrew54068',
      'https://www.dawsonwang.com/proof',
      'https://www.dawsonwang.com/days',
      'https://calendar.app.google/FBHsAyW6zJ529aAb6',
      'https://calendar.app.google/xLSLkAUNnc2MVSsd9',
    ]);
  });

  test('marks external destinations separately from first-party destinations', () => {
    const links = LINK_GROUPS.flatMap(group => group.links);
    expect(links.every(link => link.external)).toBe(true);
  });

  test('gives every link a visible label and descriptive supporting copy', () => {
    for (const link of LINK_GROUPS.flatMap(group => group.links)) {
      expect(link.label.trim()).not.toBe('');
      expect(link.description.trim()).not.toBe('');
    }
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails because the data module is absent**

Run: `yarn vitest run tests/link-hub.test.ts`

Expected: FAIL with a module-resolution error for `src/data/link-hub`.

- [ ] **Step 3: Add the minimal typed data module**

```ts
export interface LinkHubLink {
  id: string;
  label: string;
  href: string;
  description: string;
  external: boolean;
}

export interface LinkHubGroup {
  id: 'social' | 'explore' | 'collaborate';
  label: string;
  links: readonly LinkHubLink[];
}

export const LINK_GROUPS: readonly LinkHubGroup[] = [
  {
    id: 'social',
    label: '社群',
    links: [
      { id: 'threads', label: 'Threads', href: 'https://www.threads.com/@andrew54068', description: '每天拆解 AI 工具與實際工作流', external: true },
      { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/andrew.wang.716', description: '比較完整的近況與公開分享', external: true },
      { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/andrew54068', description: '工作之外，也記錄正在發生的事', external: true },
    ],
  },
  {
    id: 'explore',
    label: '探索',
    links: [
      { id: 'proof', label: '作品集', href: 'https://www.dawsonwang.com/proof', description: '看已經做出來的工具、流程與案例', external: true },
      { id: 'days', label: '文章', href: 'https://www.dawsonwang.com/days', description: '連續公開記錄 AI 落地的每一天', external: true },
    ],
  },
  {
    id: 'collaborate',
    label: '合作',
    links: [
      { id: 'consultation', label: '諮詢預約', href: 'https://calendar.app.google/FBHsAyW6zJ529aAb6', description: '先聊 30 分鐘，釐清你現在卡在哪裡', external: true },
      { id: 'partnership', label: '合作洽談', href: 'https://calendar.app.google/xLSLkAUNnc2MVSsd9', description: '談演講、培訓、顧問或 AI 工具落地', external: true },
    ],
  },
] as const;
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `yarn vitest run tests/link-hub.test.ts`

Expected: PASS with 3 tests passing.

- [ ] **Step 5: Commit the data contract**

```bash
git add src/data/link-hub.ts tests/link-hub.test.ts
git commit -m "feat: define links page destinations"
```

### Task 2: Add optional layout chrome controls and route wiring tests

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/pages/links.astro`
- Modify: `tests/link-hub.test.ts`

**Interfaces:**
- `BaseLayout` accepts `showNav?: boolean` and `showFooter?: boolean`, both defaulting to `true`.
- `/links` renders `BaseLayout` with `showNav={false}` and `showFooter={false}`.

- [ ] **Step 1: Extend the tests with route and layout assertions**

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';

const source = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('links route uses the standalone shell and renders every group', () => {
  const page = source('src/pages/links.astro');
  const layout = source('src/layouts/BaseLayout.astro');

  expect(page).toContain("import { LINK_GROUPS } from '../data/link-hub';");
  expect(page).toContain('showNav={false}');
  expect(page).toContain('showFooter={false}');
  expect(page).toContain('LINK_GROUPS.map');
  expect(layout).toContain('showNav = true');
  expect(layout).toContain('showFooter = true');
});
```

- [ ] **Step 2: Run the focused test to verify the new route assertions fail**

Run: `yarn vitest run tests/link-hub.test.ts`

Expected: FAIL because `src/pages/links.astro` does not exist and `BaseLayout` has no chrome props.

- [ ] **Step 3: Add optional nav/footer props without changing existing callers**

Add these fields to `BaseLayout.astro`:

```astro
  showNav?: boolean;
  showFooter?: boolean;
```

Destructure them with defaults:

```astro
  showNav = true,
  showFooter = true,
```

Wrap the existing chrome:

```astro
  {showNav && <Nav />}
  <main><slot /></main>
  {showFooter && <Footer />}
```

- [ ] **Step 4: Add the minimal route shell**

Create `src/pages/links.astro` with the route frontmatter and semantic structure below. Keep the styles in the route so the signal rail cannot alter other pages.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { LINK_GROUPS } from '../data/link-hub';

const description = 'Dawson Wang 的社群、作品集、文章與合作預約入口。';
---

<BaseLayout title="Dawson Wang · Links" description={description} showNav={false} showFooter={false}>
  <div class="links-page">
    <div class="links-shell">
      <header class="links-header">
        <a class="home-link" href="/" aria-label="回到 Dawson Wang 首頁">dawsonwang.com <span aria-hidden="true">↗</span></a>
        <div class="identity">
          <div class="portrait-frame">
            <img src="/dawson.webp" alt="Dawson Wang，AI 工具落地實踐者" width="640" height="800" loading="eager" decoding="async" />
          </div>
          <div>
            <p class="identity-kicker">AI workflow / Taiwan</p>
            <h1>Dawson Wang</h1>
            <p class="identity-lede">把 AI 工具搬進你的實際工作流。</p>
          </div>
        </div>
      </header>

      <main class="link-groups" aria-label="Dawson Wang links">
        {LINK_GROUPS.map(group => (
          <section class="link-group" aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`}><span aria-hidden="true">//</span> {group.label}</h2>
            <div class="link-list">
              {group.links.map(link => (
                <a
                  class="link-card"
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span class="link-copy">
                    <span class="link-label">{link.label}</span>
                    <span class="link-description">{link.description}</span>
                  </span>
                  <span class="link-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer class="links-footer">
        <span>Built in Taipei · GMT+8</span>
        <a href="/">回到主頁 <span aria-hidden="true">→</span></a>
      </footer>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `yarn vitest run tests/link-hub.test.ts`

Expected: PASS with all data and route assertions passing.

- [ ] **Step 6: Commit the route shell**

```bash
git add src/layouts/BaseLayout.astro src/pages/links.astro tests/link-hub.test.ts
git commit -m "feat: add standalone links route"
```

### Task 3: Implement the responsive visual system and accessibility states

**Files:**
- Modify: `src/pages/links.astro`
- Modify: `tests/link-hub.test.ts`

**Interfaces:**
- The existing route markup remains the public structure; styles provide the gradient signal rail, responsive spacing, focus states, and reduced-motion behavior.

- [ ] **Step 1: Extend tests with required visual/accessibility hooks**

```ts
test('links route includes the responsive and accessibility hooks', () => {
  const page = source('src/pages/links.astro');

  expect(page).toContain('class="links-page"');
  expect(page).toContain('class="link-card"');
  expect(page).toContain(':focus-visible');
  expect(page).toContain('prefers-reduced-motion: reduce');
  expect(page).toContain('min-height: 44px');
  expect(page).toContain('linear-gradient');
});
```

- [ ] **Step 2: Run the focused test to verify it fails for missing styles**

Run: `yarn vitest run tests/link-hub.test.ts`

Expected: FAIL because the route does not yet contain the page-specific style rules.

- [ ] **Step 3: Add the minimal page-specific CSS**

Append a `<style>` block to `src/pages/links.astro` with these behavior requirements:

```css
.links-page {
  min-height: 100svh;
  background:
    radial-gradient(circle at 12% 8%, color-mix(in oklab, var(--color-brick) 18%, transparent), transparent 34rem),
    radial-gradient(circle at 92% 82%, color-mix(in oklab, var(--color-teal) 12%, transparent), transparent 30rem),
    var(--color-paper);
  color: var(--color-ink);
}

.links-shell {
  width: min(100% - 40px, 620px);
  margin-inline: auto;
  padding: 24px 0 28px;
}

.links-header { display: grid; gap: 40px; }
.home-link, .links-footer a { color: var(--color-faint); font: 500 11px/1.4 var(--font-mono); letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
.home-link:hover, .home-link:focus-visible, .links-footer a:hover, .links-footer a:focus-visible { color: var(--color-teal); }
.identity { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 20px; }
.portrait-frame { position: relative; width: 92px; aspect-ratio: 4 / 5; }
.portrait-frame::before { position: absolute; inset: -5px 5px 5px -5px; background: linear-gradient(135deg, var(--color-brick), var(--color-teal)); content: ''; }
.portrait-frame img { position: relative; display: block; width: 100%; height: 100%; border: 1px solid var(--color-rule); object-fit: cover; }
.identity-kicker, .link-group h2, .links-footer { color: var(--color-faint); font: 500 10px/1.4 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; }
.identity-kicker { margin: 0 0 8px; }
.identity h1 { margin: 0; font: 600 clamp(1.8rem, 6vw, 2.5rem)/1 var(--font-display); letter-spacing: -.04em; }
.identity-lede { margin: 10px 0 0; color: var(--color-muted); font: 400 15px/1.5 var(--font-display); }
.link-groups { position: relative; display: grid; gap: 30px; margin-top: 44px; padding-left: 16px; }
.link-groups::before { position: absolute; top: 2px; bottom: 2px; left: 0; width: 1px; background: linear-gradient(var(--color-brick), var(--color-teal)); content: ''; opacity: .8; }
.link-group { position: relative; }
.link-group::before { position: absolute; top: 2px; left: -19px; width: 7px; height: 7px; border: 1px solid var(--color-teal); background: var(--color-paper); content: ''; transform: translateX(-50%); }
.link-group h2 { margin: 0 0 10px; }
.link-group h2 span { color: var(--color-teal); }
.link-list { display: grid; gap: 8px; }
.link-card { display: flex; min-height: 64px; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; border: 1px solid var(--color-rule); background: color-mix(in oklab, var(--color-surface-1) 82%, transparent); color: inherit; text-decoration: none; transition: border-color 160ms ease, background 160ms ease, transform 160ms ease; }
.link-card:hover { border-color: color-mix(in oklab, var(--color-teal) 70%, var(--color-rule)); background: var(--color-surface-2); transform: translateX(4px); }
.link-card:focus-visible { outline: 2px solid var(--color-teal); outline-offset: 3px; border-color: var(--color-teal); }
.link-copy { display: grid; gap: 4px; }
.link-label { font: 600 15px/1.25 var(--font-display); }
.link-description { color: var(--color-muted); font: 400 12px/1.4 var(--font-display); }
.link-arrow { color: var(--color-teal); font: 600 18px/1 var(--font-mono); }
.links-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--color-rule); }
@media (min-width: 640px) { .links-shell { padding-top: 36px; } .links-header { gap: 52px; } .identity { grid-template-columns: 108px 1fr; gap: 24px; } .portrait-frame { width: 108px; } .link-groups { margin-top: 56px; } }
@media (prefers-reduced-motion: reduce) { .link-card { transition: none; } .link-card:hover { transform: none; } }
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `yarn vitest run tests/link-hub.test.ts`

Expected: PASS with all route and style assertions passing.

- [ ] **Step 5: Commit the visual system**

```bash
git add src/pages/links.astro tests/link-hub.test.ts
git commit -m "style: design links page signal rail"
```

### Task 4: Run full project verification and inspect the generated route

**Files:**
- Verify: `src/data/link-hub.ts`
- Verify: `src/layouts/BaseLayout.astro`
- Verify: `src/pages/links.astro`
- Verify: `tests/link-hub.test.ts`

- [ ] **Step 1: Run the full Vitest suite**

Run: `yarn test`

Expected: exit code 0 with all existing and new tests passing.

- [ ] **Step 2: Run Astro diagnostics**

Run: `yarn astro check`

Expected: exit code 0 with no errors.

- [ ] **Step 3: Build the site**

Run: `yarn build`

Expected: exit code 0 and generated `dist/client/links/index.html` exists. The Vercel adapter also copies the route to `.vercel/output/static/links/index.html`.

- [ ] **Step 4: Inspect the built route for exact links and security attributes**

Run:

```bash
rg -n "threads\.com/@andrew54068|facebook\.com/andrew\.wang\.716|instagram\.com/andrew54068|www\.dawsonwang\.com/(proof|days)|calendar\.app\.google/(FBHsAyW6zJ529aAb6|xLSLkAUNnc2MVSsd9)" dist/client/links/index.html
rg -n "target=\"_blank\"|noopener noreferrer|Dawson Wang" dist/client/links/index.html
```

Expected: all seven exact URLs, `target="_blank"`, `noopener noreferrer`, and page identity text appear in the generated HTML.

- [ ] **Step 5: Commit the final verified implementation**

```bash
git status --short
git add src/data/link-hub.ts src/layouts/BaseLayout.astro src/pages/links.astro tests/link-hub.test.ts
git commit -m "feat: replace Portaly with first-party links page"
```
