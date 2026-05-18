import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'dist/pagefind');
const DEST = path.join(ROOT, '.vercel/output/static/pagefind');

try {
  await fs.access(SRC);
} catch {
  console.log('[sync-pagefind] dist/pagefind missing — did pagefind run? Skipping.');
  process.exit(0);
}

try {
  await fs.access(path.join(ROOT, '.vercel/output/static'));
} catch {
  console.log('[sync-pagefind] .vercel/output/static missing — not a Vercel build. Skipping.');
  process.exit(0);
}

await fs.rm(DEST, { recursive: true, force: true });
await fs.cp(SRC, DEST, { recursive: true });
console.log(`[sync-pagefind] Copied dist/pagefind → .vercel/output/static/pagefind`);
