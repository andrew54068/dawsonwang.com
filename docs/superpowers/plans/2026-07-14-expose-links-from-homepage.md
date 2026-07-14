# Expose Links Hub from Homepage Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a secondary /links entry to the homepage footer and classify the link hub's first-party destinations as same-site links.

**Architecture:** Keep the homepage focused on its existing consulting journey by adding one link to the existing Footer.astro navigation list. Keep /links destinations in src/data/link-hub.ts; use relative paths and external: false for /proof and /days, while preserving external behavior for social and calendar destinations.

**Tech Stack:** Astro 6, TypeScript, Vitest, Yarn 4.

## Global Constraints

- Add only a secondary footer link; do not change the homepage hero or primary navigation.
- Use the exact footer label 社群與其他入口 and destination /links.
- Use /proof and /days for first-party link-hub destinations and mark them external: false.
- Keep social and Google Calendar destinations external with their existing URLs and new-tab behavior.
- Do not add dependencies, tracking parameters, or new homepage sections.

---

### Task 1: Update link metadata and expose the hub in the footer

**Files:**
- Modify: tests/link-hub.test.ts
- Modify: tests/production-flows.test.ts
- Modify: src/data/link-hub.ts
- Modify: src/components/Footer.astro

**Interfaces:**
- LINK_GROUPS remains the readonly data source for the /links route.
- Footer.astro continues to render the existing footer navigation and adds one same-site anchor: <a href="/links">社群與其他入口</a>.

- [x] **Step 1: Write the failing tests for the new metadata and footer entry**

In tests/link-hub.test.ts, replace the two first-party absolute URLs in the expected list and replace the all-external assertion with explicit metadata assertions:

~~~ts
  test('uses same-site paths for first-party destinations', () => {
    const links = Object.fromEntries(
      LINK_GROUPS.flatMap(group => group.links).map(link => [link.id, link]),
    );

    expect(links.proof).toMatchObject({ href: '/proof', external: false });
    expect(links.days).toMatchObject({ href: '/days', external: false });
  });

  test('keeps social and calendar destinations external', () => {
    const links = Object.fromEntries(
      LINK_GROUPS.flatMap(group => group.links).map(link => [link.id, link]),
    );

    for (const id of ['threads', 'facebook', 'instagram', 'consultation', 'partnership']) {
      expect(links[id]).toMatchObject({ external: true });
    }
  });
~~~

In tests/production-flows.test.ts, extend the navigation exposes core production journeys test:

~~~ts
    expect(footer).toContain('社群與其他入口');
    expect(footer).toContain('href="/links"');
~~~

- [x] **Step 2: Run the focused tests and verify they fail for the missing implementation**

Run:

~~~bash
yarn vitest run tests/link-hub.test.ts tests/production-flows.test.ts
~~~

Expected: FAIL because LINK_GROUPS still contains the www proof/articles URLs and marks every link external, and Footer.astro does not yet contain /links or 社群與其他入口.

- [x] **Step 3: Update first-party link metadata with the minimal implementation**

In src/data/link-hub.ts, change only these two entries:

~~~ts
      {
        id: 'proof',
        label: '作品集',
        href: '/proof',
        description: '看已經做出來的工具、流程與案例',
        external: false,
      },
      {
        id: 'days',
        label: '文章',
        href: '/days',
        description: '連續公開記錄 AI 落地的每一天',
        external: false,
      },
~~~

Leave all other link objects unchanged.

- [x] **Step 4: Add the footer link without changing existing footer journeys**

In src/components/Footer.astro, add this list item after the existing 作品集 item:

~~~astro
      <li><a class="hover:text-ink transition-colors duration-150 no-underline" href="/links">社群與其他入口</a></li>
~~~

- [x] **Step 5: Run the focused tests and verify they pass**

Run:

~~~bash
yarn vitest run tests/link-hub.test.ts tests/production-flows.test.ts
~~~

Expected: PASS with all tests in both files passing.

- [x] **Step 6: Run the full verification suite**

Run each command from the repository root:

~~~bash
yarn test
yarn astro check
yarn build
~~~

Expected: each command exits with status 0; the build output includes the generated /links/index.html and no new warnings or errors attributable to this change.

- [x] **Step 7: Inspect and commit the implementation**

Run:

~~~bash
git diff --check
git diff -- src/data/link-hub.ts src/components/Footer.astro tests/link-hub.test.ts tests/production-flows.test.ts
git status --short
~~~

Confirm the diff contains only the approved footer link, metadata cleanup, and regression assertions. Then commit:

~~~bash
git add src/data/link-hub.ts src/components/Footer.astro tests/link-hub.test.ts tests/production-flows.test.ts
git commit -m "feat: expose links hub from homepage footer"
~~~
