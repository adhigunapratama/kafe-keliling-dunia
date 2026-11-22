import * as THREE from 'three';
import { View3D } from '../engine/view';
import type { Preset } from '../engine/quality';
import { bakeStatic } from '../engine/bake';
import { canvasTex } from '../engine/build';

/**
 * Ilustrasi kafe kecil di Layar Judul (dari referensi "cafe"): atap merah piramida,
 * kanopi bergaris, globe di puncak, pohon bulat, payung meja.
 * Yang berputar adalah kamera, jadi bayangan statis cukup dihitung sekali.
 */
export class TitleCafeView extends View3D {
  private globe: THREE.Group;
  constructor(container: HTMLElement, preset: Preset) {
    super(container, preset);
    const b = this.b;
    const root = new THREE.Group(); this.scene.add(root);
    b.rbox(8, 0.4, 8, 0x7ccb6b, 0, -0.2, 0, 0.18, root);
    b.rbox(1.0, 0.05, 3.2, 0xebddbf, 0.4, 0.02, 2.4, 0.03, root);
    b.rbox(3.6, 2.4, 3.2, 0xf3e3c7, -0.2, 1.2, -0.4, 0.12, root);
    b.rbox(3.8, 0.25, 3.4, 0xd9a066, -0.2, 0.12, -0.4, 0.08, root);
    const roof = b.cone(2.6, 1.4, 4, 0xe9573f, -0.2, 3.15, -0.4, root); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.9);
    const stripes = canvasTex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e9573f'; c.fillRect((i * w) / 8, 0, w / 8, h); } });
    const aw = b.rbox(3.4, 0.08, 0.8, 0xffffff, -0.2, 2.05, 1.5, 0.03, root, { map: stripes }); aw.rotation.x = 0.35;
    const aw2 = b.rbox(0.8, 0.08, 2.8, 0xffffff, 1.95, 2.05, -0.4, 0.03, root, { map: stripes }); aw2.rotation.z = -0.35;
    b.rbox(1.3, 0.9, 0.06, 0x8fd3f4, -1.0, 1.35, 1.22, 0.04, root, { e: 0xbfe9ff, ei: 0.3 });
    b.rbox(0.9, 1.5, 0.08, 0x8b5a3c, 0.7, 0.95, 1.22, 0.05, root);
    b.rbox(0.06, 0.9, 1.3, 0x8fd3f4, 1.62, 1.35, -0.4, 0.04, root, { e: 0xbfe9ff, ei: 0.3 });
    b.cyl(0.04, 0.04, 0.6, 0x6b5a4a, -0.2, 4.1, -0.4, root);
    // globe berputar pelan (dinamis)
    this.globe = new THREE.Group(); this.globe.position.set(-0.2, 4.5, -0.4); this.scene.add(this.globe);
    const sea = b.sph(0.38, 0x2f7dc1, 0, 0, 0, this.globe); sea.castShadow = false;
    b.sph(0.16, 0x7ccb6b, 0.12, 0.1, 0.3, this.globe).scale.set(1.2, 0.8, 0.6);
    b.sph(0.12, 0x7ccb6b, -0.2, -0.15, 0.25, this.globe).scale.set(1, 0.8, 0.6);
    b.sph(0.13, 0x7ccb6b, -0.1, 0.12, -0.32, this.globe).scale.set(1.1, 0.8, 0.6);
    for (const [x, z, r] of [[-3.0, 2.6, 0.55], [2.9, -2.6, 0.6], [-3.1, -2.8, 0.5]]) { b.cyl(0.1, 0.12, 0.6, 0x8b5a3c, x, 0.3, z, root); b.sph(r, 0x5baf4e, x, 0.95, z, root); b.sph(r * 0.7, 0x6fc25e, x + 0.15, 1.35, z + 0.1, root); }
    b.cyl(0.45, 0.45, 0.06, 0xffffff, 2.4, 0.7, 2.2, root); b.cyl(0.05, 0.05, 0.7, 0x8b5a3c, 2.4, 0.35, 2.2, root, {}, 12);
    b.cyl(0.04, 0.04, 1.2, 0x8b5a3c, 2.4, 1.2, 2.2, root, {}, 12);
    b.cone(0.95, 0.4, 8, 0xe9573f, 2.4, 1.85, 2.2, root, {}, true);
    for (const [x, z] of [[1.8, 2.2], [3.0, 2.2]]) { b.rbox(0.4, 0.06, 0.4, 0x2f7dc1, x, 0.42, z, 0.03, root); b.cyl(0.03, 0.03, 0.4, 0x8b5a3c, x, 0.2, z, root, {}, 10); }
    ([[-1.6, 1.6], [-1.2, 1.7], [-0.6, 1.6]] as const).forEach(([x, z], i) => b.sph(0.16, [0xff7aa8, 0xffc233, 0xff7aa8][i], x, 0.15, z, root));
    if (!this.cfg.shadows) { this.blobs.addStatic(-0.2, -0.4, 2.3, 2.0); this.blobs.addStatic(2.4, 2.2, 0.8); }
    bakeStatic(root, this.lib);
    this.camTarget.set(0, 1.4, 0);
    const r = 5.4;
    this.fitPoints = [];
    for (let a = 0; a < 16; a++) { const ang = (a / 16) * Math.PI * 2; this.fitPoints.push(new THREE.Vector3(Math.cos(ang) * r, -0.4, Math.sin(ang) * r), new THREE.Vector3(Math.cos(ang) * 1.5, 5.0, Math.sin(ang) * 1.5)); }
    this.setShadowArea(6.5);
    this.fit();
    this.refreshShadows();
  }
  update(dt: number) {
    this.camYaw += dt * 0.12;
    this.globe.rotation.y += dt * 0.8;
    this.fit();
  }
}
