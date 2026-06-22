// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';
import path from 'node:path';

// https://astro.build/config
export default defineConfig({
  // Canonical served host = www. Mirror of `SITE_URL` in src/lib/seo.ts.
  // Vercel currently serves www as the primary domain and 301-redirects apex
  // (see vercel.json `redirects` block). Astro uses `site` to render absolute
  // URLs in built artifacts (e.g. RSS feed `<link>`, generated `view-transitions`
  // routing). Must stay in lockstep with SITE_URL.
  site: 'https://www.dawsonwang.com',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: [path.resolve('.')],
      },
    },
    build: {
      rollupOptions: {
        // Pagefind emits /pagefind/pagefind.js post-build; the runtime fetches
        // it directly so Rollup must not try to resolve it at bundle time.
        external: [/^\/pagefind\//],
      },
    },
  },
  publicDir: 'public',
});