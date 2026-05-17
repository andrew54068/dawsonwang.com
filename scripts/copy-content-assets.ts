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
  const slidesSrc = path.join(SRC, dir.name, 'slides');
  const slidesDest = path.join(DEST, dir.name, 'slides');
  try {
    await fs.access(slidesSrc);
    await copyDir(slidesSrc, slidesDest);
  } catch {
    // No slides for this day
  }
}
console.log('Slides copied to public/content/');
