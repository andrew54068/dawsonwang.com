#!/usr/bin/env -S npx tsx
//
// deploy-local.ts — build dawsonwang.com locally and deploy the prebuilt output
// to Vercel production, with ZERO GitHub dependency (the GitHub account is
// suspended, so Vercel's Git integration + the sync-100days Action + the
// vercel-install.sh submodule clone are all dead).
//
// It replaces the old content-pipeline Phase 6.7 (git push → gh workflow run
// sync-100days → Vercel git rebuild → poll) with a fully local flow:
//
//   0. Categorize any new day into /topics (scripts/categorize-days.ts) and
//      commit the tags to the deploy ref — the worktree in step 1 is reset to
//      that ref, so an uncommitted tag would never reach the build.
//   1. Ensure an isolated git worktree pinned to the deploy ref (default: main),
//      so your working branch (e.g. the redesign) is never disturbed.
//   2. Refresh the site's content from the canonical 100Days working tree (rsync,
//      offline — the submodule can't fetch from suspended GitHub).
//   3. Build locally with `yarn build` (NOT `vercel build`, which runs
//      vercel.json installCommand=vercel-install.sh and needs GITHUB_TOKEN).
//      Runs offline by default so a Cloudflare hiccup can't block a publish.
//   4. Re-insert vercel.json security headers into .vercel/output/config.json
//      (a bare astro build drops them — see scripts/lib/merge-output-headers.ts).
//   5. `vercel deploy --prebuilt --prod` (skips the GitHub install hook), then
//      poll the production /day/N URL until it's live.
//
// Usage:
//   npx tsx scripts/deploy-local.ts [--day N] [--dry-run] [--fresh-semantic] [--no-poll]
//                                   [--skip-categorize]
//
//   --dry-run         Build + verify output, DO NOT deploy or poll (studio dry-runs
//                     and local checks use this — no VERCEL_TOKEN needed). Still
//                     categorizes, but never commits.
//   --day N           The day number to verify in the build and poll after deploy.
//   --fresh-semantic  Try a networked semantic-index rebuild (needs CF_* keys),
//                     falling back to the offline build if it fails.
//   --no-poll         Deploy but skip the post-deploy production poll.
//   --skip-categorize Don't auto-tag new days into /topics (see step 0).
//
// One-time setup (see scripts/DEPLOY.md):
//   npx vercel@latest link              # pick the existing dawsonwang.com project (writes .vercel/project.json)
//   echo 'VERCEL_TOKEN=…' >> .env        # from https://vercel.com/account/tokens (Email login — GitHub NOT required)
// Real deploys AUTHENTICATE WITH VERCEL_TOKEN (from .env), scoped to the linked project
// via .vercel/project.json — never a `vercel login` session, which may be tied to the
// suspended GitHub account. Only --dry-run runs without a token.
//
// Config (env overrides, all optional):
//   DAWSONWANG_DIR    site repo (default: this repo's location)
//   CONTENT_SRC       canonical content dir (default: ../../100Days/content resolved absolutely)
//   DEPLOY_WORKTREE   worktree path (default: sibling .dawsonwang-deploy)
//   DEPLOY_REF        git ref to deploy (default: main)
//   VERCEL_TOKEN / VERCEL_PROJECT_ID / VERCEL_ORG_ID   (token also read from .env)

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { mergeVercelHeadersIntoConfig } from './lib/merge-output-headers';
import { categorizeNewDays, listContentDays, resolveContentDir } from './categorize-days';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = process.env.DAWSONWANG_DIR ?? path.resolve(HERE, '..');
const CONTENT_SRC = process.env.CONTENT_SRC ?? '/Users/dawson/Documents/100Days/content';
const WORKTREE = process.env.DEPLOY_WORKTREE ?? path.resolve(SITE_DIR, '..', '.dawsonwang-deploy');
const DEPLOY_REF = process.env.DEPLOY_REF ?? 'main';
const PROD_HOST = 'https://dawsonwang.com';
// Pinnable so a poisoned `vercel@latest` release can't run with the token in env.
// Pin to a vetted version in .env (VERCEL_CLI=vercel@<version>) for supply-chain safety.
const VERCEL_CLI = process.env.VERCEL_CLI ?? fromEnvFile('VERCEL_CLI') ?? 'vercel@latest';

