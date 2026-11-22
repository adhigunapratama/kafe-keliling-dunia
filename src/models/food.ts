import * as THREE from 'three';
import type { Builder } from '../engine/build';
import { mergeParts } from '../engine/bake';

/**
 * Model makanan & barang kecil prosedural. Tiap model digabung menjadi SATU geometri
 * (vertex color) dan di-cache, jadi tiap makanan = 1 draw call.
 * Titik asal (0,0,0) = dasar benda, menghadap +z. Skala: 1 unit = ±1 meter "dunia mainan"
 * (piring berdiameter 0.48). Lihat ASSETS.md untuk konvensi model GLB pengganti.
 */
type Maker = (b: Builder, g: THREE.Group) => void;

const MAKERS: Record<string, Maker> = {
  plate: (b, g) => { b.cyl(0.24, 0.2, 0.04, 0xffffff, 0, 0.02, 0, g, { r: 0.35 }); },
  'plate-dirty': (b, g) => {
    b.cyl(0.24, 0.2, 0.04, 0xf4f1ea, 0, 0.02, 0, g, { r: 0.35 });
    b.sph(0.045, 0xb08a5a, 0.06, 0.045, 0.03, g).scale.set(1, 0.35, 1);
    b.sph(0.035, 0xc9432a, -0.07, 0.045, -0.05, g).scale.set(1, 0.35, 1);
    b.sph(0.03, 0x7ccb6b, -0.02, 0.045, 0.09, g).scale.set(1, 0.35, 1);
  },
  'food/burger': (b, g) => {
    b.cyl(0.17, 0.16, 0.07, 0xe0a052, 0, 0.035, 0, g);
    b.cyl(0.18, 0.18, 0.06, 0x7a4326, 0, 0.1, 0, g);
    const ch = b.rbox(0.32, 0.025, 0.32, 0xffc233, 0, 0.14, 0, 0.01, g); ch.rotation.y = Math.PI / 4;
    b.cyl(0.19, 0.19, 0.025, 0x6fc25e, 0, 0.165, 0, g, {}, 12);
    b.cyl(0.15, 0.15, 0.025, 0xe9573f, 0, 0.19, 0, g);
    const top = b.dome(0.18, Math.PI / 2, 0xe8a85a, 0, 0.2, 0, g); top.scale.set(1, 0.75, 1);
    for (const [x, z] of [[0.05, 0.06], [-0.07, 0.02], [0.02, -0.08], [-0.02, 0.11], [0.1, -0.03]]) b.sph(0.016, 0xfff4d6, x, 0.2 + 0.12 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / 0.03)), z, g);
  },
  'food/fries': (b, g) => {
    b.rbox(0.26, 0.2, 0.17, 0xe9573f, 0, 0.1, 0, 0.04, g);
    b.rbox(0.12, 0.06, 0.18, 0xffffff, 0, 0.12, 0.002, 0.02, g);
    const sticks: [number, number, number, number][] = [[-0.08, 0.02, 0.1, 0.1], [-0.04, -0.02, -0.08, 0.04], [0, 0.03, 0.12, -0.06], [0.04, -0.01, -0.05, -0.1], [0.08, 0.02, 0.06, 0.08], [-0.02, 0.0, 0.0, 0.15], [0.02, -0.03, 0.17, 0]];
    for (const [x, z, rz, rx] of sticks) { const s = b.rbox(0.04, 0.22, 0.04, 0xffd45c, x, 0.27, z, 0.015, g); s.rotation.set(rx, 0, rz); }
  },
  'food/pizza': (b, g) => {
    b.cyl(0.21, 0.21, 0.04, 0xe2b866, 0, 0.02, 0, g);
    b.cyl(0.18, 0.18, 0.045, 0xd9452d, 0, 0.025, 0, g);
    for (const [x, z] of [[0.06, 0.05], [-0.07, 0.03], [0.01, -0.08], [-0.03, 0.1]]) b.cyl(0.035, 0.035, 0.05, 0xfff2c2, x, 0.03, z, g, {}, 16);
    for (const [x, z] of [[0.1, -0.03], [-0.1, -0.06]]) b.sph(0.025, 0x3f8f3a, x, 0.05, z, g).scale.set(1, 0.3, 1);
  },
  'food/spaghetti': (b, g) => {
    b.sph(0.15, 0xf4d58d, 0, 0.03, 0, g).scale.set(1, 0.45, 1);
    b.sph(0.07, 0xc9432a, 0, 0.09, 0, g).scale.set(1, 0.5, 1);
    b.sph(0.02, 0x3f8f3a, 0.03, 0.12, 0.02, g);
  },
  'food/taco': (b, g) => {
    const shell = b.cyl(0.16, 0.16, 0.05, 0xf2c35b, 0, 0.13, 0, g, {}, 24); shell.rotation.x = Math.PI / 2; shell.scale.set(1, 1, 1);
    b.sph(0.12, 0x6fc25e, 0, 0.2, 0, g).scale.set(1.1, 0.5, 0.35);
    b.sph(0.03, 0xe9573f, -0.05, 0.25, 0.01, g); b.sph(0.03, 0xe9573f, 0.06, 0.24, -0.01, g);
    b.sph(0.05, 0x8b4a2b, 0.0, 0.22, 0, g).scale.set(1.4, 0.6, 0.6);
  },
  'food/nachos': (b, g) => {
    for (let i = 0; i < 7; i++) { const a = i * 0.9; const c = b.cone(0.07, 0.02, 3, 0xf2c35b, Math.cos(a) * 0.1, 0.02 + (i % 3) * 0.015, Math.sin(a) * 0.1, g); c.rotation.set(Math.PI / 2 + (i % 2) * 0.3, a, 0); }
    b.sph(0.1, 0xffc233, 0, 0.05, 0, g).scale.set(1, 0.25, 1);
    b.sph(0.03, 0x3f8f3a, 0.05, 0.07, 0.03, g); b.sph(0.025, 0xe9573f, -0.05, 0.07, -0.02, g);
  },
  'food/croissant': (b, g) => {
    const c = b.torus(0.11, 0.06, 0xe8a85a, 0, 0.06, 0, g); c.rotation.x = Math.PI / 2; c.scale.set(1, 0.65, 1);
    b.sph(0.075, 0xd9913f, 0, 0.07, -0.1, g).scale.set(1.3, 0.9, 0.9);
  },
  'food/crepes': (b, g) => {
    const c = b.cyl(0.17, 0.17, 0.025, 0xf4cf8a, 0, 0.015, 0, g); c.scale.set(1, 1, 0.75);
    const f = b.cyl(0.17, 0.17, 0.02, 0xf0c070, 0, 0.035, 0.03, g); f.scale.set(1, 1, 0.45);
    b.rbox(0.18, 0.015, 0.03, 0x6b3a1e, 0, 0.05, 0.02, 0.007, g);
    b.sph(0.035, 0xe9405a, -0.06, 0.06, 0, g); b.sph(0.035, 0xe9405a, 0.06, 0.06, 0.01, g);
  },
  'food/sushi': (b, g) => {
    for (const [x, c] of [[-0.11, 0xf28b5b], [0, 0x6fc25e], [0.11, 0xf28b5b]] as [number, number][]) {
      b.cyl(0.05, 0.05, 0.07, 0x2e3b2f, x, 0.035, 0, g, {}, 20);
      b.cyl(0.042, 0.042, 0.072, 0xffffff, x, 0.037, 0, g, {}, 20);
      b.cyl(0.018, 0.018, 0.074, c, x, 0.038, 0, g, {}, 12);
    }
  },
  'food/ramen': (b, g) => {
    b.cyl(0.2, 0.13, 0.14, 0xe9573f, 0, 0.07, 0, g);
    b.cyl(0.18, 0.18, 0.02, 0xf4d58d, 0, 0.13, 0, g);
    b.sph(0.045, 0xffffff, -0.06, 0.14, 0.03, g).scale.set(1, 0.6, 1);
    b.sph(0.02, 0xffc233, -0.06, 0.16, 0.03, g);
    b.rbox(0.07, 0.08, 0.01, 0x2e3b2f, 0.06, 0.16, -0.06, 0.004, g);
    const ch = b.cyl(0.008, 0.008, 0.36, 0xb06f2e, 0.08, 0.2, 0.05, g, {}, 6); ch.rotation.z = 1.1;
  },
  'food/empanada': (b, g) => {
    for (const x of [-0.08, 0.08]) { const e = b.dome(0.12, Math.PI / 2, 0xe8a85a, x, 0.0, 0, g); e.scale.set(1, 0.7, 0.55); e.rotation.y = x > 0 ? 0.4 : -0.3; }
  },
  'food/asado': (b, g) => {
    b.rbox(0.36, 0.03, 0.24, 0xb07a45, 0, 0.015, 0, 0.012, g);
    for (const [x, z] of [[-0.08, 0], [0.08, 0.02]] as [number, number][]) { b.rbox(0.13, 0.05, 0.16, 0x8b4a2b, x, 0.055, z, 0.02, g); for (let i = 0; i < 3; i++) b.rbox(0.13, 0.052, 0.012, 0x5a2e18, x, 0.056, z - 0.05 + i * 0.05, 0.004, g); }
  },
  'food/meat-pie': (b, g) => {
    b.cyl(0.15, 0.12, 0.08, 0xc98a45, 0, 0.04, 0, g);
    const top = b.dome(0.15, Math.PI / 2, 0xe8a85a, 0, 0.08, 0, g); top.scale.set(1, 0.35, 1);
    b.sph(0.025, 0xe9573f, 0, 0.14, 0, g);
  },
  'food/pavlova': (b, g) => {
    const m = b.dome(0.16, Math.PI / 2, 0xfff8ee, 0, 0, 0, g); m.scale.set(1, 0.6, 1);
    const c = b.dome(0.12, Math.PI / 2, 0xffffff, 0, 0.09, 0, g); c.scale.set(1, 0.4, 1);
    b.sph(0.03, 0xe9405a, -0.05, 0.14, 0, g); b.sph(0.03, 0xe9405a, 0.04, 0.14, 0.04, g);
    b.cyl(0.035, 0.035, 0.015, 0x7cb342, 0.03, 0.14, -0.04, g, {}, 12);
  },
  'food/kebab': (b, g) => {
    const w = b.cap(0.07, 0.22, 0xf3ddb0, 0, 0.07, 0, g); w.rotation.z = Math.PI / 2;
    b.sph(0.05, 0x6fc25e, 0.1, 0.1, 0, g).scale.set(0.6, 1, 1.2); b.sph(0.045, 0x8b4a2b, 0.12, 0.08, 0, g).scale.set(0.6, 1, 1);
  },
  'food/baklava': (b, g) => {
    for (const [x, z] of [[-0.07, -0.05], [0.07, -0.05], [0, 0.07]] as [number, number][]) { const d = b.rbox(0.11, 0.05, 0.11, 0xe8a85a, x, 0.025, z, 0.015, g); d.rotation.y = Math.PI / 4; b.sph(0.015, 0x7cb342, x, 0.055, z, g); }
  },
  'food/bibimbap': (b, g) => {
    b.cyl(0.19, 0.13, 0.12, 0x5a5370, 0, 0.06, 0, g);
    b.cyl(0.17, 0.17, 0.02, 0xffffff, 0, 0.115, 0, g);
    for (const [a, c] of [[0, 0xf28b2b], [1.2, 0x2e7d32], [2.4, 0x8b4a2b], [3.6, 0xe9405a], [4.8, 0xffd45c]] as [number, number][]) b.sph(0.05, c, Math.cos(a) * 0.1, 0.13, Math.sin(a) * 0.1, g).scale.set(1, 0.4, 1);
    b.sph(0.045, 0xffffff, 0, 0.135, 0, g).scale.set(1, 0.35, 1); b.sph(0.02, 0xffc233, 0, 0.15, 0, g);
  },
  'food/tteokbokki': (b, g) => {
    b.sph(0.15, 0xe9405a, 0, 0.02, 0, g).scale.set(1, 0.2, 1);
    for (let i = 0; i < 5; i++) { const c = b.cap(0.025, 0.08, 0xfff0e0, Math.cos(i * 1.3) * 0.07, 0.05, Math.sin(i * 1.3) * 0.07, g); c.rotation.set(Math.PI / 2, 0, i); }
  },
  'food/kabsa': (b, g) => {
    b.sph(0.15, 0xe8b04a, 0, 0.03, 0, g).scale.set(1, 0.4, 1);
    const leg = b.cap(0.04, 0.08, 0xb0602a, 0, 0.1, 0, g); leg.rotation.z = 1.2;
    b.sph(0.015, 0x7cb342, 0.07, 0.07, 0.05, g);
  },
  'food/mutabbaq': (b, g) => {
    b.rbox(0.24, 0.05, 0.18, 0xe8a85a, 0, 0.025, 0, 0.02, g);
    b.rbox(0.25, 0.052, 0.01, 0xb06f2e, 0, 0.026, 0, 0.004, g);
  },
  'food/dimsum': (b, g) => {
    b.cyl(0.17, 0.17, 0.08, 0xd9b77a, 0, 0.04, 0, g);
    for (const [x, z] of [[-0.06, -0.05], [0.06, -0.04], [0, 0.06]] as [number, number][]) { const d = b.dome(0.055, Math.PI / 2, 0xfff8ee, x, 0.08, z, g); d.scale.set(1, 0.9, 1); b.sph(0.012, 0xfff8ee, x, 0.135, z, g); }
  },
  'food/mi-tarik': (b, g) => {
    b.cyl(0.19, 0.13, 0.13, 0xffffff, 0, 0.065, 0, g);
    b.cyl(0.17, 0.17, 0.02, 0xc9894a, 0, 0.12, 0, g);
    for (let i = 0; i < 4; i++) b.torus(0.06, 0.008, 0xf4d58d, -0.04 + i * 0.03, 0.13, 0, g).rotation.x = Math.PI / 2;
    b.rbox(0.06, 0.015, 0.05, 0x7a4326, 0.07, 0.135, 0.04, 0.006, g); b.sph(0.015, 0xe9405a, -0.08, 0.135, 0.05, g);
  },
  'food/jollof': (b, g) => {
    b.sph(0.15, 0xe8742a, 0, 0.03, 0, g).scale.set(1, 0.42, 1);
    for (const [x, z, c] of [[0.05, 0.04, 0xffc233], [-0.06, 0.02, 0x3f8f3a], [0.01, -0.07, 0xe9405a]] as [number, number, number][]) b.sph(0.018, c, x, 0.08, z, g);
  },
  'food/suya': (b, g) => {
    for (const z of [-0.05, 0.05]) { const st = b.cyl(0.006, 0.006, 0.34, 0xb08a50, 0, 0.04, z, g, {}, 6); st.rotation.z = Math.PI / 2; for (let i = 0; i < 3; i++) b.rbox(0.06, 0.05, 0.05, 0x8b4a2b, -0.08 + i * 0.08, 0.04, z, 0.015, g); }
  },
  'food/pad-thai': (b, g) => {
    b.sph(0.15, 0xe8b04a, 0, 0.025, 0, g).scale.set(1, 0.38, 1);
    const sh = b.torus(0.03, 0.013, 0xf28b5b, -0.04, 0.08, 0.02, g); sh.rotation.x = Math.PI / 2;
    const sh2 = b.torus(0.03, 0.013, 0xf28b5b, 0.05, 0.08, -0.02, g); sh2.rotation.x = Math.PI / 2;
    b.cone(0.03, 0.02, 3, 0x9ccc65, 0.1, 0.06, 0.06, g);
  },
  'food/mango-sticky-rice': (b, g) => {
    b.sph(0.08, 0xffffff, -0.06, 0.03, 0, g).scale.set(1, 0.6, 1);
    for (let i = 0; i < 3; i++) { const m = b.cap(0.03, 0.1, 0xffc233, 0.07, 0.025 + i * 0.012, -0.04 + i * 0.04, g); m.rotation.set(Math.PI / 2, 0, 0.3); }
  },
  'food/kari': (b, g) => {
    b.cyl(0.18, 0.13, 0.12, 0xffffff, 0, 0.06, 0, g);
    b.cyl(0.16, 0.16, 0.02, 0xe8a030, 0, 0.11, 0, g);
    b.sph(0.03, 0xb0602a, -0.05, 0.125, 0.02, g); b.sph(0.03, 0xb0602a, 0.05, 0.125, -0.02, g); b.sph(0.012, 0x3f8f3a, 0, 0.13, 0.06, g);
  },
  'food/naan': (b, g) => {
    const n = b.sph(0.15, 0xf3ddb0, 0, 0.01, 0, g); n.scale.set(1.2, 0.14, 0.85);
    for (const [x, z] of [[0.05, 0.03], [-0.07, -0.02], [0.02, -0.06]] as [number, number][]) b.sph(0.018, 0xb0702e, x, 0.028, z, g).scale.set(1, 0.3, 1);
  },
  'food/nasi-goreng': (b, g) => {
    b.sph(0.15, 0xc9894a, 0, 0.03, 0, g).scale.set(1, 0.42, 1);
    const e = b.cyl(0.07, 0.07, 0.012, 0xffffff, 0, 0.09, 0, g); e.scale.set(1, 1, 0.8);
    b.sph(0.025, 0xffc233, 0, 0.1, 0, g).scale.set(1, 0.5, 1);
    for (const x of [0.12, 0.15]) { const k = b.rbox(0.07, 0.01, 0.04, 0xf4e3b8, x, 0.04, -0.06, 0.004, g); k.rotation.z = 0.4; }
  },
  'food/sate-ayam': (b, g) => {
    for (const z of [-0.06, 0, 0.06]) { const st = b.cyl(0.005, 0.005, 0.32, 0xb08a50, 0, 0.03, z, g, {}, 6); st.rotation.z = Math.PI / 2; for (let i = 0; i < 3; i++) b.sph(0.03, i % 2 ? 0xb0702e : 0xc9894a, -0.06 + i * 0.05, 0.03, z, g); }
    b.sph(0.06, 0x8b4a2b, 0.12, 0.015, 0.0, g).scale.set(1, 0.3, 1.4);
  },
  'food/es-teh-manis': (b, g) => {
    b.cyl(0.07, 0.06, 0.24, 0xe6f6ff, 0, 0.12, 0, g, { o: 0.7 });
    b.cyl(0.062, 0.055, 0.17, 0xc9894a, 0, 0.09, 0, g);
    b.rbox(0.04, 0.04, 0.04, 0xffffff, 0.02, 0.17, 0.01, 0.01, g);
    const st = b.cyl(0.008, 0.008, 0.3, 0xe9405a, 0.03, 0.2, 0, g, {}, 8); st.rotation.z = -0.25;
  },
  /** catatan pesanan (dibawa Pelayan) */
  note: (b, g) => {
    b.rbox(0.22, 0.02, 0.28, 0xffffff, 0, 0.01, 0, 0.01, g);
    for (let i = 0; i < 3; i++) b.rbox(0.14, 0.022, 0.025, 0x5a5370, -0.01, 0.012, -0.08 + i * 0.07, 0.008, g);
  },
  tray: (b, g) => { b.cyl(0.3, 0.3, 0.04, 0xc7ccd6, 0, 0.02, 0, g, { r: 0.35 }); },
  unknown: (b, g) => {
    b.dome(0.18, Math.PI / 2, 0xc7ccd6, 0, 0.0, 0, g);
    b.sph(0.03, 0xc7ccd6, 0, 0.19, 0, g);
  },
};

const cache = new Map<string, THREE.BufferGeometry>();

export function hasProceduralModel(id: string) { return id in MAKERS; }

/** Geometri gabungan untuk model `id` (pakai cadangan 'unknown' bila tak ada). */
export function modelGeometry(b: Builder, id: string): THREE.BufferGeometry {
  const key = `${id}@${b.segScale}`;
  let g = cache.get(key);
  if (g) return g;
  const grp = new THREE.Group();
  (MAKERS[id] ?? MAKERS.unknown)(b, grp);
  const parts: THREE.Mesh[] = [];
  grp.traverse((o) => { if ((o as THREE.Mesh).isMesh) parts.push(o as THREE.Mesh); });
  g = mergeParts(parts, grp)!;
  cache.set(key, g);
  return g;
}

/** Buat mesh model (1 draw call). */
export function modelMesh(b: Builder, id: string): THREE.Mesh {
  const m = new THREE.Mesh(modelGeometry(b, id), b.lib.get(0xffffff, { vertexColors: true, r: 0.6 }));
  m.castShadow = false; m.receiveShadow = true;
  return m;
}
