import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Publishes one day's binary assets into public/content/dayNNN/.
 *
 * Both slides/ and attachments/ ship: source.md embeds attachments as
 * ![](./attachments/photo.jpeg), which the rendered page turns into an
 * <img src="/content/dayNNN/attachments/photo.jpeg">. Copying only slides/
 * left every one of those 404ing in production.
 */

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const SHARE_RE = /\.(mp4|gif)$/i;

/** Asset subdirectories copied verbatim (images only, recursively). */
const ASSET_DIRS = ['slides', 'attachments'] as const;

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

export async function copyDayAssets(dayRoot: string, dayDest: string) {
  for (const dir of ASSET_DIRS) {
    const src = path.join(dayRoot, dir);
    try {
      await fs.access(src);
    } catch {
      continue; // this day has no such directory
    }
    await copyDir(src, path.join(dayDest, dir));
  }

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
