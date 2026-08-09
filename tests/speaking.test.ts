import { existsSync, statSync } from 'node:fs';
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

interface SpeakingProofSlide {
  id: string;
  engagementSlug: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  caption: string;
  testimonialId?: string;
}

type SpeakingModule = typeof import('../src/data/speaking') & {
  SPEAKING_PROOF_SLIDES?: SpeakingProofSlide[];
};

const engagementSlugs = new Set(ENGAGEMENTS.map(engagement => engagement.slug));
const privateContactPattern = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s-]{7,}\d)/i;

describe('speaking proof content', () => {
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

  test('uses a curated set of optimized public proof images instead of a raw gallery dump', async () => {
    const speaking = await import('../src/data/speaking') as SpeakingModule;
    const slides = speaking.SPEAKING_PROOF_SLIDES;
    const testimonialIds = new Set((TESTIMONIALS as ProofTestimonial[]).map(testimonial => testimonial.id));

    expect(Array.isArray(slides)).toBe(true);
    if (!Array.isArray(slides)) return;

    expect(slides.length).toBeGreaterThanOrEqual(4);
    expect(slides.length).toBeLessThanOrEqual(6);

    const ids = new Set(slides.map(slide => slide.id));
    const imagePaths = new Set(slides.map(slide => slide.image.src));
    expect(ids.size).toBe(slides.length);
    expect(imagePaths.size).toBe(slides.length);

    for (const slide of slides) {
      expect(slide.id).toMatch(/^[a-z0-9-]+$/);
      expect(engagementSlugs.has(slide.engagementSlug)).toBe(true);
      expect(slide.image.src).toMatch(/^\/speaking\/.+\.(webp|avif)$/);
      expect(slide.image.alt.trim().length).toBeGreaterThan(20);
      expect(slide.caption.trim().length).toBeGreaterThan(10);
      expect(slide.image.width).toBeGreaterThan(0);
      expect(slide.image.height).toBeGreaterThan(0);

      if (slide.testimonialId) {
        expect(testimonialIds.has(slide.testimonialId)).toBe(true);
      }

      const assetPath = path.join(process.cwd(), 'public', slide.image.src.replace(/^\/+/, ''));
      expect(existsSync(assetPath)).toBe(true);
      expect(statSync(assetPath).size).toBeLessThan(500_000);
    }
  });
});
