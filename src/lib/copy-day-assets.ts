import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Publishes one day's binary assets into public/content/dayNNN/.
 *
 * slides/ ships wholesale — the carousel renders every slide.
 *
 * attachments/ does NOT. source.md embeds attachments as
 * ![](./attachments/photo.jpeg), which the rendered page turns into an
 * <img src="/content/dayNNN/attachments/photo.jpeg">, so those files must ship
 * or the day page 404s. But the 100Days repo is private and its attachments/
 * trees also hold working material the site never links (raw screenshots,
 * transcripts, mail captures). Copying the directory verbatim would publish all
 * of it at guessable URLs, so only the files the markdown actually references
 * are copied.
 */

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const SHARE_RE = /\.(mp4|gif)$/i;
const ATTACHMENTS_DIR = 'attachments';
const SOURCE_MARKDOWN = 'source.md';

// `attachments/<relative path>` as written in markdown, e.g. ./attachments/a.png
// or attachments/raw/deep.png. The lookbehind rejects a match that is part of a
// longer URL or path (https://host/attachments/x.png) — those are not day-local
// assets and there is nothing on disk to copy for them.
const ATTACHMENT_REF_RE = /(?<![\w:/-])(?:\.\/)?attachments\/([^\s)"'<>\]]+)/g;

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else if (IMAGE_RE.test(e.name)) await fs.copyFile(s, d);
  }
}

async function readIfPresent(filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

/** Every attachments/-relative image path the day's markdown embeds, deduped. */
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
    if (!IMAGE_RE.test(rel)) continue;
    // Keep the copy confined to the day's own attachments/ tree.
    const normalized = path.normalize(rel);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) continue;
    refs.add(normalized);
  }
  return [...refs];
}

async function copyReferencedAttachments(dayRoot: string, dayDest: string) {
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
    await copyDir(slides, path.join(dayDest, 'slides'));
  }

  await copyReferencedAttachments(dayRoot, dayDest);

  // Share artifacts (MP4/GIF) live at the day root, not in a subdirectory.
  const rootEntries = await fs.readdir(dayRoot, { withFileTypes: true });
  const shareFiles = rootEntries.filter((e) => e.isFile() && SHARE_RE.test(e.name));
  if (shareFiles.length > 0) {
    await fs.mkdir(dayDest, { recursive: true });
    for (const f of shareFiles) {
      await fs.copyFile(path.join(dayRoot, f.name), path.join(dayDest, f.name));
    }
  }
}
