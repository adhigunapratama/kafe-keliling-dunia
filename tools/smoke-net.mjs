// Uji ujung-ke-ujung MAIN BERDUA: dua browser (HP Koki & tablet Adik) lewat server ruangan.
// Jalankan dulu:  (cd worker && npx wrangler dev --port 8787)   dan   npx vite preview --port 4173
// Lalu:           node tools/smoke-net.mjs [gameUrl] [serverUrl] [outdir]
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
const settings = JSON.stringify({ detected: 'rendah', showFps: true });
async function newPage(name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|ERR_/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
  await page.goto(game);
  await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('kkd.settings', s); }, settings);
  return page;
}
const q = `?server=${encodeURIComponent(server)}`;

try {
  const chef = await newPage('koki', { width: 844, height: 390 });
  const waiter = await newPage('pelayan', { width: 1024, height: 700 });

  // 1. Koki membuat ruangan
  await chef.goto(game + q);
  await chef.click('.btn-continue');
  await chef.waitForSelector('.code-boxes span');
  const code = (await chef.locator('.lobby-main .code-boxes').textContent()).trim();
  ok(/^\d{4}$/.test(code), `Koki mendapat kode ruangan ${code}`);
  ok(await chef.locator('.start-btn').isDisabled(), '"Mulai Main!" menunggu Pelayan');
  await chef.screenshot({ path: `${out}/net-1-ruangan.png` });

  // 2. Adik mengetik kode di keypad (coba kode salah dulu)
  await waiter.goto(game + q);
  await waiter.click('.btn-join');
  await waiter.waitForSelector('.keypad');
  const wrong = String((Number(code) + 5000) % 10000).padStart(4, '0');
  for (const d of wrong) await waiter.click(`.key-${d}`);
  await waiter.click('.key-ok');
  await waiter.waitForSelector('.keypad-err', { timeout: 8000 });
  ok(true, 'kode salah -> tanda silang, keypad dikosongkan');
  for (const d of code) await waiter.click(`.key-${d}`);
  await waiter.screenshot({ path: `${out}/net-2-keypad.png` });
  await waiter.click('.key-ok');
  await waiter.waitForSelector('.guest-wait-main', { timeout: 8000 });
  ok(true, 'Adik masuk ruangan, menunggu Kakak');
  await chef.waitForSelector('.role-waiter:not(.dim)', { timeout: 8000 });
  ok(true, 'kartu Pelayan di HP Koki menjadi "Terhubung"');
  await chef.screenshot({ path: `${out}/net-3-terhubung.png` });
  await waiter.screenshot({ path: `${out}/net-3b-menunggu.png` });

  // 3. Mulai main
  await chef.click('.start-btn', { force: true });
  await chef.waitForSelector('.chef-screen');
  await waiter.waitForSelector('.waiter-screen', { timeout: 8000 });
  ok(true, 'kedua layar masuk permainan');

  // 4. Pelayan main lewat jaringan (bot mengikuti panduan)
  const bot = (sec) => waiter.evaluate(async (sec) => {
    const g = window.__kkdGuest; const end = performance.now() + sec * 1000;
    while (performance.now() < end) {
      const s = g.getState();
      if (s && !s.waiter.goal) {
        const c = s.waiter.carry; let tg = null;
        if (c?.k === 'party') { const t = s.tables.find((t) => t.party === null && t.dirty === 0); if (t) tg = { k: 'table', id: t.id }; }
        else if (c?.k === 'order' || c?.k === 'dirty') tg = { k: 'pass' };
        else if (c?.k === 'dish') tg = { k: 'table', id: c.dish.table };
        else if (s.pass.some((d) => d.announced)) tg = { k: 'pass' };
        else { const o = s.parties.find((p) => p.state === 'wantOrder'); if (o) tg = { k: 'table', id: o.table };
          else { const w = s.parties.find((p) => p.state === 'waitSeat'); if (w) tg = { k: 'party', id: w.id }; else { const d = s.tables.find((t) => t.dirty > 0 && t.party === null); if (d) tg = { k: 'table', id: d.id }; } } }
        if (tg) g.send({ t: 'tap', target: tg });
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }, sec);
  for (let i = 0; i < 25 && !(await chef.evaluate(() => window.__kkdHost.session.sim.state.tickets.length > 0)); i++) await bot(1.5);
  ok(await chef.evaluate(() => window.__kkdHost.session.sim.state.tickets.length > 0), 'pesanan dari Pelayan (lewat jaringan) muncul sebagai tiket di HP Koki');
  const tw = await waiter.evaluate(() => window.__kkdGuest.getState().t);
  const th = await chef.evaluate(() => window.__kkdHost.session.sim.state.t);
  ok(Math.abs(tw - th) < 1.5, `waktu Pelayan selaras dengan host (selisih ${Math.abs(tw - th).toFixed(2)} dtk)`);

  // 5. Koki memasak (lewat sim) lalu menekan bel -> banner di tablet Adik
  await chef.evaluate(() => { const s = window.__kkdHost.session; for (const tk of [...s.sim.state.tickets]) for (let i = 0; i < 5; i++) s.sim.completeStep(tk.id, 1); });
  await chef.waitForTimeout(300);
  await chef.click('.bell-btn', { force: true });
  await waiter.waitForSelector('.food-banner', { timeout: 5000 });
  ok(true, 'bel Koki -> banner "Makanan siap!" di tablet Adik');
  await waiter.screenshot({ path: `${out}/net-4-banner.png` });

  // 6. emoji dua arah
  await waiter.click('.emoji-heart', { force: true });
  await chef.waitForSelector('.msg-from-adik', { timeout: 5000 });
  ok(true, 'emoji hati Adik -> gelembung "Adik: ❤" di HP Koki');
  await chef.click('.emoji-thumb', { force: true });
  await waiter.waitForSelector('.msg-from-kakak', { timeout: 5000 });
  ok(true, 'emoji jempol Kakak -> gelembung di tablet Adik');
  await chef.screenshot({ path: `${out}/net-5-koki.png` });

  // 7. sinyal Adik putus -> game dijeda "Menunggu Adik…" -> tersambung lagi -> lanjut
  await waiter.evaluate(() => { const ws = window.__kkdGuest.client.ws; ws.close(); });
  await chef.waitForSelector('.waiting-overlay', { timeout: 6000 });
  ok(await chef.evaluate(() => window.__kkdHost.session.paused), 'Adik terputus -> game dijeda dengan "Menunggu Adik…"');
  await chef.screenshot({ path: `${out}/net-6-menunggu.png` });
  await chef.waitForSelector('.waiting-overlay', { state: 'detached', timeout: 10000 });
  ok(!(await chef.evaluate(() => window.__kkdHost.session.paused)), 'Adik tersambung lagi otomatis -> game lanjut');

  // 8. tablet Adik dimuat ulang -> otomatis masuk lagi tanpa mengetik kode
  await waiter.reload();
  await waiter.waitForSelector('.waiter-screen', { timeout: 10000 });
  ok(true, 'tablet Adik dimuat ulang -> langsung kembali ke permainan');
  await bot(4);

  // 9. jeda dari Adik
  await waiter.click('.btn-pause', { force: true });
  await chef.waitForFunction(() => window.__kkdHost.session.paused, null, { timeout: 5000 });
  ok(true, 'jeda dari tablet Adik menjeda game di host');
  await waiter.click('.resume-big', { force: true });
  await chef.waitForFunction(() => !window.__kkdHost.session.paused, null, { timeout: 5000 });
  ok(true, 'Adik melanjutkan game');

  // 10. akhir level -> hasil di kedua layar
  await chef.evaluate(() => { const s = window.__kkdHost.session.sim.state; s.tutorial = false; s.t = s.duration - 0.3; });
  await waiter.waitForSelector('.result-screen', { timeout: 8000 });
  await chef.waitForSelector('.result-screen', { timeout: 8000 });
  ok(true, 'layar Hasil muncul di kedua perangkat');
  await waiter.screenshot({ path: `${out}/net-7-hasil-adik.png` });

  // 11. main lagi dari Koki -> Adik ikut
  await chef.click('.result-actions .btn-yellow', { force: true });
  await waiter.waitForSelector('.waiter-screen:not(:has(+ * .result-screen))', { timeout: 8000 });
  await waiter.waitForFunction(() => !document.querySelector('.result-screen'), null, { timeout: 8000 });
  ok(true, '"Main lagi" di HP Koki -> tablet Adik ikut mulai');
} catch (e) {
  failed++; console.error(e);
}
console.log(errors.length ? 'ERROR KONSOL:\n' + errors.join('\n') : 'tidak ada error konsol');
console.log(`\n${passed} lulus, ${failed} gagal`);
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
