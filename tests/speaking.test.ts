import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ENGAGEMENTS, TESTIMONIALS } from '../src/data/speaking';

interface ProofTestimonial {
  id: string;
  engagementSlug: string;
  theme: string;
  quote: string;
  attribution: string;
  shareApproved: true;
}

interface LecturePhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface LectureSession {
  id: string;
  date: string;
  venue: string;
  title: string;
  photos: LecturePhoto[];
}

type SpeakingModule = typeof import('../src/data/speaking') & {
  LECTURE_SESSIONS?: LectureSession[];
};

const engagementSlugs = new Set(ENGAGEMENTS.map(engagement => engagement.slug));
const privateContactPattern = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s-]{7,}\d)/i;

describe('speaking proof content', () => {
  test('exposes the warm home-style hooks on the speaking route', () => {
    const pageSource = readFileSync(path.join(process.cwd(), 'src/pages/speaking.astro'), 'utf8');

    expect(pageSource).toContain('home-warm');
    expect(pageSource).toContain('speaking-warm');
    expect(pageSource).toContain('data-lecture-session');
  });

  test('keeps engagement slugs unique for resolved testimonial and slide joins', () => {
    expect(engagementSlugs.size).toBe(ENGAGEMENTS.length);
  });

  test('ships a small public-safe set of approved lecture testimonials', () => {
    const testimonials = TESTIMONIALS as ProofTestimonial[];

    expect(testimonials.length).toBeGreaterThanOrEqual(4);
    expect(testimonials.length).toBeLessThanOrEqual(6);

    const ids = new Set(testimonials.map(testimonial => testimonial.id));
    const quotes = new Set(testimonials.map(testimonial => testimonial.quote));
    expect(ids.size).toBe(testimonials.length);
    expect(quotes.size).toBe(testimonials.length);

    const themesByEngagement = new Map<string, Set<string>>();

    for (const testimonial of testimonials) {
      expect(testimonial.id).toMatch(/^[a-z0-9-]+$/);
      expect(engagementSlugs.has(testimonial.engagementSlug)).toBe(true);
      expect(testimonial.shareApproved).toBe(true);
      expect(testimonial.quote).toBe(testimonial.quote.trim());
      expect(testimonial.quote.length).toBeGreaterThanOrEqual(10);
      expect(testimonial.attribution).toContain('中正高工');
      expect(testimonial.attribution).not.toMatch(privateContactPattern);
      expect(testimonial.quote).not.toMatch(privateContactPattern);

      const seenThemes = themesByEngagement.get(testimonial.engagementSlug) ?? new Set<string>();
      expect(seenThemes.has(testimonial.theme)).toBe(false);
      seenThemes.add(testimonial.theme);
      themesByEngagement.set(testimonial.engagementSlug, seenThemes);
    }
  });

  test('maps three to five unique optimized photos to each lecture, except the two-photo Tainan Hospital session', async () => {
    const speaking = await import('../src/data/speaking') as SpeakingModule;
    const sessions = speaking.LECTURE_SESSIONS;

    expect(Array.isArray(sessions)).toBe(true);
    if (!Array.isArray(sessions)) return;

    expect(sessions.map(session => session.date)).toEqual([
      '2026-06-27',
      '2026-07-04',
      '2026-07-16',
      '2026-07-31',
      '2026-08-04',
      '2026-08-05',
      '2026-09-07',
      '2026-09-17',
      '2026-09-21',
    ]);

    const ids = new Set(sessions.map(session => session.id));
    const imagePaths = new Set(sessions.flatMap(session => session.photos.map(photo => photo.src)));
    expect(ids.size).toBe(sessions.length);
    expect(imagePaths.size).toBe(sessions.reduce((total, session) => total + session.photos.length, 0));

    for (const session of sessions) {
      expect(session.id).toMatch(/^[a-z0-9-]+$/);
      expect(session.venue.trim().length).toBeGreaterThan(3);
      expect(session.title.trim().length).toBeGreaterThan(5);
      if (session.id === 'tainan-hospital-0731') {
        expect(session.photos).toHaveLength(2);
      } else {
        expect(session.photos.length).toBeGreaterThanOrEqual(3);
        expect(session.photos.length).toBeLessThanOrEqual(5);
      }

      for (const photo of session.photos) {
        expect(photo.src).toMatch(/^\/speaking\/.+\.(webp|avif)$/);
        expect(photo.alt.trim().length).toBeGreaterThan(20);
        expect(photo.width).toBeGreaterThan(0);
        expect(photo.height).toBeGreaterThan(0);

        const assetPath = path.join(process.cwd(), 'public', photo.src.replace(/^\/+/, ''));
        expect(existsSync(assetPath)).toBe(true);
        expect(statSync(assetPath).size).toBeLessThan(500_000);
      }
    }
  });
});
