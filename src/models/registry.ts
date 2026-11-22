import * as THREE from 'three';
import type { Builder } from '../engine/build';
import { modelMesh } from './food';

/**
 * SISTEM GANTI MODEL
 * Setiap benda dirujuk lewat ID, mis. 'food/burger'. Bila file
 * `src/assets/models/food/burger.glb` ada, file itu dipakai (dimuat saat dibutuhkan).
 * Bila tidak ada, dipakai model prosedural dari src/models/food.ts.
 * Daftar file diketahui saat build (import.meta.glob), jadi tidak ada request 404.
 */
const GLB_URLS = import.meta.glob('../assets/models/**/*.glb', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;

function glbKey(id: string) { return `../assets/models/${id}.glb`; }
export function hasGlb(id: string) { return glbKey(id) in GLB_URLS; }

const glbCache = new Map<string, Promise<THREE.Object3D | null>>();

async function loadGlb(id: string): Promise<THREE.Object3D | null> {
  const get = GLB_URLS[glbKey(id)];
  if (!get) return null;
  const [{ GLTFLoader }, url] = await Promise.all([import('three/examples/jsm/loaders/GLTFLoader.js'), get()]);
  const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  try {
    const gltf = await loader.loadAsync(url);
    gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    return gltf.scene;
  } catch (e) {
    console.warn('Gagal memuat model', id, e);
    return null;
  }
}

/** Buat objek model: langsung tampil versi prosedural, lalu diganti GLB bila tersedia. */
export function makeModel(b: Builder, id: string): THREE.Group {
  const g = new THREE.Group();
  g.add(modelMesh(b, id));
  if (hasGlb(id)) {
    let p = glbCache.get(id);
    if (!p) { p = loadGlb(id); glbCache.set(id, p); }
    p.then((src) => { if (!src) return; g.clear(); g.add(src.clone(true)); });
  }
  return g;
}
