import * as THREE from 'three';
import { View3D } from '../engine/view';
import type { Preset } from '../engine/quality';
import { bakeStatic } from '../engine/bake';
import { AnchorLayer } from '../engine/anchors';
import type { CountryDef } from '../data/countries';
import { DINING } from '../data/layouts';
import { TABLE_COLORS } from '../data/palette';
import { MENUS } from '../data/menus';
import { buildDecor, buildRoom } from './room';
import { Person, type PersonLook } from '../models/person';
import { modelGeometry } from '../models/food';
import { makeModel } from '../models/registry';
import { moveAt, type NavGrid, type P2 } from '../game/path';
import { buildDiningNav, chairPos, decorObstacles, tableStand } from '../game/sim';
import type { CafeState, Guest, Party, Target } from '../game/types';
import { foodIcon, icon } from '../ui/icons';

const GUEST_HEAD_Y = 2.2;

/**
 * Adegan ruang makan (layar Pelayan). Membaca CafeState (lokal atau dari jaringan)
 * dan menganimasikan semuanya secara lokal dari data lintasan.
 */
export class DiningView extends View3D {
  readonly waiter: Person;
  private guests = new Map<number, Person>();
  private guestRoot = new THREE.Group();
  private bubbles: AnchorLayer;
  private carried = new THREE.Group();
  private carriedKey = '';
  private tableItems = new THREE.Group();
  private tableDishes = new Map<number, THREE.Group>();
  private dirtyPlates: THREE.InstancedMesh;
  private passGroup = new THREE.Group();
  private passItems = new Map<number, THREE.Group>();
  private dots: THREE.InstancedMesh;
  private targetRing: THREE.Mesh;
  private nav: NavGrid;
  private time = 0;
  private lastDir = 0;
  showGuide = true;
  /** Target panduan (dari suggestWaiterTarget). */
  guideTarget: Target | null = null;
  private noopFx = new Map<string, number>();
  readonly drawStats: { before: number; after: number };

