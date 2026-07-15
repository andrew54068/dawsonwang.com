import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LINK_GROUPS } from '../src/data/link-hub';

const source = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('links page content', () => {
  test('contains the four expected groups and nine supplied destinations', () => {
    expect(LINK_GROUPS.map(group => group.id)).toEqual(['social', 'explore', 'collaborate', 'contact']);
    expect(LINK_GROUPS.flatMap(group => group.links)).toHaveLength(9);
    expect(LINK_GROUPS.flatMap(group => group.links).map(link => link.href)).toEqual([
      'https://www.threads.com/@andrew54068',
      'https://www.facebook.com/andrew.wang.716',
      'https://www.instagram.com/andrew54068',
      '/proof',
      '/days',
      'https://calendar.app.google/FBHsAyW6zJ529aAb6',
      'https://calendar.app.google/xLSLkAUNnc2MVSsd9',
      'mailto:dawsonwang54068@gmail.com',
      'https://line.me/ti/p/~andrew54068',
    ]);
  });

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

    for (const id of ['threads', 'facebook', 'instagram', 'consultation', 'partnership', 'email', 'line']) {
      expect(links[id]).toMatchObject({ external: true });
    }
  });

  test('gives every link a visible label and descriptive supporting copy', () => {
    for (const link of LINK_GROUPS.flatMap(group => group.links)) {
      expect(link.label.trim()).not.toBe('');
      expect(link.description.trim()).not.toBe('');
    }
  });

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

  test('links route includes the responsive and accessibility hooks', () => {
    const page = source('src/pages/links.astro');

    expect(page).toContain('class="links-page"');
    expect(page).toContain('class="link-card"');
    expect(page).toContain(':focus-visible');
    expect(page).toContain('prefers-reduced-motion: reduce');
    expect(page).toMatch(/min-height:\s*(44|64)px/);
    expect(page).toContain('linear-gradient');
  });

  test('instruments link cards with stable IDs and click events', () => {
    const page = source('src/pages/links.astro');

    expect(page).toContain('data-analytics-link');
    expect(page).toContain('data-link-id={link.id}');
    expect(page).toContain('data-link-placement="links_page"');
    expect(page).toContain("trackEvent('link_click'");
    expect(page).toContain('link_id: link.dataset.linkId');
    expect(page).toContain('placement: link.dataset.linkPlacement');
  });
});
