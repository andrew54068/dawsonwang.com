/**
 * Reads server-side configuration at request time instead of build time.
 *
 * `import.meta.env.SOMETHING` is a BUILD-TIME constant in Astro: the env vite
 * plugin rewrites each dotted access in server code into the literal value that
 * was present when the bundle was produced. A deployed function therefore can
 * never see a value that was missing — or deliberately blanked — during the
 * build, and the secret it did see is embedded in the shipped artifact.
 *
 * This site deploys a locally *prebuilt* output (scripts/deploy-local.ts). That
 * build runs in a git worktree with no .env file, and the default offline path
 * blanks the Cloudflare credentials so an upstream hiccup can never block a
 * publish. Both effects baked empty strings into every route that read config
 * that way — /api/embed answered 503 for every visitor regardless of what the
 * Vercel project had configured.
 *
 * `process.env` is the runtime source instead: Vercel injects the project's
 * variables into the Node function per invocation, so values can be rotated
 * without a rebuild and never live inside the deployed bundle. The dev server
 * populates `import.meta.env` only (never `process.env`) from .env, so that
 * stays as the local fallback.
 *
 * Keep this module free of literal variable names: wherever a bare
 * `import.meta.env` appears, Astro inlines every loaded variable whose name
 * occurs in the file — the exact baking this module exists to avoid.
 */

/** Trimmed value from the runtime environment, or undefined when blank/unset. */
export function readEnv(key: string): string | undefined {
  const value = fromProcess(key) ?? fromDevServer(key);
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function fromProcess(key: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env?.[key];
}

function fromDevServer(key: string): string | undefined {
  if (!import.meta.env.DEV) return undefined;
  return (import.meta.env as unknown as Record<string, string | undefined>)[key];
}
