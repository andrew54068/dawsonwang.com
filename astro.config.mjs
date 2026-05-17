// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import path from 'node:path';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
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