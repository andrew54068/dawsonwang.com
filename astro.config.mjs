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
  },
  publicDir: 'public',
});