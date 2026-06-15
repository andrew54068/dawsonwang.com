import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { RECENT_CONSULTATIONS, PERSONAL_TOOLS } from '../src/data/homepage-cases';

const root = process.cwd();
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('homepage redesign — case studies + personal tools', () => {
  test('index.astro renders the new sections in the spec-defined order', () => {
    const home = source('src/pages/index.astro');

    expect(home).toContain('<Hero />');
    expect(home).toContain('<RecentConsultations />');
    expect(home).toContain('<ToolsIBuilt />');
    expect(home).toContain('<ServiceExplainer />');
    expect(home).toContain('<ProofExcerpt />');
    expect(home).toContain('<InquiryForm />');

    // The empty FeaturedPosts component is no longer wired in.
    expect(home).not.toContain('<FeaturedPosts />');

    // Spec order: Hero → Cases → Tools → Services → Proof → Inquiry.
    const order = [
      '<Hero />',
      '<RecentConsultations />',
      '<ToolsIBuilt />',
      '<ServiceExplainer />',
      '<ProofExcerpt />',
      '<InquiryForm />',
    ];
    const indices = order.map(tag => home.indexOf(tag));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  test('RecentConsultations data has exactly 3 cards with required fields', () => {
    expect(RECENT_CONSULTATIONS).toHaveLength(3);
    for (const c of RECENT_CONSULTATIONS) {
      expect(c.dayNumber).toBeGreaterThan(0);
      expect(c.vertical).toBeTruthy();
      expect(c.who).toBeTruthy();
      expect(c.pain).toBeTruthy();
      expect(c.outcome).toBeTruthy();
    }
  });

  test('RecentConsultations references the 3 spec-locked case days (96, 99, 98)', () => {
    const dayNumbers = RECENT_CONSULTATIONS.map(c => c.dayNumber).sort((a, b) => a - b);
    expect(dayNumbers).toEqual([96, 98, 99]);
  });

  test('RecentConsultations section anchors on #cases for hero CTA scroll', () => {
    const component = source('src/components/RecentConsultations.astro');
    expect(component).toContain('id="cases"');
    expect(component).toMatch(/href=\{`\/day\/\$\{c\.dayNumber\}`\}/);
  });

  test('PERSONAL_TOOLS has 3 entries and the demo-CTA cards expose their live URLs', () => {
    expect(PERSONAL_TOOLS).toHaveLength(3);

    const ipas = PERSONAL_TOOLS.find(t => t.dayNumber === 134);
    expect(ipas?.demoHref).toBe('https://ipas-quiz-eight.vercel.app/');
    expect(ipas?.demoLabel).toBeTruthy();

    const search = PERSONAL_TOOLS.find(t => t.dayNumber === 139);
    expect(search?.demoHref).toBe('/search');
    expect(search?.demoLabel).toBeTruthy();

    const arc = PERSONAL_TOOLS.find(t => t.dayNumber === 71);
    expect(arc).toBeDefined();
  });

  test('ToolsIBuilt component renders live demo links and Day-N permalinks', () => {
    const component = source('src/components/ToolsIBuilt.astro');
    expect(component).toMatch(/href=\{t\.demoHref\}/);
    expect(component).toMatch(/href=\{`\/day\/\$\{t\.dayNumber\}`\}/);
  });

  test('hero secondary CTA still points at #cases anchor', () => {
    const hero = source('src/components/Hero.astro');
    expect(hero).toContain('href="#cases"');
  });
});
