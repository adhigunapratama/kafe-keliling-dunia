import * as THREE from 'three';
import { View3D } from '../engine/view';
import type { Preset } from '../engine/quality';
import { canvasTex } from '../engine/build';
import { bakeStatic } from '../engine/bake';
import { AnchorLayer } from '../engine/anchors';

/** Data peta hasil tools/build-map.mjs. */
export interface MapData {
  order: string[];
  pins: Record<string, [number, number]>;
  land: THREE.BufferGeometry;
  levels: THREE.BufferGeometry;
  scaleXZ: number;
  scaleY: number;
}

let cached: Promise<MapData> | null = null;

/** Muat & uraikan public/map/world.bin (dimuat saat layar peta dibuka). */
export function loadMap(url = '/map/world.bin'): Promise<MapData> {
  if (cached) return cached;
  cached = fetch(url).then((r) => { if (!r.ok) throw new Error('peta ' + r.status); return r.arrayBuffer(); }).then((buf) => {
    const dv = new DataView(buf);
    const hlen = dv.getUint32(0, true);
    const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hlen)));
    const base = 4 + hlen + ((4 - ((4 + hlen) % 4)) % 4);
    const mk = (name: string, kind: 'land' | 'levels') => {
      const m = header.meshes[name];
      const g = new THREE.BufferGeometry();
      // posisi & normal terkuantisasi -> atribut ternormalisasi; skala dikembalikan lewat mesh.scale
      g.setAttribute('position', new THREE.BufferAttribute(new Int16Array(buf, base + m.p, m.n * 3), 3, true));
      g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, base + m.nn, m.n * 3), 3, true));
      if (kind === 'land') g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(buf, base + m.extra, m.n * 3), 3, true));
      else g.userData.cid = new Uint8Array(buf, base + m.extra, m.n);
      g.setIndex(new THREE.BufferAttribute(m.i32 ? new Uint32Array(buf, base + m.index, m.ni) : new Uint16Array(buf, base + m.index, m.ni), 1));
      g.computeBoundingSphere();
      return g;
    };
    return { order: header.order, pins: header.pins, land: mk('land', 'land'), levels: mk('levels', 'levels'), scaleXZ: 32767 / header.qxz, scaleY: 32767 / header.qy };
  });
  return cached;
}

export type PinStatus = 'done' | 'current' | 'locked' | 'final';
export interface PinInfo { code: string; level: number; status: PinStatus; stars: number; label: string }

const STATUS_COLOR: Record<PinStatus | 'finalDone', number> = { done: 0xffd45c, current: 0x5b9bf0, locked: 0xe4ecd9, final: 0xffb08a, finalDone: 0xffd45c };
const HEAD_COLOR: Record<PinStatus, number> = { done: 0xffc233, current: 0x1f6fd1, locked: 0xc9cfd8, final: 0xe00000 };
const PIN_Y = 0.25;

/**
 * Peta Dunia 3D: daratan (1 mesh), 15 negara level (1 mesh, warna per status),
 * pin, jalur emas, satu rute berikutnya + pesawat, awan & kapal. Kamera perspektif
 * yang bisa digeser dan di-pinch, terbang halus ke pin.
 */
export class WorldMapView extends View3D {
  readonly pcam = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
  private target = new THREE.Vector3(0, 0, 0.5);
  private dist = 21;
  private fly: { from: THREE.Vector3; to: THREE.Vector3; d0: number; d1: number; t: number } | null = null;
  private readonly dir = new THREE.Vector3(0, 17, 11.6).normalize();
  private levelMesh: THREE.Mesh;
  private pinsGroup = new THREE.Group();
  private routeGroup = new THREE.Group();
  private plane = new THREE.Group();
  private planeCurve: THREE.QuadraticBezierCurve3 | null = null;
  private currentRing: THREE.Mesh | null = null;
  private clouds: { g: THREE.Group; speed: number; x0: number }[] = [];
  private boats: { g: THREE.Group; cx: number; cz: number; r: number; a: number; s: number }[] = [];
  private labels: AnchorLayer;
  private time = 0;
  private bounds = { minX: -12, maxX: 12, minZ: -6, maxZ: 6 };
  pins: PinInfo[] = [];
  readonly P: Record<string, THREE.Vector3>;
  selected: string | null = null;

