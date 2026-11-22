import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialLib, MatOpts } from './materials';

export interface BakeInfo { color: number; opts: MatOpts }

/**
 * Pembuat geometri membulat bergaya referensi (rbox, cyl, sph, cap, ...).
 * Geometri di-cache dan dipakai ulang; tiap mesh menyimpan warna+opsi di userData.bake
 * supaya benda statis bisa digabung (lihat bake.ts).
 */
export class Builder {
  private geo = new Map<string, THREE.BufferGeometry>();
  constructor(readonly lib: MaterialLib, readonly segScale = 1) {}

  private seg(n: number, min = 6) { return Math.max(min, Math.round(n * this.segScale)); }
  private cached(key: string, make: () => THREE.BufferGeometry) {
    let g = this.geo.get(key);
    if (!g) { g = make(); this.geo.set(key, g); }
    return g;
  }

  mesh(geo: THREE.BufferGeometry, color: number, parent: THREE.Object3D | null, o: MatOpts = {}, cast = true, receive = true): THREE.Mesh {
    const m = new THREE.Mesh(geo, this.lib.get(color, o));
    m.castShadow = cast; m.receiveShadow = receive;
    m.userData.bake = { color, opts: o } satisfies BakeInfo;
    parent?.add(m);
    return m;
  }

  rbox(w: number, h: number, d: number, color: number, x: number, y: number, z: number, r = 0.08, parent: THREE.Object3D | null = null, o: MatOpts = {}) {
    const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const segs = this.segScale < 0.7 ? 2 : this.segScale < 0.9 ? 3 : 4;
    const g = this.cached(`rb${w},${h},${d},${rr},${segs}`, () => new RoundedBoxGeometry(w, h, d, segs, rr));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  cyl(rt: number, rb: number, h: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}, seg = 40) {
    const s = seg <= 6 ? seg : this.seg(seg);
    const g = this.cached(`cy${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  sph(r: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}, seg = 32) {
    const ws = this.seg(r < 0.06 ? Math.min(seg, 12) : seg), hs = this.seg(r < 0.06 ? 8 : Math.round(seg * 0.62), 5);
    const g = this.cached(`sp${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  /** Belahan bola (mis. rambut, bel). thetaLen = bagian dari kutub atas. */
  dome(r: number, thetaLen: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}) {
    const ws = this.seg(32), hs = this.seg(16, 5);
    const g = this.cached(`dm${r},${thetaLen},${ws}`, () => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, thetaLen));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  cap(r: number, len: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}) {
    const cs = this.segScale < 0.7 ? 4 : 8, rs = this.seg(20);
    const g = this.cached(`ca${r},${len},${cs},${rs}`, () => new THREE.CapsuleGeometry(r, len, cs, rs));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  /** Cincin datar (sudah diputar menghadap atas). */
  ring(R: number, r: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}) {
    const g = this.cached(`to${R},${r}`, () => new THREE.TorusGeometry(R, r, this.seg(12, 6), this.seg(Math.max(40, R * 60), 24)).rotateX(Math.PI / 2));
    const m = this.mesh(g, color, parent, o, false, false); m.position.set(x, y, z); return m;
  }
  torus(R: number, r: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}) {
    const g = this.cached(`tt${R},${r}`, () => new THREE.TorusGeometry(R, r, this.seg(12, 6), this.seg(30, 16)));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  cone(r: number, h: number, radial: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D | null = null, o: MatOpts = {}, open = false) {
    const g = this.cached(`co${r},${h},${radial},${open}`, () => new THREE.ConeGeometry(r, h, radial, 1, open));
    const m = this.mesh(g, color, parent, o); m.position.set(x, y, z); return m;
  }
  /** Prisma segitiga (mis. bendera untaian). */
  tri(w: number, h: number, color: number, parent: THREE.Object3D | null = null, o: MatOpts = {}) {
    const g = this.cached(`tri${w},${h}`, () => {
      const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, -h)]);
      return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false });
    });
    return this.mesh(g, color, parent, o, false, true);
  }

  dispose() { this.geo.forEach((g) => g.dispose()); this.geo.clear(); }
}

/** Tekstur kanvas kecil untuk pola (lantai papan, ubin, garis kanopi). */
export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
