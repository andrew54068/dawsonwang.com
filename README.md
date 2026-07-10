# dawsonwang.com

Astro site for `dawsonwang.com`, backed by the `100days` content submodule.

## Prerequisites

- Node.js `>=22.12.0` (Vercel will use Node 24 for serverless functions)
- Corepack-enabled Yarn 4 (`packageManager` is pinned in `package.json`)
- The `100days` submodule initialized before running tests or builds

## Setup

```sh
git clone --recurse-submodules https://github.com/andrew54068/dawsonwang.com.git
cd dawsonwang.com
corepack enable
yarn install --immutable
```

If you cloned without submodules:

```sh
git submodule update --init --recursive
```

## Commands

| Command | Action |
| --- | --- |
| `yarn dev` | Copy slide assets and start the Astro dev server |
| `yarn test` | Run the Vitest test suite |
| `yarn astro check` | Run Astro/TypeScript diagnostics |
| `yarn build` | Build the site, generate Pagefind search, and sync output for Vercel |
| `yarn search:semantic` | Generate semantic-search vectors with Cloudflare Workers AI credentials |
| `yarn search:verify` | Verify the generated semantic-search index |

## Environment

Semantic search generation uses Cloudflare Workers AI:

- `CF_ACCOUNT_ID`
- `CF_API_TOKEN`

`yarn build` skips semantic index generation when these variables are absent so local builds and CI can still validate the site. Set `SEMANTIC_SEARCH_REQUIRED=true` to make missing Cloudflare credentials fail the build.

The inquiry API uses additional deployment secrets documented in `.env.example`.

## Analytics

The site now exposes a provider-neutral analytics entry point for pageviews and future custom events.

### Provider selection

Set `PUBLIC_ANALYTICS_PROVIDER` to one of:

- `vercel` (default) — injects Vercel Web Analytics and, unless disabled, Speed Insights
- `self-hosted` — auto-tracks pageviews through a first-party endpoint and keeps a portable `window.dwAnalytics` / `trackEvent()` API for future custom events
- `none` — installs the same API surface as a no-op so site code can call it safely with analytics disabled

### Optional variables

- `PUBLIC_VERCEL_SPEED_INSIGHTS=false` — disable Speed Insights while keeping Vercel pageview/event wiring
- `PUBLIC_ANALYTICS_ENDPOINT=/api/analytics` — override the endpoint used by `self-hosted` mode (defaults to the built-in first-party collector)

### Built-in self-hosted path

When `PUBLIC_ANALYTICS_PROVIDER=self-hosted`, the browser posts pageview/event payloads to `/api/analytics` by default. The built-in route validates same-origin callers and writes structured JSON events to server logs, which makes the site portable to non-Vercel hosting without coupling analytics to a single platform. If you point `PUBLIC_ANALYTICS_ENDPOINT` at another origin, update `connect-src` in `vercel.json` (or the equivalent CSP on your new host).
