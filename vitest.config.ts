import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@/lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@/data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },
});
