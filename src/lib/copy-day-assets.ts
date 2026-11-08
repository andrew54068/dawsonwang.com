import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { findOgImage } from './content-loader';
import { publishedSlideName, SLIDE_OG_NAME } from './slide-assets';

/**
 * Publishes one day's binary assets into public/content/dayNNN/.
 *
 * slides/ ships wholesale — the carousel renders every slide — but re-encoded
 * as WebP. The source decks are 1–2 MB PNGs each; shipped as-is they were ~1 GB
 * of every deployment and blew through Vercel's Deployment Storage quota. The
 * first slide is also the day's default social card, and LINE/Facebook skip
 * WebP OG images, so it additionally ships as a JPG (SLIDE_OG_NAME).
 *
 * attachments/ does NOT. source.md embeds attachments as
 * ![](./attachments/photo.jpeg), which the rendered page turns into an
 * <img src="/content/dayNNN/attachments/photo.jpeg">, so those files must ship
 * or the day page 404s. But the 100Days repo is private and its attachments/
 * trees also hold working material the site never links (raw screenshots,
 * transcripts, mail captures). Copying the directory verbatim would publish all
 * of it at guessable URLs, so only the files the markdown actually references
 * are copied.
 *
 * That allow-list has to be authoritative, not additive: public/content/ is
 * gitignored, and the deploy worktree is reused across builds (`git reset
 * --hard` leaves gitignored dirs alone), so anything an earlier build published
 * lingers on disk and gets re-shipped forever. Each day's attachments/ output is
 * therefore deleted and rebuilt from the current markdown on every run.
 */

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
// Embedded videos render as <video> (render-markdown.ts). Only the share
// version is ever embedded; its <stem>.original.<ext> twin is never referenced.
const VIDEO_RE = /\.mp4$/i;
const SHARE_RE = /\.(mp4|gif)$/i;
const ATTACHMENTS_DIR = 'attachments';
const SOURCE_MARKDOWN = 'source.md';

