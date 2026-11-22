// Uji Tahap 4: migrasi simpanan, Peta Dunia, kartu level, cadangan Kode Keluarga & pemulihan di perangkat baru.
// Perlu: npx vite preview --port 4173   dan   (cd worker && npx wrangler dev --port 8787)
// Pakai: node tools/smoke-stage4.mjs [gameUrl] [serverUrl] [outdir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const game = process.argv[2] || 'http://localhost:4173/';
const server = process.argv[3] || 'http://127.0.0.1:8787';
const out = process.argv[4] || 'test-results';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
let passed = 0, failed = 0;
const ok = (c, n) => { if (c) { passed++; console.log('  ✓', n); } else { failed++; console.log('  ✗', n); } };
const q = `?server=${encodeURIComponent(server)}`;
async function device(name) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 680 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
  return page;
}
try {
  // ---------- HP lama dengan simpanan versi 1 (Tahap 1–3)
  const a = await device('hp-lama');
  await a.goto(game + q);
  await a.evaluate(() => { localStorage.clear(); localStorage.setItem('kkd.settings', JSON.stringify({ detected: 'rendah' })); localStorage.setItem('kkd.progress', JSON.stringify({ v: 1, unlocked: 5, best: { 1: 3, 2: 2, 3: 3, 4: 2 }, coins: 340, last: 5 })); });
  await a.reload();
  await a.waitForTimeout(2500);
  const info = await a.locator('.btn-continue .bc-info').textContent();
  ok(/Level 5 dari 15/.test(info) && /10 bintang/.test(info), `simpanan v1 dimigrasi: "${info.trim()}"`);
  const saved = await a.evaluate(() => JSON.parse(localStorage.getItem('kkd.progress')));
  ok(saved.v === 2 && /^KAFE-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(saved.familyCode), `simpanan v2 + Kode Keluarga dibuat (${saved.familyCode})`);
  await a.waitForTimeout(2500);
  const cloud = await (await fetch(`${server}/backup/${saved.familyCode}`)).json();
  ok(cloud.save?.coins === 340 && cloud.save?.best?.['3'] === 3, 'simpanan dicadangkan ke server (Durable Object)');

  // peta
  await a.click('.btn-map');
  await a.waitForFunction(() => !!window.__kkdMap, null, { timeout: 15000 });
  await a.waitForTimeout(1500);
  ok(await a.locator('.pin-label').count() === 15, '15 pin level dengan label');
  ok(await a.locator('.pin-label.st-current').count() === 1, 'satu pin "level sekarang"');
  ok(/10 \/ 45/.test(await a.locator('.map-header').textContent()), 'header: total bintang 10 / 45');
  await a.screenshot({ path: `${out}/s4-peta.png` });
  // geser & zoom tidak error
  await a.mouse.move(600, 400); await a.mouse.down(); await a.mouse.move(450, 350, { steps: 6 }); await a.mouse.up();
  await a.mouse.wheel(0, -300); await a.waitForTimeout(400);
  // ketuk pin Italia (level 2, sudah dimainkan)
  const tap = async (code) => { const xy = await a.evaluate((c) => { const v = window.__kkdMap; const p = v.P[c]; return v.project(p.x, 0.85, p.z); }, code); await a.mouse.click(xy[0], xy[1]); await a.waitForTimeout(1300); };
  await tap('it');
  ok((await a.locator('.map-card').textContent()).includes('Main lagi'), 'kartu level Italia: "Main lagi"');
  await tap('tr');
  ok((await a.locator('.map-card').textContent()).includes('Selesaikan level sebelumnya'), 'kartu level terkunci (Turki)');
  await a.evaluate(() => window.__kkdMap.flyTo('jp', 10)); await a.waitForTimeout(1300);
  await tap('jp');
  const jp = await a.locator('.map-card').textContent();
  ok(jp.includes('Kedai Sakura') && jp.includes('Main!'), 'kartu level sekarang (Jepang): "Main!"');
  await a.screenshot({ path: `${out}/s4-kartu.png` });

  // ---------- HP baru: pulihkan dengan Kode Keluarga
  const b = await device('hp-baru');
  await b.goto(game + q);
  await b.evaluate(() => { localStorage.clear(); localStorage.setItem('kkd.settings', JSON.stringify({ detected: 'rendah' })); });
  await b.reload();
  await b.waitForTimeout(1500);
  ok(/Level 1 dari 15/.test(await b.locator('.btn-continue .bc-info').textContent()), 'HP baru mulai dari Level 1');
  await b.click('.title-row .btn-icon[aria-label="Pengaturan"]');
  await b.fill('.family-input', saved.familyCode.toLowerCase().replace(/-/g, ' '));
  await b.click('.family-restore .btn:has-text("Pulihkan")');
  await b.click('.family-confirm .btn-red');
  await b.waitForSelector('.family-msg.ok', { timeout: 8000 });
  await b.screenshot({ path: `${out}/s4-pulihkan.png` });
  await b.click('.modal-head .btn-icon');
  await b.waitForTimeout(500);
  const binfo = await b.locator('.btn-continue .bc-info').textContent();
  ok(/Level 5 dari 15/.test(binfo) && /10 bintang/.test(binfo), `HP baru dipulihkan: "${binfo.trim()}"`);
  const bsave = await b.evaluate(() => JSON.parse(localStorage.getItem('kkd.progress')));
  ok(bsave.familyCode === saved.familyCode, 'HP baru memakai Kode Keluarga yang sama');
  // simpanan juga ada di IndexedDB setelah dimuat ulang
  await b.evaluate(() => localStorage.removeItem('kkd.progress'));
  await b.reload(); await b.waitForTimeout(2000);
  ok(/Level 5 dari 15/.test(await b.locator('.btn-continue .bc-info').textContent()), 'simpanan utama di IndexedDB (localStorage dihapus tetap aman)');
} catch (e) { failed++; console.error(e); }
console.log(errors.length ? 'ERROR KONSOL:\n' + errors.join('\n') : 'tidak ada error konsol');
console.log(`\n${passed} lulus, ${failed} gagal`);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
