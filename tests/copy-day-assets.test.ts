import { test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { copyDayAssets } from '../src/lib/copy-day-assets';

let tmp: string;
let src: string;
let dest: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'day-assets-'));
  src = path.join(tmp, 'content', 'day219');
  dest = path.join(tmp, 'public', 'content', 'day219');
  await fs.mkdir(path.join(src, 'slides'), { recursive: true });
  await fs.mkdir(path.join(src, 'attachments'), { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const exists = async (p: string) =>
  await fs.access(p).then(() => true, () => false);

test('copies slides', async () => {
  await fs.writeFile(path.join(src, 'slides', '01-cover.png'), 'png');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'slides', '01-cover.png'))).toBe(true);
});

// The Day 219 gap: source.md embeds ![](./attachments/photo.jpeg), the page
// renders an <img> for it, but the asset copy only ever walked slides/ — so
// every embedded attachment 404'd in production (day213, day218, day219).
test('copies attachments embedded by source.md', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'photo.jpeg'), 'jpeg');
  await fs.writeFile(path.join(src, 'source.md'), '![合照](./attachments/photo.jpeg)');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'photo.jpeg'))).toBe(true);
});

test('copies an attachment referenced without the leading ./', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'photo.jpeg'), 'jpeg');
  await fs.writeFile(path.join(src, 'source.md'), '![x](attachments/photo.jpeg)');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'photo.jpeg'))).toBe(true);
});

test('copies both slides and attachments in one pass', async () => {
  await fs.writeFile(path.join(src, 'slides', '01-cover.png'), 'png');
  await fs.writeFile(path.join(src, 'attachments', 'a.jpg'), 'jpg');
  await fs.writeFile(path.join(src, 'attachments', 'b.webp'), 'webp');
  await fs.writeFile(
    path.join(src, 'source.md'),
    '![a](./attachments/a.jpg)\n\n![b](./attachments/b.webp)',
  );
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'slides', '01-cover.png'))).toBe(true);
  expect(await exists(path.join(dest, 'attachments', 'a.jpg'))).toBe(true);
  expect(await exists(path.join(dest, 'attachments', 'b.webp'))).toBe(true);
});

test('skips non-image files in attachments', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'notes.md'), '# notes');
  await fs.writeFile(path.join(src, 'attachments', 'keep.png'), 'png');
  await fs.writeFile(
    path.join(src, 'source.md'),
    '[notes](./attachments/notes.md)\n\n![keep](./attachments/keep.png)',
  );
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'notes.md'))).toBe(false);
  expect(await exists(path.join(dest, 'attachments', 'keep.png'))).toBe(true);
});

// public/content/ ships to the public site; the 100Days repo it is copied from is
// private and its attachments/ trees hold unpublished working material (raw agent
// transcripts, mail screenshots). Only what the page actually renders may leave.
test('does not publish attachments the markdown never references', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'referenced.png'), 'png');
  await fs.writeFile(path.join(src, 'attachments', 'private-email.jpeg'), 'jpeg');
  await fs.writeFile(path.join(src, 'source.md'), '![shown](./attachments/referenced.png)');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'referenced.png'))).toBe(true);
  expect(await exists(path.join(dest, 'attachments', 'private-email.jpeg'))).toBe(false);
});

test('publishes nothing from attachments when the day has no source.md', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'private.png'), 'png');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'private.png'))).toBe(false);
});

// public/content/ is gitignored and the deploy worktree is reused between builds,
// so an additive copy never retires anything: files an earlier build published
// (e.g. the wholesale attachments/ copy this allow-list replaced) would keep
// shipping. The copy has to be authoritative over the destination.
test('removes an already-published attachment the markdown no longer references', async () => {
  await fs.mkdir(path.join(dest, 'attachments', 'raw'), { recursive: true });
  await fs.writeFile(path.join(dest, 'attachments', 'private-email.jpeg'), 'stale');
  await fs.writeFile(path.join(dest, 'attachments', 'raw', 'transcript.png'), 'stale');
  await fs.writeFile(path.join(src, 'attachments', 'shown.png'), 'png');
  await fs.writeFile(path.join(src, 'source.md'), '![shown](./attachments/shown.png)');

  await copyDayAssets(src, dest);

  expect(await exists(path.join(dest, 'attachments', 'private-email.jpeg'))).toBe(false);
  expect(await exists(path.join(dest, 'attachments', 'raw', 'transcript.png'))).toBe(false);
  expect(await exists(path.join(dest, 'attachments', 'shown.png'))).toBe(true);
});

