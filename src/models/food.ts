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