interface Args { dryRun: boolean; freshSemantic: boolean; noPoll: boolean; skipCategorize: boolean; day?: number }

function parseArgs(argv: string[]): Args {
  const a: Args = { dryRun: false, freshSemantic: false, noPoll: false, skipCategorize: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--dry-run') a.dryRun = true;
    else if (t === '--fresh-semantic') a.freshSemantic = true;
    else if (t === '--no-poll') a.noPoll = true;
    else if (t === '--skip-categorize') a.skipCategorize = true;
    else if (t === '--day') a.day = Number(argv[++i]);
    else if (t.startsWith('--day=')) a.day = Number(t.slice('--day='.length));
    else throw new Error(`unknown argument: ${t}`);
  }
  if (a.day !== undefined && !Number.isInteger(a.day)) throw new Error('--day must be an integer');
  return a;
}

function log(msg: string) { console.log(`[deploy] ${msg}`); }

function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv; capture?: boolean } = {}): string {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd ?? SITE_DIR,
    env: opts.env ?? process.env,
    encoding: 'utf8',
    stdio: opts.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
  });
  if (res.status !== 0) {
    throw new Error(`command failed (exit ${res.status ?? 'signal ' + res.signal}): ${cmd} ${args.join(' ')}`);
  }
  return (res.stdout ?? '').toString();
}

function git(args: string[], cwd = SITE_DIR): string {
  return run('git', args, { cwd, capture: true }).trim();
}

/** Read a KEY from the site's .env (used for VERCEL_TOKEN / CF_* on pipeline runs). */
function fromEnvFile(key: string): string | undefined {
  const envPath = path.join(SITE_DIR, '.env');
  if (!existsSync(envPath)) return undefined;
  for (const raw of readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
  }
  return undefined;
}

/** Real deploys REQUIRE the project's Vercel token (env or the site's .env) so auth is
 *  the token itself — never a `vercel login` session that may be tied to the suspended
 *  GitHub account. Dry-runs deploy nothing, so they need no token. */
function resolveToken(dryRun: boolean): string {
  const token = (process.env.VERCEL_TOKEN || fromEnvFile('VERCEL_TOKEN') || '').trim();
  if (!token && !dryRun) {
    throw new Error(
      'VERCEL_TOKEN is required for a real deploy but was not found. Create a token at ' +
      'https://vercel.com/account/tokens (Email login — GitHub NOT required) and add VERCEL_TOKEN=… to ' +
      path.join(SITE_DIR, '.env') +
      '. The deploy authenticates with this token, scoped to the linked project via ' +
      '.vercel/project.json — GitHub is never a dependency. See scripts/DEPLOY.md',
    );
  }
  return token;
}

