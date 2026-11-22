import * as THREE from 'three';
import { canvasTex, type Builder } from '../engine/build';
import type { DecorItem, FloorPattern, RoomTheme } from '../data/countries';
import type { BlobShadows } from '../engine/blob';

export function floorTexture(f: FloorPattern): THREE.Texture {
  return canvasTex(512, 512, (c, w, h) => {
    if (f.kind === 'checker') {
      const n = f.n ?? 8, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = (i + j) % 2 ? f.a : f.b; c.fillRect(i * s, j * s, s, s); }
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3;
      for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); }
    } else if (f.kind === 'planks') {
      const n = 8, s = w / n;
      for (let i = 0; i < n; i++) { c.fillStyle = f.colors[i % f.colors.length]; c.fillRect(i * s, 0, s, h); }
      c.strokeStyle = 'rgba(120,80,40,0.25)'; c.lineWidth = 3;
      for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke(); }
      for (let i = 0; i < n; i++) { const y = (i * 97) % h; c.beginPath(); c.moveTo(i * s, y); c.lineTo((i + 1) * s, y); c.stroke(); }
    } else {
      const n = f.n ?? 6, s = w / n;
      c.fillStyle = f.base; c.fillRect(0, 0, w, h);
      c.strokeStyle = f.line; c.lineWidth = 4;
      for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); }
    }
  });
}

/**
 * Ruangan "diorama" 10x10: lantai + dua dinding belakang (kiri x=-5, kanan z=-5).
 * `opening` = lubang jendela saji di dinding kanan [x0, x1, y0, y1].
 */
export function buildRoom(b: Builder, root: THREE.Object3D, theme: RoomTheme, opening?: [number, number, number, number]) {
  const floor = b.rbox(10, 0.3, 10, 0xffffff, 0, -0.15, 0, 0.06, root, { map: floorTexture(theme.floor), r: 0.85 });
  floor.castShadow = false;
  const { wallL, wallR, trim } = theme;
  b.rbox(0.25, 3, 10, wallL, -5.12, 1.5, 0, 0.05, root);
  b.rbox(0.3, 0.9, 10, trim, -5.08, 0.45, 0, 0.05, root);
  if (opening) {
    const [x0, x1, y0, y1] = opening;
    b.rbox(x0 + 5.25, 3, 0.25, wallR, (-5.25 + x0) / 2, 1.5, -5.12, 0.05, root);
    b.rbox(5 - x1, 3, 0.25, wallR, (x1 + 5) / 2, 1.5, -5.12, 0.05, root);
    b.rbox(x1 - x0, y0, 0.25, wallR, (x0 + x1) / 2, y0 / 2, -5.12, 0.05, root);
    b.rbox(x1 - x0, 3 - y1, 0.25, wallR, (x0 + x1) / 2, (3 + y1) / 2, -5.12, 0.05, root);
    b.rbox(x1 - x0, y1 - y0, 0.05, 0xffe6a8, (x0 + x1) / 2, (y0 + y1) / 2, -5.3, 0.01, root, { e: 0xffd27a, ei: 0.35 });
    b.rbox(x1 - x0 + 0.2, 0.12, 0.45, 0xd9a066, (x0 + x1) / 2, y0, -4.95, 0.04, root);
  } else {
    b.rbox(10.25, 3, 0.25, wallR, -0.12, 1.5, -5.12, 0.05, root);
  }
  b.rbox(10.3, 0.9, 0.3, trim, -0.12, 0.45, -5.08, 0.05, root);
}

export function plant(b: Builder, root: THREE.Object3D, x: number, z: number, pot: number, leaf: number, s = 1, blobs?: BlobShadows) {
  b.cyl(0.27 * s, 0.21 * s, 0.44 * s, pot, x, 0.22 * s, z, root);
  b.sph(0.42 * s, leaf, x, 0.78 * s, z, root);
  b.sph(0.26 * s, leaf, x + 0.18 * s, 1.05 * s, z + 0.1 * s, root);
  blobs?.addStatic(x, z, 0.5 * s);
}

