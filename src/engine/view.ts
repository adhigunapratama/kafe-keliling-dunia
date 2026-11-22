import * as THREE from 'three';
import { Builder } from './build';
import { MaterialLib } from './materials';
import { presetConfig, type Preset, type PresetConfig } from './quality';
import { BlobShadows } from './blob';

export interface Insets { left: number; right: number; top: number; bottom: number }

/** Arah kamera semi-atas seperti referensi: posisi = target + (14, 13, 14). */
export const CAM_OFFSET = new THREE.Vector3(14, 13, 14);

/**
 * Dasar untuk semua adegan 3D: renderer sesuai preset, kamera ortografis yang otomatis
 * menyesuaikan ukuran layar, cahaya bergaya referensi, dan bayangan statis.
 */
export class View3D {
  readonly cfg: PresetConfig;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly lib: MaterialLib;
  readonly b: Builder;
  readonly blobs: BlobShadows;
  readonly sun: THREE.DirectionalLight;
  /** Lapisan DOM di atas canvas untuk label/gelembung. */
  readonly overlay: HTMLDivElement;
  readonly camTarget = new THREE.Vector3(0, 0.6, 0);
  /** Titik-titik yang harus terlihat (untuk menyesuaikan kamera). */
  fitPoints: THREE.Vector3[] = [];
  insets: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
  /** Putaran kamera mengelilingi target (radian). Bayangan statis tetap valid. */
  camYaw = 0;
  width = 1;
  height = 1;
  private ro: ResizeObserver;
  private disposed = false;
  // resolusi adaptif: turun bila fps rendah, naik lagi bila lancar
  private dprMax = 1;
  dpr = 1;
  private fpsEma = 60;
  private lowT = 0;
  private highT = 0;
  private lastRender = 0;
  adaptive = true;

  constructor(readonly container: HTMLElement, preset: Preset) {
    this.cfg = presetConfig(preset);
    this.lib = new MaterialLib(this.cfg);
    this.b = new Builder(this.lib, this.cfg.segScale);
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: this.cfg.antialias, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(this.cfg.pixelRatio);
    this.dpr = this.dprMax = this.cfg.pixelRatio;
    r.shadowMap.enabled = this.cfg.shadows;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.className = 'view-canvas';
    container.appendChild(r.domElement);
    this.overlay = document.createElement('div');
    this.overlay.className = 'view-overlay';
    container.appendChild(this.overlay);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

    // cahaya (dari referensi)
    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xb5a28c, this.cfg.lambert ? 1.9 : 1.5));
    const sun = (this.sun = new THREE.DirectionalLight(0xfff1dc, this.cfg.lambert ? 2.0 : 2.4));
    sun.position.set(5, 11, 7);
    sun.castShadow = this.cfg.shadows;
    sun.shadow.mapSize.set(this.cfg.shadowMapSize, this.cfg.shadowMapSize);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 40 });
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdfeaff, 0.5);
    fill.position.set(-6, 5, 8);
    this.scene.add(fill);

    this.blobs = new BlobShadows(this.scene);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
  }

  /** Atur area bayangan matahari (koordinat dunia). */
  setShadowArea(half: number, center = new THREE.Vector3()) {
    const c = this.sun.shadow.camera;
    Object.assign(c, { left: -half, right: half, top: half, bottom: -half });
    c.updateProjectionMatrix();
    this.sun.target.position.copy(center);
    this.sun.position.copy(center).add(new THREE.Vector3(5, 11, 7));
    this.scene.add(this.sun.target);
  }

  /** Hitung ulang bayangan statis (dipanggil sekali setelah adegan dibangun / saat dekorasi berubah). */
  refreshShadows() { this.renderer.shadowMap.needsUpdate = true; }

  resize() {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth), h = Math.max(1, this.container.clientHeight);
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.fit();
  }

  /** Sesuaikan kamera ortografis agar fitPoints terlihat penuh di area di luar HUD (insets). */
  fit() {
    const cam = this.camera;
    cam.position.copy(this.camTarget).add(CAM_OFFSET.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camYaw));
    cam.lookAt(this.camTarget);
    cam.updateMatrixWorld(true);
    const pts = this.fitPoints.length ? this.fitPoints : [new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 3, 5)];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const v = new THREE.Vector3();
    for (const p of pts) {
      v.copy(p).applyMatrix4(cam.matrixWorldInverse);
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    }
    const W = this.width, H = this.height, ins = this.insets;
    const availW = Math.max(60, W - ins.left - ins.right), availH = Math.max(60, H - ins.top - ins.bottom);
    const cw = maxX - minX, ch = maxY - minY;
    const s = Math.max(cw / availW, ch / availH);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    cam.left = cx - s * (ins.left + availW / 2);
    cam.right = cam.left + W * s;
    cam.top = cy + s * (ins.top + availH / 2);
    cam.bottom = cam.top - H * s;
    cam.near = -50; cam.far = 100;
    cam.updateProjectionMatrix();
  }

  private pv = new THREE.Vector3();
  /** Proyeksikan titik dunia ke piksel di dalam container. */
  project(x: number, y: number, z: number): [number, number] {
    const v = this.pv.set(x, y, z).project(this.camera);
    return [((v.x + 1) / 2) * this.width, ((1 - v.y) / 2) * this.height];
  }

  render() { if (!this.disposed) { this.adapt(); this.renderer.render(this.scene, this.camera); } }

  /** Atur pixel ratio berdasar fps rata-rata (dipanggil tiap render). */
  protected adapt() {
    const now = performance.now();
    const dt = this.lastRender ? (now - this.lastRender) / 1000 : 0;
    this.lastRender = now;
    if (!this.adaptive || dt <= 0 || dt > 0.5) return;
    this.fpsEma += (1 / dt - this.fpsEma) * 0.05;
    if (this.fpsEma < 40) { this.lowT += dt; this.highT = 0; }
    else if (this.fpsEma > 56) { this.highT += dt; this.lowT = 0; }
    else { this.lowT = 0; this.highT = 0; }
    let next = this.dpr;
    if (this.lowT > 2.5 && this.dpr > 0.75) next = Math.max(0.75, this.dpr - 0.25);
    else if (this.highT > 8 && this.dpr < this.dprMax) next = Math.min(this.dprMax, this.dpr + 0.25);
    if (next !== this.dpr) {
      this.dpr = next; this.lowT = 0; this.highT = 0;
      this.renderer.setPixelRatio(next);
      this.renderer.setSize(this.width, this.height, false);
    }
  }

  info() { const i = this.renderer.info.render; return { calls: i.calls, triangles: i.triangles }; }

  dispose() {
    this.disposed = true;
    this.ro.disconnect();
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.userData.ownGeo) m.geometry.dispose(); });
    this.b.dispose();
    this.lib.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.overlay.remove();
  }
}
