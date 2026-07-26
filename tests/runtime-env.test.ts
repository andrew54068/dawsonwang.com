import { afterEach, describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readEnv } from '../src/lib/runtime-env';

const KEY = 'RUNTIME_ENV_TEST_KEY';

afterEach(() => {
  delete process.env[KEY];
});

describe('readEnv', () => {
  test('reads the value from the runtime process environment', () => {
    process.env[KEY] = 'from-process';
    expect(readEnv(KEY)).toBe('from-process');
  });

  test('returns undefined for unset keys', () => {
    expect(readEnv(KEY)).toBeUndefined();
  });

  test('treats blank values as unset so a blanked build env never half-configures a route', () => {
    process.env[KEY] = '';
    expect(readEnv(KEY)).toBeUndefined();
    process.env[KEY] = '   ';
    expect(readEnv(KEY)).toBeUndefined();
  });

  test('trims surrounding whitespace', () => {
    process.env[KEY] = '  token  ';
    expect(readEnv(KEY)).toBe('token');
  });
});

describe('server routes read configuration at runtime', () => {
  const root = process.cwd();
  const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

  // import.meta.env is inlined at build time by Astro's env plugin, so a
  // prebuilt deploy freezes whatever the build machine had — blank values ship
  // as blank forever, and real secrets ship inside the artifact. Every server
  // route must go through readEnv() instead.
  const runtimeConfigured = [
    'src/pages/api/embed.ts',
    'src/pages/api/inquiry.ts',
    'src/lib/origin-guard.ts',
  ];

  for (const file of runtimeConfigured) {
    test(`${file} does not read configuration through import.meta.env`, () => {
      expect(source(file)).not.toMatch(/import\.meta\.env\./);
    });
  }

  test('readEnv itself keeps no variable names next to a bare import.meta.env', () => {
    // Astro inlines every loaded variable whose name appears in a module that
    // touches bare `import.meta.env`, which would re-bake the secrets.
    const helper = source('src/lib/runtime-env.ts');
    expect(helper).toContain('import.meta.env');
    expect(helper).not.toMatch(/\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b/);
  });
});
