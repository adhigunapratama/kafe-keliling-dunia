// Uji Tahap 5: mini-game lipat/tarik/kukus, Hias Kafe (satu perangkat & berdua lewat jaringan),
// dekorasi tampil di level, dan perayaan tamat Indonesia.
// Perlu: npx vite preview --port 4173   dan   (cd worker && npx wrangler dev --port 8787)
// Pakai: node tools/smoke-stage5.mjs [gameUrl] [serverUrl] [outdir]
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
async function device(name, viewport = { width: 1100, height: 640 }, progress = null) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load resource|WebSocket/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
  await page.goto(game + q);
  await page.evaluate((pr) => { localStorage.clear(); localStorage.setItem('kkd.settings', JSON.stringify({ detected: 'rendah' })); if (pr) localStorage.setItem('kkd.progress', JSON.stringify(pr)); }, progress);
  return page;
}
const inject = (page, menu, step) => page.evaluate(([menu, step]) => { const s = window.__kkd.session.sim.state; s.tickets = [{ id: 8000 + step, party: -1, table: 0, menu, step, quality: 1, created: s.t, state: 'cooking' }]; }, [menu, step]);
const stepOf = (page) => page.evaluate(() => { const s = window.__kkd.session.sim.state; return s.tickets[0]?.step ?? (s.pass.length ? 'jadi' : '-'); });
const openStation = async (page, id) => { await page.click(`[data-station="${id}"]`, { force: true }); await page.waitForSelector('.mg-panel'); await page.waitForTimeout(400); };
const closed = (page) => page.waitForSelector('.mg-panel', { state: 'detached', timeout: 10000 });
const box = (page, sel) => page.locator(sel).first().boundingBox();
const prog = { v: 2, unlocked: 15, best: Object.fromEntries(Array.from({ length: 14 }, (_, i) => [i + 1, 2])), coins: 400, last: 15, decor: { owned: [], placed: {} }, familyCode: null, updatedAt: 1 };

