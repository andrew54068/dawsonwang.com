import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LINK_GROUPS } from '../src/data/link-hub';

const source = (relativePath: string) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');

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
});