  constructor(container: HTMLElement, preset: Preset, country: CountryDef, tables: { color: keyof typeof TABLE_COLORS; x: number; z: number }[], waiterLook: PersonLook) {
    super(container, preset);
    const b = this.b, th = country.dining;
    const root = new THREE.Group();
    this.scene.add(root);
    buildRoom(b, root, th);
    // jendela saji di dinding kiri
    const PZ = DINING.pass.z;
    b.rbox(0.06, 1.2, 1.8, 0xffe6a8, -4.97, 1.75, PZ, 0.02, root, { e: 0xffd27a, ei: 0.4 });
    b.rbox(0.2, 0.12, 2.0, 0xffffff, -4.95, 2.4, PZ, 0.03, root); b.rbox(0.2, 0.12, 2.0, 0xffffff, -4.95, 1.12, PZ, 0.03, root);
    b.rbox(0.9, 0.12, 2.0, 0xd9a066, -4.6, 1.1, PZ, 0.04, root);
    b.rbox(0.5, 1.0, 1.9, th.trim, -4.72, 0.5, PZ, 0.06, root);
    // jendela di dinding belakang
    for (const x of [-1.5, 1.2]) { b.rbox(1.6, 1.3, 0.06, 0xe6f6ff, x, 1.85, -4.98, 0.03, root, { e: 0xcfeeff, ei: 0.3 }); b.rbox(1.75, 0.1, 0.12, 0xffffff, x, 1.18, -4.95, 0.03, root); }
    // pintu
    b.rbox(1.3, 2.2, 0.1, 0x8b5a3c, DINING.door.x, 1.1, -4.97, 0.05, root); b.sph(0.06, 0xffc233, DINING.door.x - 0.45, 1.1, -4.9, root, { m: 0.6 });
    b.rbox(1.4, 0.02, 0.9, 0xc9432a, DINING.door.x, 0.011, -4.4, 0.01, root);
    // meja & kursi
    for (const t of tables) {
      const c = TABLE_COLORS[t.color];
      b.cyl(0.82, 0.92, 0.72, c.cloth, t.x, 0.36, t.z, root);
      b.cyl(0.86, 0.86, 0.06, c.top, t.x, 0.75, t.z, root);
      for (const s of [0, 1]) {
        const [cx, cz] = chairPos(t, s);
        const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = s === 0 ? Math.PI / 2 : -Math.PI / 2; root.add(g);
        b.rbox(0.55, 0.1, 0.55, th.chair, 0, 0.45, 0, 0.04, g);
        b.rbox(0.55, 0.6, 0.1, th.chair, 0, 0.8, -0.25, 0.04, g);
        for (const [a, bb] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) b.cyl(0.04, 0.04, 0.45, 0x8b5a3c, a, 0.22, bb, g, {}, 12);
      }
      if (!this.cfg.shadows) this.blobs.addStatic(t.x, t.z, 1.25, 1.0);
    }
    buildDecor(b, root, country.decorDining, this.blobs);
    this.drawStats = bakeStatic(root, this.lib);

    const vmat = this.lib.get(0xffffff, { vertexColors: true, r: 0.4 });
    this.dirtyPlates = new THREE.InstancedMesh(modelGeometry(b, 'plate-dirty'), vmat, 12);
    this.dirtyPlates.count = 0;
    this.scene.add(this.dirtyPlates, this.guestRoot, this.tableItems, this.passGroup);

    // titik-titik panduan & cincin tujuan
    const dotGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16);
    this.dots = new THREE.InstancedMesh(dotGeo, this.lib.get(0xffffff, { flat: true }), 40);
    this.dots.count = 0; this.dots.frustumCulled = false;
    this.scene.add(this.dots);
    this.targetRing = b.ring(1.25, 0.05, 0xffc233, 0, 0.04, 0, null, { e: 0xffc233, ei: 0.9 });
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);

    this.waiter = new Person(b, waiterLook);
    this.waiter.group.position.set(DINING.waiterStart[0], 0, DINING.waiterStart[1]);
    this.waiter.hold.add(new THREE.Mesh(modelGeometry(b, 'tray'), vmat));
    this.carried.position.y = 0.04;
    this.waiter.hold.add(this.carried);
    this.scene.add(this.waiter.group);

    this.nav = buildDiningNav(tables, decorObstacles(country.decorDining));
    this.bubbles = new AnchorLayer(this.overlay);

    this.fitPoints = [new THREE.Vector3(-5.2, 0, -5.2), new THREE.Vector3(5, 0, 5), new THREE.Vector3(-5.2, 3, -5.2), new THREE.Vector3(5.1, 0, -5.2), new THREE.Vector3(-5.2, 0, 5.1), new THREE.Vector3(-5.2, 3, 5), new THREE.Vector3(5, 3, -5.2)];
    this.setShadowArea(8);
    this.fit();
    this.refreshShadows();
  }

  /** Efek "tidak bisa" kecil pada target. */
  flashNoop(t: Target) { this.noopFx.set(targetKey(t), this.time); }

  /** Titik dunia untuk target (untuk ketukan & panduan). */
  targetPoint(s: CafeState, t: Target): THREE.Vector3 | null {
    if (t.k === 'pass') return new THREE.Vector3(DINING.pass.x, 1.2, DINING.pass.z);
    if (t.k === 'table') { const tb = s.tables[t.id]; return tb ? new THREE.Vector3(tb.x, 0.8, tb.z) : null; }
    const p = s.parties.find((p) => p.id === t.id);
    if (!p) return null;
    const m = moveAt(p.guests[0].move, s.t);
    return new THREE.Vector3(m.x, 1.3, m.z);
  }

  /** Cari target dari ketukan layar (titik terdekat, radius besar untuk jari kecil). */
  pick(s: CafeState, px: number, py: number): Target | null {
    const cands: { t: Target; p: THREE.Vector3; r: number }[] = [];
    cands.push({ t: { k: 'pass' }, p: new THREE.Vector3(DINING.pass.x + 0.3, 1.3, DINING.pass.z), r: 1 });
    for (const tb of s.tables) cands.push({ t: { k: 'table', id: tb.id }, p: new THREE.Vector3(tb.x, 0.9, tb.z), r: 1.2 });
    for (const p of s.parties) {
      if (p.table >= 0 || p.state === 'leaving') continue;
      const m = moveAt(p.guests[0].move, s.t);
      cands.push({ t: { k: 'party', id: p.id }, p: new THREE.Vector3(m.x, 1.1, m.z), r: 0.9 });
    }
    const unit = this.pxPerUnit();
    let best: Target | null = null, bd = Infinity;
    for (const c of cands) {
      const [x, y] = this.project(c.p.x, c.p.y, c.p.z);
      const d = Math.hypot(px - x, py - y) / (c.r * unit);
      if (d < bd) { bd = d; best = c.t; }
    }
    return bd <= 1.25 ? best : null;
  }

  private pxPerUnit() {
    const [x0, y0] = this.project(0, 0, 0), [x1, y1] = this.project(1, 0, -1);
    return Math.hypot(x1 - x0, y1 - y0) / Math.SQRT2;
  }

  update(dt: number, s: CafeState) {
    this.time += dt;
    const t = s.t, now = this.time;
    this.blobs.begin();
    this.bubbles.begin();

    // ---------------- Pelayan
    const w = s.waiter;
    const wm = moveAt(w.move, t);
    this.waiter.group.position.set(wm.x, 0, wm.z);
    if (wm.moving) { this.lastDir = wm.dir; this.waiter.faceTowards(wm.dir, dt); }
    else if (w.carry === null && w.goal === null) this.waiter.faceTowards(this.lastDir, dt);
    this.waiter.animate(dt, { moving: wm.moving, seated: false, react: null, carryUp: !!w.carry && w.carry.k !== 'party' });
    this.blobs.push(wm.x, wm.z, 0.42);
    const ck = !w.carry ? '' : w.carry.k === 'dish' ? 'dish:' + w.carry.dish.menu : w.carry.k === 'dirty' ? 'dirty:' + w.carry.n : w.carry.k;
    if (ck !== this.carriedKey) {
      this.carriedKey = ck;
      this.carried.clear();
      const c = w.carry;
      if (c?.k === 'dish') {
        this.carried.add(new THREE.Mesh(modelGeometry(this.b, 'plate'), this.lib.get(0xffffff, { vertexColors: true, r: 0.4 })));
        const f = makeModel(this.b, MENUS[c.dish.menu]?.model ?? 'unknown'); f.position.y = 0.04; this.carried.add(f);
      } else if (c?.k === 'dirty') {
        for (let i = 0; i < Math.min(c.n, 4); i++) { const p = new THREE.Mesh(modelGeometry(this.b, 'plate-dirty'), this.lib.get(0xffffff, { vertexColors: true, r: 0.4 })); p.position.y = i * 0.05; p.rotation.y = i; this.carried.add(p); }
      } else if (c?.k === 'order') {
        const n = new THREE.Mesh(modelGeometry(this.b, 'note'), this.lib.get(0xffffff, { vertexColors: true, r: 0.4 })); this.carried.add(n);
      }
    }

    // ---------------- Tamu
    const seen = new Set<number>();
    for (const p of s.parties) {
      for (const g of p.guests) {
        seen.add(g.id);
        let person = this.guests.get(g.id);
        if (!person) {
          person = new Person(this.b, guestLook(g));
          person.group.userData.born = now;
          this.guestRoot.add(person.group);
          this.guests.set(g.id, person);
        }
        const m = moveAt(g.move, t);
        const seated = g.seat >= 0 && !m.moving && p.state !== 'leaving' && p.state !== 'toTable';
        person.group.position.set(m.x, 0, m.z);
        if (m.moving) person.faceTowards(m.dir, dt);
        else if (seated) person.faceTowards(g.seat === 0 ? Math.PI / 2 : -Math.PI / 2, dt);
        else if (p.table < 0) person.faceTowards(Math.PI / 4 + Math.PI / 2, dt);
        // muncul & menghilang di pintu
        const age = now - person.group.userData.born;
        const atDoor = p.state === 'leaving' && Math.hypot(m.x - DINING.door.spawn[0], m.z - DINING.door.spawn[1]) < 0.6;
        const sc = Math.min(1, age / 0.3) * (atDoor ? Math.max(0.01, Math.hypot(m.x - DINING.door.spawn[0], m.z - DINING.door.spawn[1]) / 0.6) : 1);
        person.group.scale.setScalar(Math.max(0.01, sc));
        const react = g.react && t < g.reactUntil ? g.react : p.state === 'leaving' && p.mood === 'angry' ? 'sad' : null;
        const eating = g.dishState === 'served' && t < g.eatEnd;
        person.animate(dt, { moving: m.moving, seated, react, carryUp: false, eating });
        this.blobs.push(m.x, m.z, 0.38 * sc);
      }
      this.partyBubble(p, s);
    }
    for (const [id, person] of this.guests) if (!seen.has(id)) { this.guestRoot.remove(person.group); this.guests.delete(id); }

    // ---------------- Makanan di meja & piring kotor
    const dishSeen = new Set<number>();
    const mtx = new THREE.Matrix4();
    let nd = 0;
    for (const tb of s.tables) {
      const p = tb.party !== null ? s.parties.find((x) => x.id === tb.party) : undefined;
      if (p) for (const g of p.guests) {
        if (g.dishState !== 'served' && g.dishState !== 'eaten') continue;
        dishSeen.add(g.id);
        let d = this.tableDishes.get(g.id);
        if (!d) {
          d = new THREE.Group();
          d.add(new THREE.Mesh(modelGeometry(this.b, 'plate'), this.lib.get(0xffffff, { vertexColors: true, r: 0.4 })));
          const f = makeModel(this.b, MENUS[g.dish ?? '']?.model ?? 'unknown'); f.position.y = 0.04; f.name = 'food'; d.add(f);
          this.tableItems.add(d); this.tableDishes.set(g.id, d);
        }
        const [cx] = chairPos(tb, g.seat);
        d.position.set(tb.x + (cx - tb.x) * 0.38, 0.78, tb.z);
        const food = d.getObjectByName('food')!;
        const k = g.dishState === 'eaten' ? 0 : Math.max(0, 1 - (t - g.eatStart) / Math.max(0.1, g.eatEnd - g.eatStart));
        food.scale.setScalar(Math.max(0.001, 0.35 + 0.65 * k));
        food.visible = k > 0.02;
      }
      for (let i = 0; i < tb.dirty && nd < 12; i++, nd++) {
        mtx.makeRotationY(i * 1.3).setPosition(tb.x + (i % 2 ? 0.32 : -0.3), 0.79 + Math.floor(i / 2) * 0.05, tb.z + (i % 2 ? 0.12 : -0.05));
        this.dirtyPlates.setMatrixAt(nd, mtx);
      }
      if (tb.dirty > 0 && tb.party === null) {
        const [x, y] = this.project(tb.x, 1.7, tb.z);
        this.bubbles.put('dirty' + tb.id, x, y, icon('sparkle'), 'bubble bubble-sparkle');
      }
    }
    this.dirtyPlates.count = nd; this.dirtyPlates.instanceMatrix.needsUpdate = true;
    for (const [id, d] of this.tableDishes) if (!dishSeen.has(id)) { this.tableItems.remove(d); this.tableDishes.delete(id); }

    // ---------------- Jendela saji (makanan yang sudah dibunyikan belnya)
    const ann = s.pass.filter((d) => d.announced);
    const annIds = new Set(ann.map((d) => d.id));
    for (const [id, g] of this.passItems) if (!annIds.has(id)) { this.passGroup.remove(g); this.passItems.delete(id); }
    ann.forEach((d, i) => {
      let g = this.passItems.get(d.id);
      if (!g) {
        g = new THREE.Group();
        g.add(new THREE.Mesh(modelGeometry(this.b, 'plate'), this.lib.get(0xffffff, { vertexColors: true, r: 0.4 })));
        const f = makeModel(this.b, MENUS[d.menu]?.model ?? 'unknown'); f.position.y = 0.04; g.add(f);
        this.passGroup.add(g); this.passItems.set(d.id, g);
      }
      g.position.set(-4.55, 1.16, DINING.pass.z - 0.55 + (i % 3) * 0.55);
    });
    if (ann.length) {
      const [x, y] = this.project(DINING.pass.x, 2.1, DINING.pass.z - 0.6);
      const html = `<div class="bubble-row">${icon('bell')}${ann.slice(0, 3).map((d) => `<span class="bubble-food" style="--tc:${TABLE_COLORS[s.tables[d.table].color].css}">${foodIcon(MENUS[d.menu]?.icon ?? '')}</span>`).join('')}</div>`;
      this.bubbles.put('pass', x, y, html, 'bubble bubble-pass');
    }

    // ---------------- Panduan arah
    this.updateGuide(s, wm);
    // efek "tidak bisa"
    for (const [k, t0] of this.noopFx) {
      if (now - t0 > 0.8) { this.noopFx.delete(k); continue; }
      const tg = parseTargetKey(k);
      const pt = tg && this.targetPoint(s, tg);
      if (pt) { const [x, y] = this.project(pt.x, pt.y + 0.8, pt.z); this.bubbles.put('noop' + k, x, y, icon('close'), 'bubble bubble-noop'); }
    }

    this.blobs.end();
    this.bubbles.end();
  }

  private partyBubble(p: Party, s: CafeState) {
    if (p.state === 'arriving' || p.state === 'toTable' || p.state === 'reading') return;
    const g0 = p.guests[0];
    const m = moveAt(g0.move, s.t);
    const seated = p.table >= 0 && p.state !== 'leaving';
    const [x, y] = this.project(m.x, seated ? GUEST_HEAD_Y - 0.05 : GUEST_HEAD_Y + 0.15, m.z);
    let html = '', cls = 'bubble';
    if (p.state === 'leaving') { html = icon(p.mood === 'angry' ? 'sad' : 'heart'); cls += p.mood === 'angry' ? ' bubble-sad' : ' bubble-happy'; }
    else if (p.state === 'waitSeat') html = icon('chair');
    else if (p.state === 'withWaiter') { html = icon('heart'); cls += ' bubble-small'; }
    else if (p.state === 'wantOrder') html = icon('book');
    else if (p.state === 'waitFood') {
      const waiting = p.guests.filter((g) => g.dishState === 'waiting');
      if (!waiting.length) return;
      html = `<div class="bubble-row">${waiting.map((g) => foodIcon(MENUS[g.dish ?? '']?.icon ?? '')).join('')}</div>`;
    }
    if (!html) return;
    const draining = p.state === 'waitSeat' || p.state === 'wantOrder' || p.state === 'waitFood';
    const pc = p.patience > 0.5 ? 'p-hi' : p.patience > 0.25 ? 'p-mid' : 'p-lo';
    if (draining) cls += ' ' + pc;
    const tc = p.table >= 0 ? TABLE_COLORS[s.tables[p.table].color].css : '';
    this.bubbles.put('party' + p.id, x, y, html, cls, tc ? `--tc:${tc}` : '');
  }

  private dotPts: P2[] = [];
  private dotKey = '';
  private updateGuide(s: CafeState, wm: { x: number; z: number; moving: boolean }) {
    const tg = this.showGuide ? this.guideTarget : null;
    if (!tg) { this.dots.count = 0; this.targetRing.visible = false; return; }
    const pt = this.targetPoint(s, tg);
    if (!pt) { this.dots.count = 0; this.targetRing.visible = false; return; }
    // cincin tujuan
    this.targetRing.visible = true;
    const pulse = 1 + Math.sin(this.time * 5) * 0.05;
    if (tg.k === 'table') { this.targetRing.position.set(pt.x, 0.04, pt.z); this.targetRing.scale.set(pulse, 1, pulse); }
    else if (tg.k === 'pass') { this.targetRing.position.set(-4.5, 1.2, DINING.pass.z); this.targetRing.scale.set(0.45 * pulse, 1, 0.75 * pulse); }
    else { this.targetRing.position.set(pt.x, 0.04, pt.z); this.targetRing.scale.set(0.5 * pulse, 1, 0.5 * pulse); }
    // titik-titik di lantai (dihitung ulang hanya bila tujuan/posisi berubah cukup jauh)
    const dest: P2 = tg.k === 'pass' ? DINING.pass.stand : tg.k === 'table' ? tableStand(s.tables[tg.id]) : [pt.x - 0.75, pt.z + 0.35];
    const key = `${targetKey(tg)}:${Math.round(wm.x * 2)}:${Math.round(wm.z * 2)}`;
    if (key !== this.dotKey) { this.dotKey = key; this.dotPts = this.nav.findPath([wm.x, wm.z], dest); }
    const mtx = new THREE.Matrix4();
    let n = 0, acc = 0;
    let next = 0.55 - ((this.time * 0.9) % 0.55);
    for (let i = 1; i < this.dotPts.length && n < 40; i++) {
      const [ax, az] = this.dotPts[i - 1], [bx, bz] = this.dotPts[i];
      const L = Math.hypot(bx - ax, bz - az);
      while (next <= acc + L && n < 40) {
        const k = L > 0 ? (next - acc) / L : 0;
        const x = ax + (bx - ax) * k, z = az + (bz - az) * k;
        if (Math.hypot(x - wm.x, z - wm.z) > 0.45) { mtx.makeTranslation(x, 0.02, z); this.dots.setMatrixAt(n++, mtx); }
        next += 0.55;
      }
      acc += L;
    }
    this.dots.count = n; this.dots.instanceMatrix.needsUpdate = true;
  }

  dispose() { this.bubbles.clear(); super.dispose(); }
}

function guestLook(g: Guest): PersonLook {
  return { skin: g.look.skin, hair: g.look.hair, shirt: g.look.shirt, pants: g.look.pants, hairStyle: g.look.hairStyle };
}
export function targetKey(t: Target) { return t.k === 'pass' ? 'pass' : `${t.k}:${t.id}`; }
function parseTargetKey(k: string): Target | null {
  if (k === 'pass') return { k: 'pass' };
  const [kind, id] = k.split(':');
  if (kind === 'table' || kind === 'party') return { k: kind, id: +id } as Target;
  return null;
}