  constructor(container: HTMLElement, preset: Preset, readonly data: MapData) {
    super(container, preset);
    const b = this.b;
    this.P = Object.fromEntries(Object.entries(data.pins).map(([k, [x, z]]) => [k, new THREE.Vector3(x, PIN_Y, z)]));
    // laut dengan gelombang
    const waves = canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#5ebbe3'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 4; c.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const x = (i * 197) % w, y = (i * 131) % h; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 14, y - 10, x + 28, y); c.quadraticCurveTo(x + 42, y + 10, x + 56, y); c.stroke(); }
    }, [5, 3]);
    const sea = b.rbox(27, 0.4, 15.5, 0xffffff, 0, -0.2, 0.2, 0.2, this.scene, { map: waves, r: 0.5 });
    sea.castShadow = false;
    // daratan
    const vmat = this.lib.get(0xffffff, { vertexColors: true, r: 0.8 });
    const land = new THREE.Mesh(data.land, vmat);
    land.scale.set(data.scaleXZ, data.scaleY, data.scaleXZ);
    land.castShadow = true; land.receiveShadow = true;
    this.scene.add(land);
    // negara level (warna diatur per status)
    const n = data.levels.attributes.position.count;
    data.levels.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.levelMesh = new THREE.Mesh(data.levels, vmat);
    this.levelMesh.scale.copy(land.scale);
    this.levelMesh.castShadow = true; this.levelMesh.receiveShadow = true;
    this.scene.add(this.levelMesh);
    data.land.computeBoundingBox();
    const bb = data.land.boundingBox!;
    this.bounds = { minX: bb.min.x * data.scaleXZ, maxX: bb.max.x * data.scaleXZ, minZ: bb.min.z * data.scaleXZ, maxZ: bb.max.z * data.scaleXZ };

    this.scene.add(this.pinsGroup, this.routeGroup, this.plane);
    // pesawat kecil
    const pl = b.cap(0.05, 0.22, 0xffffff, 0, 0, 0, this.plane); pl.rotation.z = Math.PI / 2;
    b.rbox(0.08, 0.015, 0.36, 0x1f6fd1, 0, 0, 0, 0.007, this.plane);
    b.rbox(0.05, 0.1, 0.012, 0x1f6fd1, -0.12, 0.05, 0, 0.005, this.plane);
    this.plane.traverse((o) => { o.castShadow = false; });
    this.plane.visible = false;
    // awan
    ([[-8.5, -3.5], [-2.5, 2.8], [3.5, 3.8], [9, -3.2], [-6.5, 3.5], [2.5, -4.6]] as [number, number][]).forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 1.6 + (i % 2) * 0.3, z);
      for (const [a, bb2, r] of [[0, 0, 0.32], [0.3, 0.05, 0.25], [-0.3, 0.02, 0.24], [0.1, 0.18, 0.22]]) { const s = b.sph(r, 0xffffff, a, bb2, 0, g, { r: 0.9 }); s.scale.set(1, 0.7, 0.8); s.castShadow = false; }
      bakeStatic(g, this.lib);
      this.scene.add(g);
      this.clouds.push({ g, speed: 0.12 + (i % 3) * 0.05, x0: x });
    });
    // kapal
    ([[-3.2, 0.4, 0.9], [3.4, 2.2, 0.7], [-9.6, 1.2, 1.1], [7.5, 3.8, 0.8]] as [number, number, number][]).forEach(([x, z, r], i) => {
      const g = new THREE.Group();
      b.rbox(0.42, 0.1, 0.16, 0xc9432a, 0, 0.05, 0, 0.04, g); b.rbox(0.18, 0.1, 0.12, 0xffffff, -0.04, 0.14, 0, 0.03, g);
      g.traverse((o) => { o.castShadow = false; });
      bakeStatic(g, this.lib);
      this.scene.add(g);
      this.boats.push({ g, cx: x, cz: z, r, a: i * 1.7, s: 0.08 + (i % 2) * 0.04 });
    });

    this.labels = new AnchorLayer(this.overlay);
    this.sun.position.set(6, 14, 8);
    this.setShadowArea(14);
    this.renderer.shadowMap.needsUpdate = true;
    this.resize();
  }

  /** Atur status semua pin / negara / jalur. */
  setPins(pins: PinInfo[]) {
    this.pins = pins;
    const byCode = new Map(pins.map((p) => [p.code, p]));
    // warna negara level
    const cid = this.data.levels.userData.cid as Uint8Array;
    const col = this.data.levels.attributes.color as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let i = 0; i < cid.length; i++) {
      const p = byCode.get(this.data.order[cid[i]]);
      const st = !p ? 'locked' : p.code === 'id' ? (p.stars > 0 ? 'finalDone' : 'final') : p.status;
      c.set(STATUS_COLOR[st]);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    // pin
    this.pinsGroup.clear();
    this.currentRing = null;
    const b = this.b;
    const staticPins = new THREE.Group();
    for (const p of pins) {
      const v = this.P[p.code]; if (!v) continue;
      const st: PinStatus = p.code === 'id' ? 'final' : p.status;
      const big = st === 'current' || st === 'final';
      const h = big ? 0.75 : 0.5, r = big ? 0.2 : 0.14;
      b.cyl(0.07, 0.09, 0.05, 0xffffff, v.x, PIN_Y, v.z, staticPins);
      b.cyl(0.025, 0.025, h, 0xffffff, v.x, PIN_Y + h / 2, v.z, staticPins, {}, 12);
      b.sph(r, p.code === 'id' && p.status === 'done' ? 0xffc233 : HEAD_COLOR[st], v.x, PIN_Y + h + r * 0.6, v.z, staticPins, { r: 0.35 });
      if (st === 'final') {
        const cy0 = PIN_Y + h + r * 1.5;
        b.cyl(0.13, 0.13, 0.06, 0xffc233, v.x, cy0, v.z, staticPins, { m: 0.4, r: 0.3 });
        for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2; b.cone(0.04, 0.12, 12, 0xffc233, v.x + Math.cos(an) * 0.1, cy0 + 0.08, v.z + Math.sin(an) * 0.1, staticPins, { m: 0.4, r: 0.3 }); }
        b.ring(0.45, 0.03, 0xffc233, v.x, PIN_Y + 0.01, v.z, staticPins, { e: 0xffc233, ei: 0.6 });
      }
      if (st === 'current') {
        this.currentRing = b.ring(0.4, 0.03, 0x1f6fd1, v.x, PIN_Y + 0.01, v.z, null, { e: 0x5b9bf0, ei: 0.6 });
        this.pinsGroup.add(this.currentRing);
      }
    }
    staticPins.traverse((o) => { o.castShadow = false; });
    bakeStatic(staticPins, this.lib);
    this.pinsGroup.add(staticPins);
    // jalur: busur emas untuk rute yang sudah dilalui + SATU rute berikutnya (titik-titik + pesawat)
    this.routeGroup.clear();
    const order = pins.slice().sort((a, b2) => a.level - b2.level);
    const cur = order.find((p) => p.status === 'current');
    const curLevel = cur ? cur.level : order.filter((p) => p.status === 'done').length;
    const tubes: THREE.BufferGeometry[] = [];
    this.planeCurve = null;
    for (let i = 0; i + 1 < order.length; i++) {
      const a = this.P[order[i].code], bb = this.P[order[i + 1].code];
      if (!a || !bb) continue;
      const d = a.distanceTo(bb);
      const mid = a.clone().lerp(bb, 0.5); mid.y = 0.5 + d * 0.13;
      const curve = new THREE.QuadraticBezierCurve3(a.clone().setY(0.5), mid, bb.clone().setY(0.5));
      if (order[i + 1].level <= curLevel && order[i + 1].status !== 'locked') tubes.push(new THREE.TubeGeometry(curve, 48, 0.02, 6));
      else if (order[i].level === curLevel && order[i].status !== 'locked') {
        // rute berikutnya: titik-titik putih
        const n = Math.max(6, Math.round(d * 5));
        const dotGeo = new THREE.SphereGeometry(0.032, 8, 6);
        const dots = new THREE.InstancedMesh(dotGeo, this.lib.get(0xffffff, { flat: true }), n);
        const m = new THREE.Matrix4();
        for (let k = 1; k < n; k++) { m.makeTranslation(curve.getPoint(k / n)); dots.setMatrixAt(k - 1, m); }
        dots.count = n - 1;
        this.routeGroup.add(dots);
        this.planeCurve = curve;
      }
    }
    if (tubes.length) {
      for (const t of tubes) { t.deleteAttribute('uv'); }
      const merged = new THREE.Mesh(tubes.length === 1 ? tubes[0] : mergeTubes(tubes), this.lib.get(0xffc233, { e: 0xffb000, ei: 0.25 }));
      this.routeGroup.add(merged);
    }
    this.plane.visible = !!this.planeCurve;
  }

  /** Kamera terbang halus ke titik. */
  flyTo(code: string | null, dist?: number) {
    const v = code ? this.P[code] : new THREE.Vector3(0, 0, 0.5);
    if (!v) return;
    this.fly = { from: this.target.clone(), to: new THREE.Vector3(v.x, 0, v.z + 0.4), d0: this.dist, d1: dist ?? (code ? 9 : 21), t: 0 };
  }
  /** Pusatkan langsung tanpa animasi. */
  centerOn(code: string, dist = 16) { const v = this.P[code]; if (v) { this.target.set(v.x * 0.6, 0, v.z * 0.6 + 0.5); this.dist = dist; } }

  pan(dxPx: number, dyPx: number) {
    this.fly = null;
    const worldPerPx = (2 * Math.tan((this.pcam.fov * Math.PI) / 360) * this.dist) / this.height;
    this.target.x -= dxPx * worldPerPx;
    this.target.z -= (dyPx * worldPerPx) / this.dir.y;
    this.clampTarget();
  }
  zoom(factor: number) { this.fly = null; this.dist = Math.min(24, Math.max(5, this.dist * factor)); this.clampTarget(); }
  get zoomedIn() { return this.dist < 13; }

  private clampTarget() {
    const m = 1;
    this.target.x = Math.min(this.bounds.maxX + m, Math.max(this.bounds.minX - m, this.target.x));
    this.target.z = Math.min(this.bounds.maxZ + m, Math.max(this.bounds.minZ - m, this.target.z));
  }

  fit() {
    if (!this.pcam) return;
    this.pcam.aspect = this.width / this.height;
    // layar sempit (tablet 4:3): mundurkan kamera supaya seluruh peta terlihat
    this.pcam.fov = this.pcam.aspect < 1.5 ? 30 : 26;
    this.pcam.updateProjectionMatrix();
  }

  private mv = new THREE.Vector3();
  project(x: number, y: number, z: number): [number, number] {
    const v = this.mv.set(x, y, z).project(this.pcam);
    return [((v.x + 1) / 2) * this.width, ((1 - v.y) / 2) * this.height];
  }

  /** Pin terdekat dari titik layar (radius jari anak). */
  pick(px: number, py: number): string | null {
    let best: string | null = null, bd = 46;
    for (const p of this.pins) {
      const v = this.P[p.code]; if (!v) continue;
      const big = p.status === 'current' || p.code === 'id';
      const [x, y] = this.project(v.x, PIN_Y + (big ? 0.9 : 0.6), v.z);
      const d = Math.hypot(px - x, py - y);
      if (d < bd) { bd = d; best = p.code; }
    }
    return best;
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt / 0.9);
      const k = 1 - Math.pow(1 - this.fly.t, 3);
      this.target.lerpVectors(this.fly.from, this.fly.to, k);
      this.dist = this.fly.d0 + (this.fly.d1 - this.fly.d0) * k;
      if (this.fly.t >= 1) this.fly = null;
    }
    this.pcam.position.copy(this.target).addScaledVector(this.dir, this.dist);
    this.pcam.lookAt(this.target);
    this.pcam.updateMatrixWorld();
    for (const c of this.clouds) { const span = 28; c.g.position.x = ((c.x0 + t * c.speed + 14) % span + span) % span - 14; }
    for (const b of this.boats) { b.a += dt * b.s; b.g.position.set(b.cx + Math.cos(b.a) * b.r, 0.02 + Math.sin(t * 2 + b.a) * 0.01, b.cz + Math.sin(b.a) * b.r * 0.6); b.g.rotation.y = -b.a; }
    if (this.currentRing) { const k = 1 + Math.sin(t * 4) * 0.08; this.currentRing.scale.set(k, 1, k); }
    if (this.planeCurve) {
      const u = (t * 0.12) % 1;
      const q = this.planeCurve.getPoint(u), tg = this.planeCurve.getTangent(u);
      this.plane.position.copy(q);
      this.plane.lookAt(q.clone().add(new THREE.Vector3(tg.z, 0, -tg.x)));
      this.plane.rotateY(Math.PI / 2);
    }
    // label HTML di atas pin
    this.labels.begin();
    const compact = !this.zoomedIn;
    for (const p of this.pins) {
      const v = this.P[p.code]; if (!v) continue;
      const big = p.status === 'current' || p.code === 'id';
      const [x, y] = this.project(v.x, PIN_Y + (big ? 1.25 : 0.85), v.z);
      const stars = p.status === 'done' || p.stars > 0 ? `<span class="pl-stars">${[0, 1, 2].map((i) => `<i class="${i < p.stars ? 'on' : ''}"></i>`).join('')}</span>` : '';
      const lock = p.status === 'locked' ? '<span class="pl-lock"></span>' : '';
      const html = `<b class="pl-num">${p.level}</b>${compact ? '' : `<span class="pl-name">${p.label}</span>`}${lock}${stars}`;
      this.labels.put('pin-' + p.code, x, y, html, `pin-label st-${p.code === 'id' ? 'final' : p.status} ${this.selected === p.code ? 'sel' : ''} ${compact ? 'compact' : ''}`);
    }
    this.labels.end();
  }

  render() { this.renderer.render(this.scene, this.pcam); }
  info() { const i = this.renderer.info.render; return { calls: i.calls, triangles: i.triangles }; }
  dispose() { this.labels.clear(); super.dispose(); }
}

function mergeTubes(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let total = 0, totalIdx = 0;
  for (const g of geos) { total += g.attributes.position.count; totalIdx += g.index!.count; }
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), idx = new Uint32Array(totalIdx);
  let vo = 0, io = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array as Float32Array, vo * 3);
    nor.set(g.attributes.normal.array as Float32Array, vo * 3);
    const gi = g.index!.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += g.attributes.position.count; io += gi.length;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
