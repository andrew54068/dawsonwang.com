import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '../100days/content');
const DEST = path.resolve(import.meta.dirname, '../public/content');

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else if (/\.(png|jpe?g|webp)$/i.test(e.name)) await fs.copyFile(s, d);
  }
}

const dirs = await fs.readdir(SRC, { withFileTypes: true });
for (const dir of dirs) {
  if (!dir.isDirectory() || !/^day\d+$/.test(dir.name)) continue;
  const dayRoot = path.join(SRC, dir.name);
  const dayDest = path.join(DEST, dir.name);

  // Copy slides (PNG/JPEG/WebP)
  const slidesSrc = path.join(dayRoot, 'slides');
  try {
    await fs.access(slidesSrc);
    await copyDir(slidesSrc, path.join(dayDest, 'slides'));
  } catch {
    // No slides for this day
  }

  // Copy share artifacts (MP4/GIF) from day root
  const rootEntries = await fs.readdir(dayRoot, { withFileTypes: true });
  const shareFiles = rootEntries.filter(e => e.isFile() && /\.(mp4|gif)$/i.test(e.name));
  if (shareFiles.length > 0) {
    await fs.mkdir(dayDest, { recursive: true });
    for (const f of shareFiles) {
      await fs.copyFile(path.join(dayRoot, f.name), path.join(dayDest, f.name));
    }
  }
}
console.log('Content assets copied to public/content/');
