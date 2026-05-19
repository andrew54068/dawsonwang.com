import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const faviconSvgPath = path.join(publicDir, 'favicon.svg');
const faviconIcoPath = path.join(publicDir, 'favicon.ico');
const appleTouchIconPath = path.join(publicDir, 'apple-touch-icon.png');
const ogDefaultPath = path.join(publicDir, 'og-default.png');

const MONOGRAM_PATHS = [
  {
    d: 'M6 13H22.8C32.7 13 39 20.4 39 32C39 43.6 32.7 51 22.8 51H6V13ZM14.1 20.6V43.4H22.1C27.8 43.4 31.4 39 31.4 32C31.4 25 27.8 20.6 22.1 20.6H14.1Z',
    attrs: 'fill-rule="evenodd" clip-rule="evenodd"',
  },
  {
    d: 'M34.2 13H41.4L44.4 37.1L48.8 13H55.2L59 37.1L62 13H64L58 51H51.5L48.2 31.6L44.8 51H38.2L34.2 13Z',
    attrs: '',
  },
];

const colors = {
  darkPaper: '#0A0A0B',
  lightPaper: '#FFFFFF',
  ink: '#F4F4F5',
  lightInk: '#0A2540',
  accent: '#7B61FF',
};

function monogramPaths(fill: string, extraAttrs = '') {
  return MONOGRAM_PATHS.map(({ d, attrs }) => {
    const mergedAttrs = [attrs, extraAttrs].filter(Boolean).join(' ');
    return `<path ${mergedAttrs} d="${d}" fill="${fill}" />`;
  }).join('\n');
}

function iconSvg(fill: string, background?: string) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${background ? `<rect width="64" height="64" fill="${background}" />` : ''}
  ${monogramPaths(fill)}
</svg>`;
}

async function rasterizeSvg(svg: string, width: number, height = width) {
  return sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'contain' })
    .png()
    .toBuffer();
}

async function hasInstalledPackage(packageName: string) {
  try {
    await access(path.join(rootDir, 'node_modules', packageName), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function buildFaviconIco() {
  const faviconSvg = await readFile(faviconSvgPath, 'utf8');
  const hasToIco = await hasInstalledPackage('to-ico');

  if (hasToIco) {
    const require = createRequire(import.meta.url);
    const toIcoModule = require('to-ico');
    const toIco = toIcoModule.default ?? toIcoModule;
    const pngLayers = await Promise.all([16, 32, 48].map((size) => rasterizeSvg(faviconSvg, size)));
    const icoBuffer = await toIco(pngLayers);
    await writeFile(faviconIcoPath, icoBuffer);
    console.log('wrote public/favicon.ico (ICO with 16, 32, and 48 px layers)');
    return;
  }

  // PNG binary fallback for favicon.ico when to-ico is unavailable.
  // This is not a true multi-layer ICO, but browsers commonly accept PNG favicon payloads.
  const fallbackPng = await rasterizeSvg(iconSvg('#000000'), 32);
  await writeFile(faviconIcoPath, fallbackPng);
  console.log('wrote public/favicon.ico (PNG binary fallback; node_modules/to-ico not found)');
}

async function buildAppleTouchIcon() {
  const appleSvg = iconSvg(colors.lightInk, colors.lightPaper);
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .flatten({ background: colors.lightPaper })
    .png()
    .toFile(appleTouchIconPath);
  console.log('wrote public/apple-touch-icon.png');
}

async function buildOgDefault() {
  // The zh-Hant tagline depends on a CJK font being available on the builder.
  // If no CJK font is installed, the glyphs may render as tofu; the ASCII heading uses common fallbacks.
  const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${colors.darkPaper}" />
  <g transform="translate(770 54) scale(5.4)" opacity="0.16">
    ${monogramPaths(colors.accent)}
  </g>
  <circle cx="125" cy="154" r="10" fill="${colors.accent}" />
  <path d="M120 394H548" stroke="${colors.accent}" stroke-width="6" stroke-linecap="round" />
  <text x="120" y="288" fill="${colors.ink}" font-family="Space Grotesk, Inter, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="0">Dawson Wang</text>
  <text x="120" y="350" fill="${colors.ink}" font-family="Noto Sans TC, PingFang TC, Microsoft JhengHei, Arial, sans-serif" font-size="32" font-weight="500" letter-spacing="0">AI 工具落地實踐者</text>
</svg>`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .flatten({ background: colors.darkPaper })
    .png()
    .toFile(ogDefaultPath);
  console.log('wrote public/og-default.png');
}

async function main() {
  await mkdir(publicDir, { recursive: true });
  await buildFaviconIco();
  await buildAppleTouchIcon();
  await buildOgDefault();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