// `attachments/<relative path>` as written in markdown, e.g. ./attachments/a.png
// or attachments/raw/deep.png. The lookbehind rejects a match that is part of a
// longer URL or path (https://host/attachments/x.png) — those are not day-local
// assets and there is nothing on disk to copy for them.
const ATTACHMENT_REF_RE = /(?<![\w:/-])(?:\.\/)?attachments\/([^\s)"'<>\]]+)/g;

const SLIDE_WEBP_QUALITY = 85;
const SLIDE_OG_JPEG_QUALITY = 85;

// Encoding ~1000 slides takes minutes, and the deploy worktree rebuilds
// public/content/ from scratch every run, so encoded output is cached by source
// content hash. Same bytes in -> same file out; nothing to invalidate.
const ENCODE_CACHE = path.resolve(import.meta.dirname, '../../node_modules/.cache/slide-encode');

async function encodeCached(src: string, dest: string, format: 'webp' | 'jpeg') {
  const bytes = await fs.readFile(src);
  const key = crypto.createHash('sha1').update(bytes).digest('hex');
  const cached = path.join(ENCODE_CACHE, `${key}.${format}`);
  if (!(await fs.access(cached).then(() => true, () => false))) {
    const img = sharp(bytes);
    const out = format === 'webp'
      ? await img.webp({ quality: SLIDE_WEBP_QUALITY }).toBuffer()
      : await img.flatten({ background: '#ffffff' }).jpeg({ quality: SLIDE_OG_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    await fs.mkdir(ENCODE_CACHE, { recursive: true });
    await fs.writeFile(cached, out);
  }
  await fs.copyFile(cached, dest);
}

async function copySlides(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    if (e.isDirectory()) await copySlides(s, path.join(dest, e.name));
    else if (IMAGE_RE.test(e.name)) await encodeCached(s, path.join(dest, publishedSlideName(e.name)), 'webp');
  }
}

async function readIfPresent(filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

/** Every attachments/-relative image or video path the day's markdown embeds, deduped. */
export function referencedAttachments(markdown: string): string[] {
  const refs = new Set<string>();
  for (const match of markdown.matchAll(ATTACHMENT_REF_RE)) {
    const raw = match[1];
    if (!raw) continue;
    let rel: string;
    try {
      rel = decodeURIComponent(raw);
    } catch {
      rel = raw; // a stray % that isn't an escape — take the path verbatim
    }
    if (!IMAGE_RE.test(rel) && !VIDEO_RE.test(rel)) continue;
    // Keep the copy confined to the day's own attachments/ tree.
    const normalized = path.normalize(rel);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) continue;
    refs.add(normalized);
  }
  return [...refs];
}

async function copyReferencedAttachments(dayRoot: string, dayDest: string) {
  // Drop whatever a previous build published before repopulating, so an
  // attachment that source.md no longer embeds (or that a wholesale copy shipped
  // before this allow-list existed) stops being served. Must happen before the
  // no-markdown bail-out: a day that loses its source.md must lose its output too.
  await fs.rm(path.join(dayDest, ATTACHMENTS_DIR), { recursive: true, force: true });

  const markdown = await readIfPresent(path.join(dayRoot, SOURCE_MARKDOWN));
  if (!markdown) return; // no rendered markdown -> nothing embeds an attachment

  for (const rel of referencedAttachments(markdown)) {
    const src = path.join(dayRoot, ATTACHMENTS_DIR, rel);
    try {
      await fs.access(src);
    } catch {
      // Referenced but absent: a stale filename in the content repo. Skipping is
      // right (the page already 404s), but say so — it is otherwise invisible.
      console.warn(
        `[copy-day-assets] ${path.basename(dayRoot)}: ${SOURCE_MARKDOWN} references missing ${ATTACHMENTS_DIR}/${rel}`,
      );
      continue;
    }
    const dest = path.join(dayDest, ATTACHMENTS_DIR, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

export async function copyDayAssets(dayRoot: string, dayDest: string) {
  const slides = path.join(dayRoot, 'slides');
  if (await fs.access(slides).then(() => true, () => false)) {
    await copySlides(slides, path.join(dayDest, 'slides'));
    // Same pick as content-loader's slideFiles[0]: top-level images, sorted.
    const first = (await fs.readdir(slides)).filter((f) => IMAGE_RE.test(f)).sort()[0];
    if (first) await encodeCached(path.join(slides, first), path.join(dayDest, SLIDE_OG_NAME), 'jpeg');
  }

  await copyReferencedAttachments(dayRoot, dayDest);

  // Share artifacts (MP4/GIF) and the explicit social-card image live at the day
  // root, not in a subdirectory.
  const rootEntries = await fs.readdir(dayRoot, { withFileTypes: true });

  // Explicit per-day social-card image (og.jpg/og.jpeg/og.png). A day with no
  // slide deck otherwise shares the site-wide og-default.png; this gives one post
  // its own card. Only this exact basename ships — no other day-root image is
  // published. JPG/PNG only (LINE/Facebook crawlers skip WebP OG images).
  const OG_RE = /^og\.(jpe?g|png)$/i;
  // Retire stale cards before the no-source check, just like attachments.
  await fs.mkdir(dayDest, { recursive: true });
  for (const name of await fs.readdir(dayDest)) {
    if (OG_RE.test(name)) await fs.rm(path.join(dayDest, name), { force: true });
  }
  const markdown = await readIfPresent(path.join(dayRoot, SOURCE_MARKDOWN));
  const ogImage = markdown?.trim() ? await findOgImage(dayRoot) : undefined;
  if (ogImage) {
    await fs.copyFile(ogImage, path.join(dayDest, path.basename(ogImage)));
  }

  const shareFiles = rootEntries.filter((e) => e.isFile() && SHARE_RE.test(e.name));
  if (shareFiles.length > 0) {
    await fs.mkdir(dayDest, { recursive: true });
    for (const f of shareFiles) {
      await fs.copyFile(path.join(dayRoot, f.name), path.join(dayDest, f.name));
    }
  }
}