/** Fail fast (before a multi-minute build) if the Vercel token is missing/expired. */
function ensureAuth(token: string): void {
  const env = { ...process.env } as NodeJS.ProcessEnv;
  if (token) env.VERCEL_TOKEN = token;
  const res = spawnSync('npx', [VERCEL_CLI, 'whoami'], { cwd: SITE_DIR, env, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    throw new Error(
      'Vercel token rejected (whoami failed) — the VERCEL_TOKEN in ' + path.join(SITE_DIR, '.env') +
      ' is missing or expired. Create a fresh token at https://vercel.com/account/tokens ' +
      '(Email login — GitHub is NOT required) and update .env. See scripts/DEPLOY.md',
    );
  }
  log(`vercel auth OK (${(res.stdout || '').trim() || 'logged in'})`);
}

const TOPICS_REL = 'src/data/topics.ts';

/** Day numbers tagged in topics.ts *as committed on DEPLOY_REF* — what the build sees. */
function taggedOnRef(): Set<number> | null {
  try {
    const committed = git(['show', `${DEPLOY_REF}:${TOPICS_REL}`]);
    return new Set([...committed.matchAll(/^\s*(\d+)\s*:\s*\[/gm)].map(m => parseInt(m[1], 10)));
  } catch {
    return null; // topics.ts not on the ref (unlikely) — nothing to compare against
  }
}

/** Days that exist in content but carry no topic on the ref about to be built. */
function daysMissingFromRef(): number[] {
  const tagged = taggedOnRef();
  if (!tagged) return [];
  try {
    return listContentDays(resolveContentDir(CONTENT_SRC))
      .map(d => d.day)
      .filter(d => !tagged.has(d))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * Step 0 — tag any new day into /topics and commit it to DEPLOY_REF.
 *
 * The commit is not incidental: ensureWorktree() resets the build worktree to
 * DEPLOY_REF, so a tag that is merely written to disk would be discarded before
 * the build ever sees it. Committing is what makes the new day appear on /topics.
 *
 * The decision to commit is keyed off what's MISSING ON THE REF, not off "did
 * this run write something". Those differ: categorizeNewDays() reads DAY_TOPICS
 * from the working-tree file, so once a day has been written but not committed
 * (a prior run that hit the guard, or a manual `yarn categorize`), it looks
 * "already tagged" on disk and no further run would ever commit it — /topics
 * would stay incomplete forever while every deploy reported success.
 *
 * Guarded so an unattended 08:00 run can never sweep up in-progress work: it
 * commits only when no OTHER path is already staged AND HEAD is on DEPLOY_REF.
 * Otherwise it leaves the file written and says exactly what to run.
 */
function categorize(args: Args): void {
  if (args.skipCategorize) { log('skipping day categorization (--skip-categorize)'); return; }

  let tagged: Awaited<ReturnType<typeof categorizeNewDays>>['tagged'];
  try {
    ({ tagged } = categorizeNewDays({ contentDir: CONTENT_SRC, dryRun: args.dryRun }));
  } catch (e) {
    // Never let tagging break a publish — the day pages themselves don't depend on it.
    log(`WARNING: categorization failed (${(e as Error).message}); continuing without new topic tags`);
    return;
  }

  if (tagged.length) {
    log(`categorizing ${tagged.length} new day(s) for /topics…`);
    for (const t of tagged) {
      log(`  day${t.day} → ${t.slugs.join(', ')}${t.lowConfidence ? '   ⚠ low confidence — review this one' : ''}`);
    }
  }

  if (args.dryRun) {
    log(`dry-run: ${TOPICS_REL} not written, not committed`);
    return;
  }

  const missing = daysMissingFromRef();
  if (missing.length === 0) {
    log(`every content day is tagged for /topics on ${DEPLOY_REF}`);
    return;
  }

  // Only a working-tree edit can close the gap; if the file already matches the
  // ref there is nothing to commit and verifyTopicsCoverage() will say so.
  const pending = git(['diff', '--name-only', DEPLOY_REF, '--', TOPICS_REL]).trim();
  if (!pending) {
    log(`WARNING: day ${missing.join(', ')} still untagged and ${TOPICS_REL} matches ${DEPLOY_REF} — nothing to commit`);
    return;
  }

  commitTopics(missing);
}

function commitTopics(days: number[]): void {
  const bail = (why: string) => {
    log(`WARNING: ${why}`);
    log(`  ${TOPICS_REL} is written but UNCOMMITTED, so day ${days.join(', ')} will NOT appear on /topics in this deploy.`);
    log(`  Finish manually:  git add ${TOPICS_REL} && git commit -m 'content(topics): tag day${days[0]}'`);
  };

  // Only ALREADY-STAGED changes to other paths are dangerous: the commit below
  // stages topics.ts by path and runs without -a, so unstaged edits and
  // untracked files cannot be swept into it. Blocking on those too would strand
  // the tags on any day there's a scratch file lying around — which is most days.
  const staged = git(['status', '--porcelain'])
    .split('\n')
    .filter(Boolean)
    .map(line => ({ index: line[0], path: line.slice(3).split(' -> ').pop()! }))
    .filter(e => e.index !== ' ' && e.index !== '?' && e.path !== TOPICS_REL);

  if (staged.length) {
    log(`WARNING: refusing to auto-commit — ${staged.length} other path(s) are already staged:`);
    for (const e of staged.slice(0, 5)) log(`    ${e.path}`);
    if (staged.length > 5) log(`    … and ${staged.length - 5} more`);
    bail('committing now would fold that staged work into the topics commit');
    return;
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch !== DEPLOY_REF) {
    bail(`HEAD is on '${branch}' but this deploy builds '${DEPLOY_REF}' — a commit here would land on the wrong branch`);
    return;
  }

  const list = days.length === 1 ? `day${days[0]}` : `day${days[days.length - 1]}–day${days[0]}`;
  git(['add', TOPICS_REL]);
  git(['commit', '-m', `content(topics): categorize ${list} for /topics`]);
  log(`committed ${TOPICS_REL} to ${DEPLOY_REF} (${git(['rev-parse', '--short', 'HEAD'])})`);
}

/**
 * Warn when the ref about to be built is missing tags for days that exist in
 * content. Catches the case where a previous run wrote topics.ts but couldn't
 * commit it — from then on those days look "already tagged" on disk, so
 * categorize() goes quiet while /topics stays incomplete.
 */
function verifyTopicsCoverage(): void {
  const missing = daysMissingFromRef();
  if (missing.length) {
    log(`WARNING: ${missing.length} day(s) missing from ${TOPICS_REL} on ${DEPLOY_REF}: ${missing.join(', ')}`);
    log(`  They will build as day pages but will NOT be listed on /topics.`);
    log(`  Fix with:  yarn categorize && git add ${TOPICS_REL} && git commit -m 'content(topics): tag missing days'`);
  }
}

function ensureWorktree(): void {
  const sha = git(['rev-parse', DEPLOY_REF]);
  const linkedGit = path.join(WORKTREE, '.git');
  if (!existsSync(WORKTREE)) {
    log(`creating deploy worktree at ${WORKTREE} pinned to ${DEPLOY_REF} (${sha.slice(0, 8)})`);
    // Clear any stale registration (e.g. the dir was deleted out-of-band without
    // `git worktree remove`) so `add` doesn't fatal with "already registered".
    git(['worktree', 'prune']);
    git(['worktree', 'add', '--detach', '--force', WORKTREE, sha]);
  } else if (existsSync(linkedGit)) {
    log(`refreshing deploy worktree to ${DEPLOY_REF} (${sha.slice(0, 8)})`);
    git(['reset', '--hard', sha], WORKTREE);
  } else {
    throw new Error(`${WORKTREE} exists but is not a git worktree — remove it or set DEPLOY_WORKTREE`);
  }
}

function isEmptyDir(p: string): boolean {
  try { return readdirSync(p).length === 0; } catch { return true; }
}

/** Seed the worktree's gitignored index dirs from the main repo so an offline
 *  build has a semantic index to ship and a warm hash-cache for --fresh-semantic. */
function seedSearchIndex(): void {
  const src = path.join(SITE_DIR, 'public', 'search');
  const dst = path.join(WORKTREE, 'public', 'search');
  if (existsSync(src) && !isEmptyDir(src) && isEmptyDir(dst)) {
    mkdirSync(dst, { recursive: true });
    log('seeding public/search (existing gitignored semantic index) into worktree');
    run('rsync', ['-a', src + '/', dst + '/'], { capture: true });
  }
}

function refreshContent(): void {
  const dst = path.join(WORKTREE, '100days', 'content');
  mkdirSync(dst, { recursive: true });
  log(`rsync content ${CONTENT_SRC} → ${dst}`);
  // Trailing slashes on BOTH sides + content-scoped --delete: safe because the
  // submodule's `.git` file is a sibling of content/, never inside it.
  run('rsync', ['-a', '--delete', '--exclude=.DS_Store', '--exclude=pending/', CONTENT_SRC + '/', dst + '/'], { capture: true });
}

function build(args: Args): void {
  run('yarn', ['install', '--immutable'], { cwd: WORKTREE });
  const base = { ...process.env } as NodeJS.ProcessEnv;
  if (args.freshSemantic) {
    const cf = { ...base, CF_ACCOUNT_ID: fromEnvFile('CF_ACCOUNT_ID') ?? process.env.CF_ACCOUNT_ID ?? '', CF_API_TOKEN: fromEnvFile('CF_API_TOKEN') ?? process.env.CF_API_TOKEN ?? '' };
    try {
      log('building with fresh semantic index (networked)…');
      run('yarn', ['build'], { cwd: WORKTREE, env: cf });
      return;
    } catch (e) {
      log(`networked build failed (${(e as Error).message}); falling back to offline build`);
    }
  }
  // Offline build: force the semantic step to skip so Cloudflare can't block a publish.
  // Only build-time scripts are affected — /api/embed resolves these keys per request
  // from the Vercel project's env (src/lib/runtime-env.ts), never from the build.
  log('building offline (CF_ACCOUNT_ID/CF_API_TOKEN unset → semantic step ships the seeded index)…');
  run('yarn', ['build'], { cwd: WORKTREE, env: { ...base, CF_ACCOUNT_ID: '', CF_API_TOKEN: '' } });
}

function applyHeaders(): void {
  const cfgPath = path.join(WORKTREE, '.vercel', 'output', 'config.json');
  const vercelJsonPath = path.join(WORKTREE, 'vercel.json');
  if (!existsSync(cfgPath)) throw new Error(`.vercel/output/config.json missing after build (${cfgPath})`);
  const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf8'));
  const config = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const { config: merged, added } = mergeVercelHeadersIntoConfig(vercelJson, config);
  writeFileSync(cfgPath, JSON.stringify(merged, null, 2));
  log(`merged ${added} vercel.json header route(s) into build output config`);
  const serialized = JSON.stringify(merged);
  if (!serialized.includes('Content-Security-Policy')) {
    throw new Error('Content-Security-Policy missing from build output after merge — refusing to deploy without security headers');
  }
}

function verifyOutput(args: Args): void {
  const staticDir = path.join(WORKTREE, '.vercel', 'output', 'static');
  if (!existsSync(path.join(staticDir, 'index.html'))) throw new Error('build output missing static/index.html');
  if (args.day !== undefined) {
    const dayHtml = path.join(staticDir, 'day', String(args.day), 'index.html');
    if (!existsSync(dayHtml)) throw new Error(`build output missing day/${args.day}/index.html — did content sync include day${args.day}?`);
    log(`verified day/${args.day} page is present in build output`);
  }
}

function ensureProjectLink(): void {
  const dst = path.join(WORKTREE, '.vercel', 'project.json');
  if (existsSync(dst)) return;
  if (process.env.VERCEL_PROJECT_ID && process.env.VERCEL_ORG_ID) return; // env-only linking
  const src = path.join(SITE_DIR, '.vercel', 'project.json');
  if (existsSync(src)) {
    mkdirSync(path.dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    log('copied .vercel/project.json into worktree (targets the existing project)');
    return;
  }
  throw new Error(
    'Vercel project not linked. Run once in ' + SITE_DIR + ':\n' +
    '  VERCEL_TOKEN=… npx vercel@latest link   # pick the existing dawsonwang.com project\n' +
    'or set VERCEL_PROJECT_ID + VERCEL_ORG_ID in the environment.',
  );
}

function deploy(token: string): string {
  ensureProjectLink();
  log('deploying prebuilt output to production…');
  const env = { ...process.env } as NodeJS.ProcessEnv;
  if (token) env.VERCEL_TOKEN = token; // token in env, never --token (ps-visible)
  const out = run('npx', [VERCEL_CLI, 'deploy', '--prebuilt', '--prod', '--archive=tgz'], {
    cwd: WORKTREE,
    env,
    capture: true,
  });
  const url = out.trim().split('\n').map((l) => l.trim()).reverse().find((l) => l.startsWith('https://')) ?? '';
  log(`deployment URL: ${url || '(not captured — check output above)'}`);
  return url;
}

async function poll(day: number): Promise<void> {
  const url = `${PROD_HOST}/day/${day}`;
  log(`polling ${url} until HTTP 200 (max 5 min)…`);
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status === 200) { log(`live after ~${(attempt - 1) * 10}s`); return; }
      log(`attempt ${attempt}/30: HTTP ${res.status}`);
    } catch (e) {
      log(`attempt ${attempt}/30: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error(`${url} still not 200 after 5 min — deploy may have failed; investigate before publishing social posts`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = resolveToken(args.dryRun);
  if (!args.dryRun) ensureAuth(token); // fail fast before a multi-minute build if the token is missing/expired

  categorize(args);        // must precede ensureWorktree: it resets the worktree to DEPLOY_REF
  verifyTopicsCoverage();

  ensureWorktree();
  seedSearchIndex();
  refreshContent();
  build(args);
  applyHeaders();
  verifyOutput(args);

  if (args.dryRun) {
    log('dry-run: build + headers + output verified. Skipping deploy and poll.');
    return;
  }
  deploy(token);
  if (!args.noPoll && args.day !== undefined) await poll(args.day);
  log('done.');
}

main().catch((e) => { console.error(`[deploy] ERROR: ${e.message}`); process.exit(1); });
