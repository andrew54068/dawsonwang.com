# Local Vercel deploy (GitHub-free)

While the GitHub account (`andrew54068`) is suspended, dawsonwang.com cannot deploy
through Vercel's Git integration — the `sync-100days.yml` Action, the Vercel git
rebuild, and `scripts/vercel-install.sh` (which clones the private 100Days submodule
with a `GITHUB_TOKEN`) are all dead.

`scripts/deploy-local.ts` replaces that whole chain with a local build + prebuilt
upload. No GitHub anywhere in the path.

## One-time setup

Auth is a `vercel login` session **or** a `VERCEL_TOKEN` — a token is NOT required.

1. **Log in** (Vercel login is separate from GitHub — choose **Email**; GitHub is not needed):

   ```bash
   cd /Users/dawson/Documents/side-projects/dawsonwang.com
   npx vercel@latest login        # pick "Continue with Email"
   ```

2. **Link the existing project** (writes `.vercel/project.json` — pick the real
   dawsonwang.com project, do NOT create a new one):

   ```bash
   npx vercel@latest link
   ```

That's it — the login session persists on this Mac, so Phase 6.7 deploys hands-off.

**Optional (CI-grade / more robust than a login session):** create a token and add it to
the gitignored `.env`. As of 2026 the page is **https://vercel.com/account/tokens** — or
avatar/scope dropdown (top-left) → **Settings** → **Tokens** → **Create**. Make sure the
top-left scope is your **Personal Account**, not a Team. Then:

```bash
echo 'VERCEL_TOKEN=xxxxx' >> .env
```

You can also mint one from the CLI *once you already have a classic token*:
`npx vercel@latest tokens add "dawsonwang deploy"` (a fresh `vercel login` session alone
cannot mint tokens).

## Usage

```bash
# Full production deploy of the latest content, then poll /day/N until live:
npx tsx scripts/deploy-local.ts --day 185

# Build + verify only, no deploy (studio dry-runs, or a local sanity check — no token needed):
npx tsx scripts/deploy-local.ts --day 185 --dry-run

# Refresh the semantic search index for new days too (needs CF_* keys in .env; falls back to offline on failure):
npx tsx scripts/deploy-local.ts --day 185 --fresh-semantic
```

## How it works

1. **Isolated worktree** — builds `main` in `../.dawsonwang-deploy` (a detached git
   worktree), so your current working branch and uncommitted edits are never touched.
2. **Content refresh** — `rsync` from `/Users/dawson/Documents/100Days/content` into
   the worktree's `100days/content` (the submodule can't fetch from suspended GitHub).
3. **Offline build** — `CF_ACCOUNT_ID= CF_API_TOKEN= yarn build` so a Cloudflare hiccup
   in the semantic-index step can never block a publish. Keyword search (pagefind) is
   built fresh for every day; the committed semantic index is seeded from the main repo
   and shipped as-is (use `--fresh-semantic` to re-embed new days). This blanking is
   build-time only: server routes resolve secrets per request from the Vercel project's
   environment via `src/lib/runtime-env.ts`, so nothing the build lacks (this worktree
   has no `.env`) can disable a live endpoint.
4. **Header preservation** — merges `vercel.json` security headers (CSP, X-Frame-Options,
   …) into `.vercel/output/config.json`, because a bare `astro build` drops them. Refuses
   to deploy if the CSP is missing. (See `scripts/lib/merge-output-headers.ts` + its test.)
5. **Prebuilt deploy** — `vercel deploy --prebuilt --prod` uploads `.vercel/output`
   directly; Vercel runs no build and never touches `vercel-install.sh`/GitHub. Token is
   passed via the `VERCEL_TOKEN` env var (never `--token`, which is visible in `ps`).
6. **Poll** — waits for `https://dawsonwang.com/day/N` to return 200 before returning, so
   Phase 7's social posts never link to a not-yet-live (404-cached) page.

## When GitHub comes back

Revert to Git-integration deploys by pointing the site's `remote.pushDefault` back to
GitHub (`./scripts/git-remote.sh github`) and re-enabling the Vercel Git integration.
This script and the worktree can stay as a manual fallback, or be removed:
`git worktree remove ../.dawsonwang-deploy`.

## Config (env overrides, all optional)

| Var | Default |
|---|---|
| `DAWSONWANG_DIR` | this repo |
| `CONTENT_SRC` | `/Users/dawson/Documents/100Days/content` |
| `DEPLOY_WORKTREE` | `../.dawsonwang-deploy` |
| `DEPLOY_REF` | `main` |
| `VERCEL_TOKEN` | read from env or `.env` |
| `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID` | from `.vercel/project.json` |
| `VERCEL_CLI` | `vercel@latest` |

**Supply-chain hardening (recommended):** the deploy runs the Vercel CLI with the
production token in its environment. Pin the CLI to a vetted version so a poisoned
`vercel@latest` release can't run with the token — add `VERCEL_CLI=vercel@<version>`
to `.env` (or `yarn add -D vercel` and it'll be lockfile-pinned). The content-pipeline
passes `--fresh-semantic`, which re-embeds new days into the search index and falls
back to an offline build if Cloudflare is unreachable.
