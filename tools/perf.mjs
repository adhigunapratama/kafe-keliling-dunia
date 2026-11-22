// Ukur draw call & segitiga di setiap layar (angka ini sama di semua GPU; fps di VM tidak berarti).
// Pakai: npx vite preview --port 4173 &   lalu   node tools/perf.mjs [url] [preset]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const preset = process.argv[3] || 'tinggi';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(url);
const prog = { v: 2, unlocked: 15, best: { 1: 3 }, coins: 0, last: 15, decor: { owned: [], placed: { lampu: 'lampu-untai', meja: 'meja-bunga', tanaman: 'tanaman-palem' } }, familyCode: null, updatedAt: 1 };
await page.evaluate(([p, pr]) => { localStorage.clear(); localStorage.setItem('kkd.settings', JSON.stringify({ graphics: p, detected: p, showFps: true })); localStorage.setItem('kkd.progress', JSON.stringify(pr)); }, [preset, prog]);
const read = async () => { await page.waitForTimeout(1600); return page.evaluate(() => { const f = document.querySelector('.fps small')?.textContent ?? ''; const m = f.match(/(\d+) dc · (\d+)k/); return m ? { calls: +m[1], tris: +m[2] * 1000 } : null; }); };
const rows = [];
await page.reload(); rows.push(['Judul (kafe 3D)', await read()]);
await page.click('.btn-map'); await page.waitForFunction(() => !!window.__kkdMap, null, { timeout: 15000 }); rows.push(['Peta Dunia', await read()]);
for (const lvl of [1, 15]) {
  await page.goto(url + `?test=1&level=${lvl}`); await page.waitForTimeout(1200);
  // isi kafe: jalankan simulasi 90 detik dengan Pelayan aktif supaya banyak tamu
  await page.evaluate(() => {
    const { session } = window.__kkd; const sim = session.sim;
    for (let i = 0; i < 1800; i++) {
      const s = sim.state;
      if (!s.waiter.goal) { const q = s.parties.find((p) => p.state === 'waitSeat'); const t = s.tables.find((t) => t.party === null && t.dirty === 0); if (s.waiter.carry?.k === 'party' && t) sim.waiterTap({ k: 'table', id: t.id }); else if (q && !s.waiter.carry) sim.waiterTap({ k: 'party', id: q.id }); else if (s.waiter.carry?.k === 'order') sim.waiterTap({ k: 'pass' }); else { const o = s.parties.find((p) => p.state === 'wantOrder'); if (o && !s.waiter.carry) sim.waiterTap({ k: 'table', id: o.table }); } }
      sim.tick(0.05);
    }
    for (const tk of [...sim.state.tickets].slice(0, 3)) for (let k = 0; k < 4; k++) sim.completeStep(tk.id, 1);
  });
  await page.evaluate(() => window.__kkd.setMode('chef')); rows.push([`Dapur level ${lvl}`, await read()]);
  await page.evaluate(() => window.__kkd.setMode('waiter'));
  const guests = await page.evaluate(() => window.__kkd.session.sim.state.parties.reduce((n, p) => n + p.guests.length, 0));
  rows.push([`Ruang makan level ${lvl} (${guests} tamu)`, await read()]);
}
console.log(`preset: ${preset}`);
for (const [name, r] of rows) console.log(`${name.padEnd(34)} ${r ? `${String(r.calls).padStart(4)} draw call  ${String(Math.round(r.tris / 1000)).padStart(4)}k segitiga` : '-'}`);
const bad = rows.filter(([, r]) => r && (r.calls >= 120 || r.tris >= 150000));
console.log(bad.length ? 'MELEBIHI TARGET: ' + bad.map((b) => b[0]).join(', ') : 'semua layar < 120 draw call dan < 150 ribu segitiga');
await browser.close();
process.exit(bad.length ? 1 : 0);
