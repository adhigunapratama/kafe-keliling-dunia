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
