import fs from 'node:fs/promises';
import path from 'node:path';
import { copyDayAssets } from '../src/lib/copy-day-assets';

const SRC = path.resolve(import.meta.dirname, '../100days/content');
const DEST = path.resolve(import.meta.dirname, '../public/content');

// public/content/ is generated output, gitignored, and the deploy worktree that
// builds it is reused across deploys — so a stale file left here is republished
// on every build forever. Rebuild the tree from scratch instead of layering onto
// it: that is the only thing that retires a day removed upstream, whose
// per-day copy never runs again.
await fs.rm(DEST, { recursive: true, force: true });

const dirs = await fs.readdir(SRC, { withFileTypes: true });
for (const dir of dirs) {
  if (!dir.isDirectory() || !/^day\d+$/.test(dir.name)) continue;
  await copyDayAssets(path.join(SRC, dir.name), path.join(DEST, dir.name));
}
console.log('Content assets copied to public/content/');
