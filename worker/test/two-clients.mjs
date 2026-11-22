// Uji otomatis server ruangan dengan dua klien (Koki & Pelayan).
// Jalankan `npx wrangler dev --port 8787` lalu `node test/two-clients.mjs [http://localhost:8787]`.
// Bila argumen --spawn diberikan, skrip ini menyalakan wrangler dev sendiri.
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:8787';
const wsBase = base.replace(/^http/, 'ws');
let child = null;

async function waitUp() {
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(base + '/health'); if (r.ok) return; } catch { /* belum siap */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server tidak menyala');
}

if (args.includes('--spawn')) {
  child = spawn('npx', ['wrangler', 'dev', '--port', new URL(base).port || '8787', '--ip', '127.0.0.1'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  child.stdout.on('data', () => {}); child.stderr.on('data', () => {});
}

let passed = 0, failed = 0;
function ok(cond, name) { if (cond) { passed++; console.log('  ✓', name); } else { failed++; console.log('  ✗', name); } }

/** Klien kecil yang mengumpulkan pesan. */
function client(path) {
  const ws = new WebSocket(wsBase + path);
  const msgs = [];
  const waiters = [];
  let closed = null;
  ws.addEventListener('message', (e) => {
    const m = e.data === 'pong' ? { t: 'pong' } : JSON.parse(e.data);
    msgs.push(m);
    for (const w of [...waiters]) if (w.pred(m)) { waiters.splice(waiters.indexOf(w), 1); w.res(m); }
  });
  ws.addEventListener('close', (e) => { closed = e.code; for (const w of waiters) w.res(null); });
  const opened = new Promise((res) => ws.addEventListener('open', res));
  return {
    ws, msgs, opened,
    get closed() { return closed; },
    send: (m) => ws.send(typeof m === 'string' ? m : JSON.stringify(m)),
    next: (pred, ms = 4000) => {
      const hit = msgs.find(pred);
      if (hit) { msgs.splice(msgs.indexOf(hit), 1); return Promise.resolve(hit); }
      return new Promise((res) => { const w = { pred: (m) => { if (pred(m)) { msgs.splice(msgs.indexOf(m), 1); return true; } return false; }, res }; waiters.push(w); setTimeout(() => res(null), ms); });
    },
    closedP: () => new Promise((res) => { if (closed !== null) res(closed); else ws.addEventListener('close', (e) => res(e.code)); }),
    close: () => ws.close(),
  };
}

try {
  await waitUp();
  console.log('Server ruangan:', base);

  // origin
  const bad = await fetch(base + '/rooms', { method: 'POST', headers: { Origin: 'https://jahat.example.com' }, body: '{"v":1}' });
  ok(bad.status === 403, 'origin asing ditolak');
  const good = await fetch(base + '/rooms', { method: 'OPTIONS', headers: { Origin: 'https://tahap-2.cafe-abangade.pages.dev' } });
  ok(good.headers.get('access-control-allow-origin') === 'https://tahap-2.cafe-abangade.pages.dev', 'CORS untuk preview *.pages.dev');

  // buat ruangan
  const r = await fetch(base + '/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' }, body: JSON.stringify({ v: 1 }) });
  const { code, token } = await r.json();
  ok(/^\d{4}$/.test(code) && token?.length === 32, `ruangan dibuat (kode ${code})`);

  // kode lain tidak ada
  const other = String((Number(code) + 1) % 10000).padStart(4, '0');
  const nf = client(`/rooms/${other}/ws?role=waiter&v=1`);
  const nfe = await nf.next((m) => m.t === 'error');
  ok(nfe?.error === 'notfound', 'kode salah -> "notfound"');

  // Koki tanpa token ditolak
  const intr = client(`/rooms/${code}/ws?role=chef&v=1`);
  ok((await intr.next((m) => m.t === 'error'))?.error === 'forbidden', 'Koki tanpa token ditolak');

  // Koki masuk
  const chef = client(`/rooms/${code}/ws?role=chef&v=1&token=${token}`);
  const w1 = await chef.next((m) => m.t === 'welcome');
  ok(w1 && w1.peer === false, 'Koki masuk, Pelayan belum ada');

  // versi berbeda
  const old = client(`/rooms/${code}/ws?role=waiter&v=0`);
  const ve = await old.next((m) => m.t === 'error');
  ok(ve?.error === 'version' && ve.host === 1, 'versi protokol berbeda -> "version"');

  // Pelayan masuk
  let waiter = client(`/rooms/${code}/ws?role=waiter&v=1`);
  const w2 = await waiter.next((m) => m.t === 'welcome');
  ok(w2 && w2.peer === true, 'Pelayan masuk, Koki sudah ada');
  ok((await chef.next((m) => m.t === 'peer' && m.role === 'waiter' && m.connected)) !== null, 'Koki diberi tahu Pelayan terhubung');

  // pesan diteruskan dua arah
  chef.send({ t: 'state', s: { t: 1.5 } });
  ok((await waiter.next((m) => m.t === 'state'))?.s.t === 1.5, 'status Koki -> Pelayan');
  waiter.send({ t: 'tap', target: { k: 'pass' } });
  ok((await chef.next((m) => m.t === 'tap'))?.target.k === 'pass', 'ketukan Pelayan -> Koki');
  waiter.send({ t: 'emoji', kind: 'heart' });
  ok((await chef.next((m) => m.t === 'emoji'))?.kind === 'heart', 'emoji Pelayan -> Koki');
  ok(!chef.msgs.some((m) => m.t === 'state'), 'pesan tidak memantul ke pengirim');

  // ping/pong otomatis (tanpa membangunkan objek)
  waiter.send('ping');
  ok((await waiter.next((m) => m.t === 'pong')) !== null, 'ping -> pong');

  // Pelayan putus lalu sambung ulang
  waiter.close();
  ok((await chef.next((m) => m.t === 'peer' && m.role === 'waiter' && !m.connected)) !== null, 'Koki diberi tahu Pelayan terputus');
  waiter = client(`/rooms/${code}/ws?role=waiter&v=1`);
  ok((await waiter.next((m) => m.t === 'welcome'))?.peer === true, 'Pelayan sambung ulang');
  ok((await chef.next((m) => m.t === 'peer' && m.connected)) !== null, 'Koki diberi tahu Pelayan kembali');

  // sambungan kedua dengan peran sama menggantikan yang lama (tanpa "terputus" palsu)
  const waiter2 = client(`/rooms/${code}/ws?role=waiter&v=1`);
  await waiter2.next((m) => m.t === 'welcome');
  ok((await waiter.closedP()) === 4000, 'sambungan lama diganti (kode 4000)');
  await new Promise((r) => setTimeout(r, 300));
  ok(!chef.msgs.some((m) => m.t === 'peer' && !m.connected), 'tidak ada pemberitahuan "terputus" palsu');

  // Koki putus -> Pelayan diberi tahu
  chef.close();
  ok((await waiter2.next((m) => m.t === 'peer' && m.role === 'chef' && !m.connected)) !== null, 'Pelayan diberi tahu Koki terputus');
  const chefB = client(`/rooms/${code}/ws?role=chef&v=1&token=${token}`);
  ok((await chefB.next((m) => m.t === 'welcome'))?.peer === true, 'Koki sambung ulang dengan token');

  // ruangan yang dipakai tidak bisa diklaim lagi -> kode baru selalu berbeda
  const r2 = await (await fetch(base + '/rooms', { method: 'POST', body: '{"v":1}' })).json();
  ok(r2.code !== code, 'ruangan baru mendapat kode lain');

  waiter2.close(); chefB.close();

  // Kode Keluarga (cadangan simpanan)
  const fam = 'KAFE-' + Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[01IOL]/g, '7') + '-AB2C';
  const g0 = await fetch(base + '/backup/' + fam);
  ok(g0.status === 404, 'cadangan belum ada -> 404');
  const put = await fetch(base + '/backup/' + fam, { method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: 'https://cafe-abangade.pages.dev' }, body: JSON.stringify({ v: 2, coins: 120, best: { 1: 3 } }) });
  ok(put.ok && put.headers.get('access-control-allow-origin') === 'https://cafe-abangade.pages.dev', 'cadangan disimpan (CORS ok)');
  const g1 = await (await fetch(base + '/backup/' + fam)).json();
  ok(g1.coins === 120 && g1.best['1'] === 3, 'cadangan bisa dipulihkan');
  ok((await fetch(base + '/backup/KAFE-1234')).status === 400, 'kode keluarga tidak valid ditolak');
  ok((await fetch(base + '/backup/' + fam, { method: 'PUT', body: 'x'.repeat(70000) })).status === 413, 'cadangan terlalu besar ditolak');
} catch (e) {
  failed++;
  console.error(e);
} finally {
  console.log(`\n${passed} lulus, ${failed} gagal`);
  child?.kill('SIGTERM');
  setTimeout(() => process.exit(failed ? 1 : 0), 300);
}
