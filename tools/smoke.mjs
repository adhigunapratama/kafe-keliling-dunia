// Uji asap: buka game di Chromium, mainkan Level 1 secara otomatis lewat UI + kait debug,
// ambil tangkapan layar, dan gagal bila ada error di konsol.
// Pakai: npm run build && npx vite preview --port 4173 &   lalu   node tools/smoke.mjs [url] [outdir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'test-results';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
async function run(name, viewport) {
  const page = await browser.newPage({ viewport });
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${name}] ${e}`));
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('kkd.settings', JSON.stringify({ showFps: true, detected: 'sedang' })));
  await page.reload();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}-1-judul.png` });
  await page.click('.test-note');
  await page.waitForTimeout(1500);
  // bot: Pelayan mengikuti panduan, Koki menyelesaikan langkah (lewat sim) kecuali tiket pertama dimainkan lewat UI
  const step = async (sec) => page.evaluate(async (sec) => {
    const { session, link } = window.__kkd;
    const end = performance.now() + sec * 1000;
    while (performance.now() < end) {
      const s = session.sim.state;
      if (!s.waiter.goal) {
        // panduan dihitung ulang di sini (versi build tidak mengekspor modul)
        const c = s.waiter.carry;
        let tg = null;
        if (c?.k === 'party') { const t = s.tables.find((t) => t.party === null && t.dirty === 0); if (t) tg = { k: 'table', id: t.id }; }
        else if (c?.k === 'order' || c?.k === 'dirty') tg = { k: 'pass' };
        else if (c?.k === 'dish') tg = { k: 'table', id: c.dish.table };
        else if (s.pass.some((d) => d.announced)) tg = { k: 'pass' };
        else { const o = s.parties.find((p) => p.state === 'wantOrder'); if (o) tg = { k: 'table', id: o.table };
          else { const q = s.parties.find((p) => p.state === 'waitSeat'); if (q && s.tables.some((t) => t.party === null && t.dirty === 0)) tg = { k: 'party', id: q.id };
          else { const d = s.tables.find((t) => t.dirty > 0 && t.party === null); if (d) tg = { k: 'table', id: d.id }; } } }
        if (tg) link.send({ t: 'tap', target: tg });
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }, sec);
  await step(14);
  for (let i = 0; i < 20 && !(await page.evaluate(() => window.__kkd.session.sim.state.tickets.length > 0)); i++) await step(1.5);
  await page.screenshot({ path: `${out}/${name}-2-main.png` });
  // buka mini-game lewat label stasiun yang aktif
  const label = await page.$('.station-label.active');
  if (label) { await label.click({ force: true }); await page.waitForTimeout(800); await page.screenshot({ path: `${out}/${name}-3-minigame.png` }); await page.click('.mg-close'); }
  // selesaikan masakan via sim, bunyikan bel
  await page.evaluate(() => { const { session } = window.__kkd; for (const tk of [...session.sim.state.tickets]) for (let i = 0; i < 5; i++) session.sim.completeStep(tk.id, 1); });
  await page.waitForTimeout(400);
  await page.click('.bell-btn', { force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-4-bel.png` });
  await page.evaluate(() => window.__kkd.setMode('waiter'));
  await step(6);
  await page.screenshot({ path: `${out}/${name}-5-antar.png` });
  await page.evaluate(() => window.__kkd.setMode('chef'));
  // percepat sampai selesai
  await page.evaluate(() => { const { session } = window.__kkd; session.sim.state.tutorial = false; session.sim.state.t = session.sim.state.duration - 0.5; });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${name}-6-hasil.png` });
  console.log(name, 'fps:', await page.evaluate(() => document.querySelector('.fps')?.textContent ?? '-'));
  await page.close();
}
await run('desktop', { width: 1280, height: 720 });
await run('hp', { width: 844, height: 390 });
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'tidak ada error konsol');
await browser.close();
process.exit(errors.length ? 1 : 0);
