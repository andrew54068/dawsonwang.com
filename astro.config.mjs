// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';
import path from 'node:path';

// https://astro.build/config
export default defineConfig({
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