test('removes already-published attachments when the day loses its source.md', async () => {
  await fs.mkdir(path.join(dest, 'attachments'), { recursive: true });
  await fs.writeFile(path.join(dest, 'attachments', 'private-email.jpeg'), 'stale');

  await copyDayAssets(src, dest);

  expect(await exists(path.join(dest, 'attachments', 'private-email.jpeg'))).toBe(false);
});

test('leaves published slides alone while pruning attachments', async () => {
  await fs.mkdir(path.join(dest, 'slides'), { recursive: true });
  await fs.writeFile(path.join(dest, 'slides', '01-cover.png'), 'png');
  await fs.writeFile(path.join(src, 'slides', '01-cover.png'), 'png');

  await copyDayAssets(src, dest);

  expect(await exists(path.join(dest, 'slides', '01-cover.png'))).toBe(true);
});

// day03/source.md points at ./attachments/day3.jpg while the file on disk is
// image.jpg — stale names exist in the content repo and must not break the build.
test('tolerates a referenced attachment that is missing on disk', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'image.jpg'), 'jpg');
  await fs.writeFile(path.join(src, 'source.md'), '![x](./attachments/day3.jpg)');
  await expect(copyDayAssets(src, dest)).resolves.not.toThrow();
  expect(await exists(path.join(dest, 'attachments', 'day3.jpg'))).toBe(false);
});

test('ignores an /attachments/ segment inside a remote URL', async () => {
  await fs.writeFile(path.join(src, 'attachments', 'a.png'), 'png');
  await fs.writeFile(path.join(src, 'source.md'), '![x](https://cdn.example/attachments/a.png)');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'a.png'))).toBe(false);
});

test('copies root-level share artifacts (mp4/gif)', async () => {
  await fs.writeFile(path.join(src, 'share.mp4'), 'mp4');
  await fs.writeFile(path.join(src, 'loop.gif'), 'gif');
  await fs.writeFile(path.join(src, 'source.md'), '# not an asset');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'share.mp4'))).toBe(true);
  expect(await exists(path.join(dest, 'loop.gif'))).toBe(true);
  expect(await exists(path.join(dest, 'source.md'))).toBe(false);
});

test('tolerates a day with neither slides nor attachments', async () => {
  const bare = path.join(tmp, 'content', 'day001');
  await fs.mkdir(bare, { recursive: true });
  await fs.writeFile(path.join(bare, 'source.md'), 'Day 1 x');
  await expect(
    copyDayAssets(bare, path.join(tmp, 'public', 'content', 'day001')),
  ).resolves.not.toThrow();
});

test('copies nested subdirectories of attachments', async () => {
  await fs.mkdir(path.join(src, 'attachments', 'raw'), { recursive: true });
  await fs.writeFile(path.join(src, 'attachments', 'raw', 'deep.png'), 'png');
  await fs.writeFile(path.join(src, 'source.md'), '![deep](./attachments/raw/deep.png)');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'attachments', 'raw', 'deep.png'))).toBe(true);
});

test('copies nested subdirectories of slides without a markdown reference', async () => {
  await fs.mkdir(path.join(src, 'slides', 'raw'), { recursive: true });
  await fs.writeFile(path.join(src, 'slides', 'raw', 'deep.png'), 'png');
  await copyDayAssets(src, dest);
  expect(await exists(path.join(dest, 'slides', 'raw', 'deep.png'))).toBe(true);
});
