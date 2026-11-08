// Published slide filenames, shared by the asset copy (copy-day-assets.ts) and
// the day page. Kept apart from copy-day-assets so the page doesn't import sharp.

/** Day-root filename of the JPG social card cut from the first slide. */
export const SLIDE_OG_NAME = 'og-slide.jpg';

/** Published filename for a slide source file: `01-cover.png` -> `01-cover.webp`. */
export function publishedSlideName(name: string): string {
  return name.replace(/\.(png|jpe?g|webp)$/i, '.webp');
}
