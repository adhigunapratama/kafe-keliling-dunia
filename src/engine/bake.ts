import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MaterialLib } from './materials';
import type { BakeInfo } from './build';

const tmpColor = new THREE.Color();

/** Pastikan geometri berindeks (supaya bisa digabung dan hemat memori). */
function ensureIndexed(g: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!g.index) {
    const n = g.attributes.position.count;
    const idx = new (n > 65535 ? Uint32Array : Uint16Array)(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  return g;
}

/**
 * Gabungkan semua mesh statis di bawah `root` menjadi sedikit mesh (satu per jenis material),
 * dengan warna disimpan sebagai vertex color. Mesh bertekstur dibiarkan apa adanya.
 * Hasilnya: puluhan–ratusan benda statis menjadi ±5–10 draw call.
 */
export function bakeStatic(root: THREE.Object3D, lib: MaterialLib): { before: number; after: number } {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<string, { geos: THREE.BufferGeometry[]; opts: BakeInfo['opts']; cast: boolean }>();
  const remove: THREE.Mesh[] = [];
  let before = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    before++;
    const info = m.userData.bake as BakeInfo | undefined;
    if (!info || info.opts.map || m.userData.noBake) return;
    const g = ensureIndexed(m.geometry.clone());
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    tmpColor.set(info.color);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = tmpColor.r; col[i * 3 + 1] = tmpColor.g; col[i * 3 + 2] = tmpColor.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const key = MaterialLib.bakeKey(info.opts) + (m.castShadow ? '|c' : '|n');
    let grp = groups.get(key);
    if (!grp) { grp = { geos: [], opts: info.opts, cast: m.castShadow }; groups.set(key, grp); }
    grp.geos.push(g);
    remove.push(m);
  });
  for (const m of remove) m.parent?.remove(m);
  // buang grup kosong
  const prune = (o: THREE.Object3D) => { for (const c of [...o.children]) { prune(c); if (!(c as THREE.Mesh).isMesh && c.children.length === 0 && c.type === 'Group') o.remove(c); } };
  prune(root);
  let after = 0;
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) after++; });
  for (const grp of groups.values()) {
    const merged = mergeGeometries(grp.geos, false);
    grp.geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, lib.get(0xffffff, { ...grp.opts, vertexColors: true }));
    mesh.castShadow = grp.cast; mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    root.add(mesh);
    after++;
  }
  return { before, after };
}

/** Gabungkan bagian-bagian satu tokoh/benda dinamis menjadi satu geometri (vertex color). */
export function mergeParts(parts: THREE.Mesh[], relativeTo: THREE.Object3D): THREE.BufferGeometry | null {
  relativeTo.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(relativeTo.matrixWorld).invert();
  const geos: THREE.BufferGeometry[] = [];
  for (const m of parts) {
    m.updateMatrixWorld(true);
    const g = ensureIndexed(m.geometry.clone());
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const info = m.userData.bake as BakeInfo;
    tmpColor.set(info.color);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = tmpColor.r; col[i * 3 + 1] = tmpColor.g; col[i * 3 + 2] = tmpColor.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(g);
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged;
}