/** Hiasan khas negara. */
export function buildDecor(b: Builder, root: THREE.Object3D, items: DecorItem[], blobs?: BlobShadows) {
  for (const d of items) {
    if (d.kind === 'plant') plant(b, root, d.x, d.z, d.pot, d.leaf, d.size ?? 1, blobs);
    else if (d.kind === 'bunting') {
      const n = 11;
      for (let i = 0; i < n; i++) {
        const k = -4.4 + (8.8 * i) / (n - 1);
        const sag = 0.18 * Math.sin((Math.PI * i) / (n - 1));
        const tri = b.tri(0.42, 0.4, d.colors[i % d.colors.length], root);
        if (d.wall === 'left') { tri.position.set(-4.97, 2.85 - sag, k); tri.rotation.y = Math.PI / 2; }
        else { tri.position.set(k, 2.85 - sag, -4.97); }
      }
      // tali
      if (d.wall === 'left') b.rbox(0.02, 0.02, 9, 0x5a5370, -4.96, 2.82, 0, 0.009, root);
      else b.rbox(9, 0.02, 0.02, 0x5a5370, 0, 2.82, -4.96, 0.009, root);
    } else if (d.kind === 'poster') {
      const g = new THREE.Group(); root.add(g);
      if (d.wall === 'left') { g.position.set(-4.97, 1.9, d.at); g.rotation.y = Math.PI / 2; }
      else g.position.set(d.at, 1.9, -4.97);
      b.rbox(1.1, 0.85, 0.06, 0xffffff, 0, 0, 0, 0.03, g);
      b.rbox(0.95, 0.7, 0.07, d.bg, 0, 0, 0.005, 0.02, g);
      if (d.shape === 'star') { const s = b.cyl(0.22, 0.22, 0.03, d.fg, 0, 0, 0.05, g, {}, 5); s.rotation.x = Math.PI / 2; }
      else if (d.shape === 'sun') {
        const s = b.cyl(0.16, 0.16, 0.03, d.fg, 0, 0, 0.05, g); s.rotation.x = Math.PI / 2;
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const r = b.rbox(0.05, 0.12, 0.02, d.fg, Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.05, 0.01, g); r.rotation.z = a - Math.PI / 2; }
      } else if (d.shape === 'tower') {
        const t = b.cone(0.2, 0.55, 4, d.fg, 0, 0.02, 0.05, g); t.rotation.x = Math.PI / 2; t.rotation.z = Math.PI; t.rotation.set(0, 0, 0); t.scale.set(1, 1, 0.12);
        b.rbox(0.36, 0.04, 0.03, d.fg, 0, -0.12, 0.06, 0.01, g);
      } else if (d.shape === 'wave') {
        for (let i = 0; i < 3; i++) { const w = b.torus(0.12, 0.025, d.fg, -0.24 + i * 0.24, -0.05, 0.05, g); w.scale.set(1, 0.7, 0.3); }
      }
      else if (d.shape === 'circle') { const s = b.cyl(0.22, 0.22, 0.03, d.fg, 0, 0, 0.05, g); s.rotation.x = Math.PI / 2; }
      else for (let i = 0; i < 3; i++) b.rbox(0.8, 0.08, 0.03, d.fg, 0, -0.2 + i * 0.2, 0.05, 0.01, g);
    } else if (d.kind === 'cactus') {
      const k = d.size ?? 1;
      b.cyl(0.24 * k, 0.19 * k, 0.36 * k, 0xd98c5f, d.x, 0.18 * k, d.z, root);
      b.cap(0.15 * k, 0.55 * k, 0x3f8f3a, d.x, 0.75 * k, d.z, root);
      const a1 = b.cap(0.08 * k, 0.2 * k, 0x3f8f3a, d.x + 0.2 * k, 0.8 * k, d.z, root); a1.rotation.z = -0.3;
      const a2 = b.cap(0.07 * k, 0.16 * k, 0x3f8f3a, d.x - 0.19 * k, 0.65 * k, d.z + 0.02, root); a2.rotation.z = 0.3;
      b.sph(0.05 * k, 0xff7aa8, d.x, 1.16 * k, d.z, root);
      blobs?.addStatic(d.x, d.z, 0.4 * k);
    } else if (d.kind === 'bamboo') {
      b.cyl(0.3, 0.24, 0.3, 0x5a5370, d.x, 0.15, d.z, root);
      for (const [dx, dz, h] of [[0, 0, 2.0], [0.12, 0.08, 1.6], [-0.1, 0.06, 1.8]] as [number, number, number][]) {
        b.cyl(0.045, 0.045, h, 0x7cb342, d.x + dx, 0.3 + h / 2, d.z + dz, root, {}, 10);
        for (let y = 0.6; y < h; y += 0.45) b.cyl(0.052, 0.052, 0.03, 0x5b8f2e, d.x + dx, 0.3 + y, d.z + dz, root, {}, 10);
        b.sph(0.14, 0x6fae3d, d.x + dx + 0.08, 0.3 + h, d.z + dz, root).scale.set(1.4, 0.45, 0.7);
      }
      blobs?.addStatic(d.x, d.z, 0.4);
    } else if (d.kind === 'lantern') {
      const g = new THREE.Group(); root.add(g);
      if (d.wall === 'left') { g.position.set(-4.75, 2.25, d.at); g.rotation.y = Math.PI / 2; } else g.position.set(d.at, 2.25, -4.75);
      b.cyl(0.01, 0.01, 0.5, 0x2b2340, 0, 0.45, 0, g, {}, 6);
      b.cyl(0.12, 0.12, 0.05, 0x2b2340, 0, 0.22, 0, g, {}, 16);
      b.sph(0.22, d.color, 0, 0, 0, g, { e: d.color, ei: 0.25 }).scale.set(1, 1.15, 1);
      b.cyl(0.12, 0.12, 0.05, 0x2b2340, 0, -0.24, 0, g, {}, 16);
    } else if (d.kind === 'flowerbox') {
      const g = new THREE.Group(); root.add(g);
      if (d.wall === 'left') { g.position.set(-4.8, 1.05, d.at); g.rotation.y = Math.PI / 2; } else g.position.set(d.at, 1.05, -4.8);
      b.rbox(1.4, 0.2, 0.28, 0x8b5a3c, 0, 0, 0, 0.04, g);
      for (let i = 0; i < 6; i++) { b.sph(0.1, 0x5baf4e, -0.55 + i * 0.22, 0.14, 0, g); b.sph(0.07, d.colors[i % d.colors.length], -0.55 + i * 0.22, 0.24, 0.03, g); }
    } else if (d.kind === 'lamp') {
      // lampu dinding (tidak menghalangi pandangan dari atas)
      const onLeft = d.x < d.z;
      const g = new THREE.Group(); root.add(g);
      if (onLeft) { g.position.set(-4.95, 2.35, d.z); g.rotation.y = Math.PI / 2; } else g.position.set(d.x, 2.35, -4.95);
      b.rbox(0.22, 0.3, 0.06, 0x8b5a3c, 0, 0, 0, 0.03, g);
      b.sph(0.16, d.color, 0, 0.05, 0.14, g, { e: d.color, ei: 0.8 });
    }
  }
}
