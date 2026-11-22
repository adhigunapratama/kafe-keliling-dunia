// Uji setiap mini-game dengan gerakan sungguhan (swipe/seret/ketuk/gosok) di Chromium.
// Pakai: npx vite preview --port 4173 &   lalu   node tools/smoke-minigames.mjs [url] [outdir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'test-results';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url + '?test=1');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__kkd.setMode('chef'));
await page.waitForTimeout(500);

const inject = (menu, step) => page.evaluate(([menu, step]) => {
  const s = window.__kkd.session.sim.state;
  s.tickets = [{ id: 9000 + step, party: -1, table: 0, menu, step, quality: 1, created: s.t, state: 'cooking' }];
}, [menu, step]);
const snapshot = () => page.evaluate(() => { const s = window.__kkd.session.sim.state; return { tickets: s.tickets.map((t) => t.step), pass: s.pass.length, clean: s.clean, sink: s.sink }; });
const openStation = async (id) => { await page.click(`[data-station="${id}"]`, { force: true }); await page.waitForSelector('.mg-panel'); await page.waitForTimeout(300); };
const closed = () => page.waitForSelector('.mg-panel', { state: 'detached', timeout: 8000 });
const results = [];
const all = (sel) => page.locator(sel).elementHandles();
const box = async (sel) => (await page.locator(sel).first().boundingBox());

// 1. potong (burger langkah 0)
await inject('burger', 0); await page.waitForTimeout(300);
await openStation('talenan');
await page.screenshot({ path: `${out}/mg-potong.png` });
for (const g of await all('.mg-guide')) {
  const b = await g.boundingBox();
  const x = b.x + 1, y0 = b.y - 30, y1 = b.y + b.height + 30;
  await page.mouse.move(x, y0); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + i * 0.5, y0 + ((y1 - y0) * i) / 8);
  await page.mouse.up(); await page.waitForTimeout(150);
}
await closed(); results.push(['potong', await snapshot()]);

// 2. balik (burger langkah 1)
await inject('burger', 1); await page.waitForTimeout(300);
await openStation('panggangan');
for (let side = 0; side < 2; side++) {
  await page.waitForFunction(() => { const f = document.querySelector('.mg-meter-fill'); return f && parseFloat(f.style.width) >= 70; }, null, { timeout: 8000 });
  if (side === 0) await page.screenshot({ path: `${out}/mg-balik.png` });
  await page.click('.mg-tap'); await page.waitForTimeout(500);
}
await closed(); results.push(['balik', await snapshot()]);

// 3. seret-bahan (burger langkah 2)
await inject('burger', 2); await page.waitForTimeout(300);
await openStation('talenan');
for (let i = 0; i < 5; i++) {
  const from = await box('.mg-ing.next');
  const to = await box('.mg-plate');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await page.mouse.down();
  for (let k = 1; k <= 10; k++) await page.mouse.move(from.x + (to.x + to.width / 2 - from.x) * k / 10, from.y + (to.y + to.height / 2 - from.y) * k / 10);
  await page.mouse.up(); await page.waitForTimeout(200);
  if (i === 2) await page.screenshot({ path: `${out}/mg-seret.png` });
}
await closed(); results.push(['seret-bahan', await snapshot()]);

// 4. timing (kentang goreng langkah 1)
await inject('kentang-goreng', 1); await page.waitForTimeout(300);
await openStation('kompor');
await page.waitForTimeout(2300);
await page.screenshot({ path: `${out}/mg-timing.png` });
await page.click('.mg-tap');
await closed(); results.push(['timing', await snapshot()]);

// 5. cuci piring
await page.evaluate(() => { const s = window.__kkd.session.sim.state; s.tickets = []; s.sink = 2; s.clean = Math.max(0, s.clean - 2); });
await page.waitForTimeout(300);
await openStation('wastafel');
const area = await box('.mg-gosok');
const cx = area.x + area.width / 2, cy = area.y + area.height / 2, R = Math.min(area.width, area.height) * 0.42;
for (let plate = 0; plate < 2; plate++) {
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let k = 0; k < 140; k++) { const a = k * 0.7, r = R * (0.1 + 0.8 * ((k % 20) / 20)); await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9); }
  await page.mouse.up();
  if (plate === 0) await page.screenshot({ path: `${out}/mg-cuci.png` });
  await page.waitForTimeout(300);
}
await closed().catch(() => {}); results.push(['cuci', await snapshot()]);

for (const r of results) console.log(r[0], JSON.stringify(r[1]));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'tidak ada error konsol');
await browser.close();
process.exit(errors.length ? 1 : 0);
