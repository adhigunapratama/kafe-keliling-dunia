// Membuat ikon PNG PWA dari public/icons/icon.svg memakai Chromium (Playwright) yang terpasang.
// Jalankan: node tools/make-icons.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const svg = readFileSync(resolve('public/icons/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
async function shot(size, file, pad = 0, bg = 'transparent') {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - pad * 2;
  await page.setContent(`<html><body style="margin:0;background:${bg}"><div style="padding:${pad}px;width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: resolve('public/icons', file), omitBackground: bg === 'transparent' });
}
await shot(192, 'icon-192.png');
await shot(512, 'icon-512.png');
await shot(180, 'apple-touch-icon.png', 0, '#BDE7F5');
await shot(512, 'icon-maskable-512.png', 60, '#BDE7F5');
await browser.close();
console.log('ikon dibuat');
