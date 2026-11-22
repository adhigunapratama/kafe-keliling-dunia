// Uji Tahap 3: mini-game baru (aduk, gulung, seret-tabur, timing oven/rebus) dengan gerakan sungguhan,
// dan tangkapan layar tutorial Level 1.
// Pakai: npx vite preview --port 4173 &   lalu   node tools/smoke-stage3.mjs [url] [outdir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'test-results';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
let passed = 0, failed = 0;
const ok = (c, n) => { if (c) { passed++; console.log('  ✓', n); } else { failed++; console.log('  ✗', n); } };

async function open(level) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 600 } });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('kkd.settings', JSON.stringify({ detected: 'rendah' })); });
  await page.goto(url + `?test=1&level=${level}`);
  await page.waitForTimeout(1500);
  return page;
}
const inject = (page, menu, step) => page.evaluate(([menu, step]) => {
  const s = window.__kkd.session.sim.state;
  s.tickets = [{ id: 7000 + step, party: -1, table: 0, menu, step, quality: 1, created: s.t, state: 'cooking' }];
}, [menu, step]);
const stepOf = (page) => page.evaluate(() => { const s = window.__kkd.session.sim.state; return s.tickets[0]?.step ?? (s.pass.length ? 'jadi' : '-'); });
const openStation = async (page, id) => { await page.click(`[data-station="${id}"]`, { force: true }); await page.waitForSelector('.mg-panel'); await page.waitForTimeout(400); };
const closed = (page) => page.waitForSelector('.mg-panel', { state: 'detached', timeout: 10000 });
const box = (page, sel) => page.locator(sel).first().boundingBox();

try {
  // ---------- Italia
  const it = await open(2);
  await it.evaluate(() => window.__kkd.setMode('chef'));
  await it.waitForTimeout(400);
  // aduk (spaghetti langkah 1, kompor)
  await inject(it, 'spaghetti', 1); await it.waitForTimeout(300);
  await openStation(it, 'kompor');
  const b = await box(it, '.mg-bowl');
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2, R = b.width * 0.3;
  await it.mouse.move(cx + R, cy); await it.mouse.down();
  for (let k = 1; k <= 3 * 24 + 4; k++) { const a = (k / 24) * Math.PI * 2; await it.mouse.move(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
  await it.mouse.up();
  await closed(it); ok((await stepOf(it)) === 2, 'aduk: memutar 3 kali menyelesaikan langkah');
  // seret tabur (pizza langkah 1)
  await inject(it, 'pizza', 1); await it.waitForTimeout(300);
  await openStation(it, 'talenan');
  for (let i = 0; i < 6; i++) {
    const from = await box(it, '.mg-ing.next'), to = await box(it, '.mg-plate');
    const tx = to.x + to.width * (0.3 + (i % 3) * 0.2), ty = to.y + to.height * (0.35 + Math.floor(i / 3) * 0.3);
    await it.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await it.mouse.down();
    for (let k = 1; k <= 8; k++) await it.mouse.move(from.x + (tx - from.x) * k / 8, from.y + (ty - from.y) * k / 8);
    await it.mouse.up(); await it.waitForTimeout(180);
    if (i === 4) await it.screenshot({ path: `${out}/s3-pizza-tabur.png` });
  }
  await closed(it); ok((await stepOf(it)) === 2, 'seret-tabur: 6 topping pizza');
  // timing oven (pizza langkah 2)
  await inject(it, 'pizza', 2); await it.waitForTimeout(300);
  await openStation(it, 'oven');
  await it.waitForTimeout(2700);
  await it.screenshot({ path: `${out}/s3-oven.png` });
  await it.click('.mg-tap');
  await closed(it); ok((await stepOf(it)) === 'jadi', 'timing oven: pizza jadi');
  await it.close();

  // ---------- Jepang: gulung sushi
  const jp = await open(5);
  await jp.evaluate(() => window.__kkd.setMode('chef'));
  await jp.waitForTimeout(400);
  await inject(jp, 'sushi', 2); await jp.waitForTimeout(300);
  await openStation(jp, 'talenan');
  const m = await box(jp, '.mg-mat');
  for (let i = 0; i < 3; i++) {
    const x = m.x + m.width / 2;
    await jp.mouse.move(x, m.y + m.height * 0.95); await jp.mouse.down();
    for (let k = 1; k <= 8; k++) await jp.mouse.move(x, m.y + m.height * (0.95 - 0.85 * k / 8));
    await jp.mouse.up(); await jp.waitForTimeout(200);
    if (i === 1) await jp.screenshot({ path: `${out}/s3-gulung.png` });
  }
  await closed(jp); ok((await stepOf(jp)) === 'jadi', 'gulung: 3 gulungan menyelesaikan sushi');
  // ramen: seret tabur ke mangkuk
  await inject(jp, 'ramen', 2); await jp.waitForTimeout(300);
  await openStation(jp, 'talenan');
  await jp.screenshot({ path: `${out}/s3-ramen.png` });
  await jp.click('.mg-close');
  await jp.close();

  // ---------- Tutorial Level 1 (dua layar)
  const tu = await open(1);
  await tu.waitForTimeout(3500);
  ok(await tu.locator('.tut-icon').count() > 0, 'tutorial: kartu bergambar di layar Pelayan');
  ok(await tu.locator('.tut-card').count() > 0, 'tutorial: kartu petunjuk di layar Koki');
  ok(await tu.locator('.tut-arrow').count() > 0, 'tutorial: panah besar di atas tamu');
  await tu.screenshot({ path: `${out}/s3-tutorial-1.png` });
  // ikuti tutorial sampai memasak
  await tu.evaluate(async () => {
    const { session } = window.__kkd;
    for (let i = 0; i < 200; i++) {
      const s = session.sim.state;
      if (s.tickets.length) break;
      if (!s.waiter.goal) {
        const c = s.waiter.carry, p = s.parties[0];
        if (c?.k === 'party') session.handleWaiter({ t: 'tap', target: { k: 'table', id: 0 } });
        else if (c?.k === 'order') session.handleWaiter({ t: 'tap', target: { k: 'pass' } });
        else if (p?.state === 'wantOrder') session.handleWaiter({ t: 'tap', target: { k: 'table', id: p.table } });
        else if (p?.state === 'waitSeat') session.handleWaiter({ t: 'tap', target: { k: 'party', id: p.id } });
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  });
  await tu.waitForTimeout(500);
  ok(await tu.locator('.station-label.tut').count() === 1, 'tutorial: stasiun yang harus diketuk diberi panah');
  await tu.screenshot({ path: `${out}/s3-tutorial-2.png` });
  await tu.close();
} catch (e) { failed++; console.error(e); }
console.log(errors.length ? 'ERROR KONSOL:\n' + errors.join('\n') : 'tidak ada error konsol');
console.log(`\n${passed} lulus, ${failed} gagal`);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
