import fs from 'node:fs/promises';
import path from 'node:path';
import { copyDayAssets } from '../src/lib/copy-day-assets';

const SRC = path.resolve(import.meta.dirname, '../100days/content');
const DEST = path.resolve(import.meta.dirname, '../public/content');

const dirs = await fs.readdir(SRC, { withFileTypes: true });
for (const dir of dirs) {
  if (!dir.isDirectory() || !/^day\d+$/.test(dir.name)) continue;
  await copyDayAssets(path.join(SRC, dir.name), path.join(DEST, dir.name));
}
console.log('Content assets copied to public/content/');