try {
  // ---------- mini-game lipat (empanada) & tarik (mi tarik) & kukus (dimsum)
  const a = await device('mg', { width: 1024, height: 600 }, prog);
  await a.goto(game + q + '&test=1&level=6'); await a.waitForTimeout(1500);
  await a.evaluate(() => window.__kkd.setMode('chef')); await a.waitForTimeout(300);
  await inject(a, 'empanada', 1); await a.waitForTimeout(300);
  await openStation(a, 'talenan');
  for (let i = 0; i < 2; i++) {
    const f = await box(a, '.mg-fold');
    await a.mouse.move(f.x + f.width / 2, f.y + 10); await a.mouse.down();
    for (let k = 1; k <= 8; k++) await a.mouse.move(f.x + f.width / 2, f.y + 10 + (f.height * 0.9 * k) / 8);
    await a.mouse.up(); await a.waitForTimeout(600);
    if (i === 0) await a.screenshot({ path: `${out}/s5-lipat.png` });
  }
  await closed(a); ok((await stepOf(a)) === 2, 'lipat: 2 lipatan menyelesaikan langkah empanada');
  await a.goto(game + q + '&test=1&level=11'); await a.waitForTimeout(1500);
  await a.evaluate(() => window.__kkd.setMode('chef')); await a.waitForTimeout(300);
  await inject(a, 'mi-tarik', 0); await a.waitForTimeout(300);
  await openStation(a, 'talenan');
  const area = await box(a, '.mg-tarik');
  for (let i = 0; i < 4; i++) {
    const y = area.y + area.height / 2, x0 = area.x + area.width * (i % 2 ? 0.8 : 0.2), x1 = area.x + area.width * (i % 2 ? 0.2 : 0.8);
    await a.mouse.move(x0, y); await a.mouse.down();
    for (let k = 1; k <= 8; k++) await a.mouse.move(x0 + ((x1 - x0) * k) / 8, y);
    await a.mouse.up(); await a.waitForTimeout(250);
    if (i === 2) await a.screenshot({ path: `${out}/s5-tarik.png` });
  }
  await closed(a); ok((await stepOf(a)) === 1, 'tarik: 4 tarikan menyelesaikan langkah mi tarik');
  await inject(a, 'dimsum', 2); await a.waitForTimeout(300);
  await openStation(a, 'kukusan');
  await a.waitForTimeout(2600);
  await a.screenshot({ path: `${out}/s5-kukus.png` });
  await a.click('.mg-tap');
  await closed(a); ok((await stepOf(a)) === 'jadi', 'timing kukus: dimsum jadi');

  // ---------- Hias Kafe satu perangkat (dari peta)
  await a.goto(game + q); await a.waitForTimeout(1200);
  await a.click('.btn-map');
  await a.waitForFunction(() => !!window.__kkdMap, null, { timeout: 15000 });
  await a.click('.map-header .btn-blue');
  await a.waitForSelector('.shop');
  const card = (id) => a.locator('.shop-card').nth(['lantai-kayu', 'lantai-pelangi', 'lantai-laut', 'meja-bunga'].indexOf(id));
  await card('lantai-laut').locator('.pick-btn.chef').click();
  ok((await a.evaluate(() => JSON.parse(localStorage.getItem('kkd.progress')).coins)) === 400, 'satu anak memilih -> belum terbeli');
  await card('lantai-laut').locator('.pick-btn.waiter').click();
  await a.waitForTimeout(300);
  let p = await a.evaluate(() => JSON.parse(localStorage.getItem('kkd.progress')));
  ok(p.coins === 320 && p.decor.placed.lantai === 'lantai-laut', 'kedua anak memilih barang sama -> terbeli & dipasang (koin 400 -> 320)');
  await card('meja-bunga').locator('.pick-btn.chef').click(); await card('meja-bunga').locator('.pick-btn.waiter').click();
  await a.waitForTimeout(300);
  await a.screenshot({ path: `${out}/s5-toko.png` });
  await a.click('.shop-head .btn-icon');

  // dekorasi tampil di level
  await a.goto(game + q + '&test=1&level=3'); await a.waitForTimeout(1500);
  await a.evaluate(() => window.__kkd.setMode('waiter')); await a.waitForTimeout(1200);
  await a.screenshot({ path: `${out}/s5-dekorasi-di-level.png` });
  ok(true, 'level dengan dekorasi dirender tanpa error');

  // ---------- perayaan tamat (Indonesia)
  await a.goto(game + q + '&test=1&level=15'); await a.waitForTimeout(1500);
  await a.evaluate(() => { const s = window.__kkd.session.sim.state; s.stats.score = 200; s.stats.happy = 12; s.t = s.duration - 0.3; });
  await a.waitForSelector('.final-banner', { timeout: 8000 });
  await a.waitForTimeout(1200);
  ok((await a.locator('.final-banner').textContent()).includes('Kafe Keliling Dunia Juara'), 'perayaan tamat: "Tamat! Kafe Keliling Dunia Juara!"');
  await a.screenshot({ path: `${out}/s5-tamat.png` });

  // ---------- Hias Kafe berdua lewat jaringan
  const chef = await device('koki', { width: 900, height: 420 }, prog);
  const waiter = await device('pelayan', { width: 1024, height: 700 });
  await chef.goto(game + q); await chef.waitForTimeout(800);
  await chef.click('.btn-continue');
  await chef.waitForSelector('.lobby-main .code-boxes span');
  const code = (await chef.locator('.lobby-main .code-boxes').textContent()).trim();
  await waiter.goto(game + q); await waiter.waitForTimeout(800);
  await waiter.click('.btn-join'); await waiter.waitForSelector('.keypad');
  for (const d of code) await waiter.click(`.key-${d}`);
  await waiter.click('.key-ok');
  await waiter.waitForSelector('.guest-wait-main', { timeout: 8000 });
  await chef.click('.lobby-shop');
  await waiter.waitForSelector('.shop', { timeout: 6000 });
  ok(true, 'toko terbuka di kedua perangkat');
  const idx = 6; // lampu-untai
  await chef.locator('.shop-card').nth(idx).locator('.pick-btn.chef').click();
  await waiter.waitForSelector('.shop-card.picked', { timeout: 5000 });
  ok(await waiter.locator('.shop-card').nth(idx).locator('.pick-btn.chef.on').count() === 1, 'pilihan Kakak terlihat di tablet Adik');
  await waiter.locator('.shop-card').nth(idx).locator('.pick-btn.waiter').click();
  await waiter.waitForSelector('.shop-card.placed', { timeout: 5000 });
  p = await chef.evaluate(() => JSON.parse(localStorage.getItem('kkd.progress')));
  ok(p.decor.placed.lampu === 'lampu-untai' && p.coins === 330, 'Adik memilih barang yang sama -> terbeli di HP Kakak (koin 400 -> 330)');
  await waiter.screenshot({ path: `${out}/s5-toko-adik.png` });
  await chef.click('.shop-head .btn-icon');
  await waiter.waitForSelector('.shop', { state: 'detached', timeout: 5000 });
  ok(true, 'Kakak menutup toko -> tertutup juga di tablet Adik');
  // dekorasi ikut terkirim ke tablet Adik saat mulai main
  await chef.click('.start-btn', { force: true });
  await waiter.waitForSelector('.waiter-screen', { timeout: 8000 });
  await waiter.waitForTimeout(1500);
  await waiter.screenshot({ path: `${out}/s5-dekorasi-adik.png` });
  ok(true, 'permainan berdua dengan dekorasi dimulai');
  // pilih tampilan tokoh (Tokohku) tidak error
} catch (e) { failed++; console.error(e); }
console.log(errors.length ? 'ERROR KONSOL:\n' + errors.join('\n') : 'tidak ada error konsol');
console.log(`\n${passed} lulus, ${failed} gagal`);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
