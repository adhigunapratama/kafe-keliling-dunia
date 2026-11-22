import * as THREE from 'three';

let blobTex: THREE.Texture | null = null;
function tex() {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(43,35,64,0.42)'); gr.addColorStop(0.55, 'rgba(43,35,64,0.22)'); gr.addColorStop(1, 'rgba(43,35,64,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

/**
 * Bayangan blob (lingkaran gradasi lembut) untuk semua benda bergerak, dalam SATU draw call.
 * Di preset Rendah juga dipakai untuk benda statis sebagai pengganti shadow map.
 */
export class BlobShadows {
  readonly mesh: THREE.InstancedMesh;
  private n = 0;
  private m = new THREE.Matrix4();
  private staticCount = 0;
  constructor(parent: THREE.Object3D, readonly max = 96) {
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex(), transparent: true, depthWrite: false, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.count = 0;
    this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }
  /** Tambah blob statis (dipanggil saat membangun adegan). */
  addStatic(x: number, z: number, rx: number, rz = rx, y = 0.012) {
    this.set(this.staticCount++, x, z, rx, rz, y);
    this.n = this.staticCount;
    this.mesh.count = this.n;
  }
  private set(i: number, x: number, z: number, rx: number, rz: number, y: number) {
    if (i >= this.max) return;
    this.m.makeScale(rx * 2, 1, rz * 2).setPosition(x, y, z);
    this.mesh.setMatrixAt(i, this.m);
  }
  /** Mulai frame: hapus blob dinamis. */
  begin() { this.n = this.staticCount; }
  push(x: number, z: number, r: number, y = 0.014) { this.set(this.n++, x, z, r, r, y); }
  end() { this.mesh.count = Math.min(this.n, this.max); this.mesh.instanceMatrix.needsUpdate = true; }
}
