import fs from 'node:fs/promises';
import path from 'node:path';
import { parseSource, type ParsedSource } from './parse-source';
import { parseManifest, type ParsedManifest } from './parse-manifest';

export interface DayEntry extends ParsedSource {
  manifest?: ParsedManifest;
  slideFiles: string[];           // Absolute paths to slide PNGs
  coverImage?: string;            // Absolute path to cover.png if present
  contentDir: string;             // Absolute path to content/dayNN/
}

export async function loadAllDays(contentRoot: string): Promise<DayEntry[]> {
  const entries = await fs.readdir(contentRoot, { withFileTypes: true });
  const dayDirs = entries
    .filter(e => e.isDirectory() && /^day\d+$/.test(e.name))
    .map(e => path.join(contentRoot, e.name));

  const results: DayEntry[] = [];
  for (const dir of dayDirs) {
    const entry = await loadOne(dir);
    if (entry) results.push(entry);
  }
  return results.sort((a, b) => a.dayNumber - b.dayNumber);
}

async function loadOne(dir: string): Promise<DayEntry | null> {
  const sourcePath = path.join(dir, 'source.md');
  let raw: string;
  try {
    raw = await fs.readFile(sourcePath, 'utf-8');
  } catch {
    return null;
  }
  if (!raw.trim()) {
    console.warn(`[content-loader] Skipping ${path.basename(dir)}: empty source.md`);
    return null;
  }

  const dirMatch = path.basename(dir).match(/^day(\d+)$/);
  const fallbackDayNumber = dirMatch ? parseInt(dirMatch[1], 10) : undefined;

  let parsed: ParsedSource;
  try {
    parsed = parseSource(raw, fallbackDayNumber);
  } catch (err) {
    console.warn(`[content-loader] Skipping ${path.basename(dir)}: ${(err as Error).message}`);
    return null;
  }

  let manifest: ParsedManifest | undefined;
  try {
    const manifestRaw = await fs.readFile(path.join(dir, 'publish-manifest.json'), 'utf-8');
    manifest = parseManifest(JSON.parse(manifestRaw));
  } catch {
    manifest = undefined;
  }

  let slideFiles: string[] = [];
  try {
    const slidesDir = path.join(dir, 'slides');
    const all = await fs.readdir(slidesDir);
    slideFiles = all
      .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
      .sort()
      .map(f => path.join(slidesDir, f));
  } catch {
    // No slides directory — fine
  }

  let coverImage: string | undefined;
  for (const candidate of ['cover.png', 'cover.jpg', 'cover.webp']) {
    const p = path.join(dir, candidate);
    try {
      await fs.access(p);
      coverImage = p;
      break;
    } catch {
      continue;
    }
  }

  return { ...parsed, manifest, slideFiles, coverImage, contentDir: dir };
}
