// Uji perangkat mobile (emulasi Chromium dengan layar SENTUH: iPhone & HP Android landscape),
// plus uji PWA offline (setelah service worker terpasang, game tetap bisa dibuka tanpa internet).
// Catatan: ini emulasi, bukan Safari asli; uji akhir tetap di perangkat sungguhan.
// Pakai: npx vite preview --port 4173 &   lalu   node tools/smoke-mobile.mjs [url] [outdir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'test-results';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
let passed = 0, failed = 0;
const ok = (c, n) => { if (c) { passed++; console.log('  ✓', n); } else { failed++; console.log('  ✗', n); } };

async function swipe(page, x0, y0, x1, y1, steps = 8) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

for (const name of ['iPhone 13 landscape', 'Pixel 7 landscape']) {
  console.log(name);
  const ctx = await browser.newContext({ ...devices[name] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('kkd.settings', JSON.stringify({ detected: 'rendah' })); localStorage.setItem('kkd.progress', JSON.stringify({ v: 2, unlocked: 1, best: { 1: 1 }, coins: 0, last: 1, decor: { owned: [], placed: {} }, familyCode: null, updatedAt: 1 })); });
  await page.goto(url + '?test=1');
  await page.waitForTimeout(2500);
  // Pelayan: ketuk tamu di pintu dengan JARI
  await page.evaluate(() => window.__kkd.setMode('waiter'));
  await page.waitForFunction(() => window.__kkd.session.sim.state.parties.some((p) => p.state === 'waitSeat'), null, { timeout: 15000 });
  await page.waitForTimeout(800); // layar Pelayan baru ditampilkan: tunggu kamera menyesuaikan ukuran
  const host = await page.locator('.pane-waiter .view-host').boundingBox();
  const target = await page.evaluate(() => { const s = window.__kkd.session.sim.state; const p = s.parties.find((p) => p.state === 'waitSeat'); return p.guests[0].move.pts.at(-1); });
  // proyeksikan posisi tamu lewat gelembungnya (elemen DOM di atas tamu)
  const bubble = await page.locator('.pane-waiter .bubble').first().boundingBox();
  await page.touchscreen.tap(bubble.x + bubble.width / 2, bubble.y + bubble.height / 2);
  await page.waitForTimeout(400);
  console.log('    status Pelayan:', await page.evaluate(() => JSON.stringify({ goal: window.__kkd.session.sim.state.waiter.goal, carry: window.__kkd.session.sim.state.waiter.carry, parties: window.__kkd.session.sim.state.parties.map((p) => p.state) })));
  ok(await page.evaluate(() => !!window.__kkd.session.sim.state.waiter.goal || window.__kkd.session.sim.state.waiter.carry?.k === 'party'), `ketuk jari pada gelembung tamu -> Pelayan berjalan (${target.map((v) => v.toFixed(1))})`);
  void host;
  await page.screenshot({ path: `${out}/mobile-${name.split(' ')[0]}-pelayan.png` });
  // Koki: ketuk label stasiun dengan jari, lalu potong dengan swipe sentuh
  await page.evaluate(() => { window.__kkd.setMode('chef'); const s = window.__kkd.session.sim.state; s.tutorial = false; s.tickets = [{ id: 501, party: -1, table: 0, menu: 'burger', step: 0, quality: 1, created: s.t, state: 'cooking' }]; });
  await page.waitForTimeout(600);
  const lab = await page.locator('[data-station="talenan"]').boundingBox();
  await page.touchscreen.tap(lab.x + lab.width / 2, lab.y + lab.height / 2);
  await page.waitForSelector('.mg-panel', { timeout: 5000 });
  ok(true, 'ketuk jari pada stasiun -> mini-game terbuka');
  await page.waitForTimeout(400);
  for (const g of await page.locator('.mg-guide').elementHandles()) {
    const b = await g.boundingBox();
    await swipe(page, b.x + 1, b.y + 4, b.x + 3, b.y + b.height - 4);
    await page.waitForTimeout(150);
  }
  await page.waitForSelector('.mg-panel', { state: 'detached', timeout: 6000 });
  ok(await page.evaluate(() => window.__kkd.session.sim.state.tickets[0]?.step === 1), 'swipe SENTUH memotong tomat sampai selesai');
  // tombol cukup besar (min 56 px; tombol emoji Adik min 84 px)
  await page.evaluate(() => window.__kkd.setMode('waiter')); await page.waitForTimeout(300);
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.pane-waiter .btn-emoji')].map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)));
  ok(sizes.length === 3 && sizes.every((s) => s >= 84), `tombol emoji Adik >= 84 px (${sizes.map(Math.round).join(', ')})`);
  const small = await page.evaluate(() => [...document.querySelectorAll('.screen button')].filter((b) => b.offsetParent && !b.closest('.segmented') && !b.closest('.mode-switch')).map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }).filter((s) => s > 0 && s < 44));
  ok(small.length === 0, `semua tombol yang terlihat >= 44 px (${small.length} lebih kecil)`);
  await ctx.close();
}

// ---------- PWA offline
console.log('PWA offline');
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 600 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[offline] ${e}`));
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('kkd.settings', JSON.stringify({ detected: 'rendah' })));
  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  ok(sw, 'service worker aktif');
  await page.waitForTimeout(2500); // precache selesai
  await page.reload(); await page.waitForTimeout(1000);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.btn-continue', { timeout: 8000 });
  ok(true, 'OFFLINE: layar judul tetap terbuka');
  await page.click('.btn-map');
  await page.waitForFunction(() => !!window.__kkdMap, null, { timeout: 15000 }).then(() => ok(true, 'OFFLINE: peta dunia (data peta dari cache)'), () => ok(false, 'OFFLINE: peta dunia'));
  await page.goto(url + '?test=1').catch(() => {});
  await page.waitForSelector('.chef-screen', { timeout: 8000 }).then(() => ok(true, 'OFFLINE: Mode Uji bisa dimainkan'), () => ok(false, 'OFFLINE: Mode Uji'));
  await page.screenshot({ path: `${out}/offline.png` });
  await ctx.close();
}
console.log(errors.length ? 'ERROR KONSOL:\n' + errors.join('\n') : 'tidak ada error konsol');
console.log(`\n${passed} lulus, ${failed} gagal`);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
