import * as THREE from 'three';
import { View3D } from '../engine/view';
import type { Preset } from '../engine/quality';
import { bakeStatic } from '../engine/bake';
import type { CountryDef } from '../data/countries';
import { FIXED_STATIONS, KITCHEN_SLOTS, STATION_SLOT_PREF, type CookStationId, type KitchenSlot, type StationId } from '../data/stations';
import { buildDecor, buildRoom } from './room';
import { Person, type PersonLook } from '../models/person';
import { modelGeometry } from '../models/food';
import { makeModel } from '../models/registry';
import { MENUS } from '../data/menus';
import { NavGrid, moveAt, moveEnd, type Move, type P2 } from '../game/path';
import type { CafeState } from '../game/types';
import type { DecorEffects } from '../data/decor';

export interface StationPlacement { id: StationId; x: number; z: number; stand: P2; slot?: KitchenSlot }

/** Tentukan slot untuk tiap stasiun masak (berdasar preferensi di data). */
export function placeStations(stations: CookStationId[]): StationPlacement[] {
  const used = new Set<KitchenSlot>();
  const out: StationPlacement[] = [];
  for (const id of stations) {
    const slot = STATION_SLOT_PREF[id].find((s) => !used.has(s));
    if (!slot) throw new Error(`Tidak ada slot dapur untuk ${id}`);
    used.add(slot);
    const s = KITCHEN_SLOTS[slot];
    out.push({ id, x: s.x, z: s.z, stand: s.stand, slot });
  }
  out.push({ id: 'wastafel', x: FIXED_STATIONS.wastafel.x, z: FIXED_STATIONS.wastafel.z, stand: FIXED_STATIONS.wastafel.stand });
  out.push({ id: 'saji', x: FIXED_STATIONS.saji.x, z: FIXED_STATIONS.saji.z, stand: FIXED_STATIONS.saji.stand });
  return out;
}

const STATION_LABEL_Y: Partial<Record<StationId, number>> = { oven: 1.75, kompor: 1.55, talenan: 1.9, saji: 2.45, wastafel: 1.55 };

/**
 * Adegan dapur (layar Koki). Benda statis digabung (bake) sekali; yang bergerak:
 * Koki, tumpukan piring bersih & kotor (InstancedMesh), makanan di jendela saji, cincin stasiun aktif, uap.
 */
export class KitchenView extends View3D {
  readonly stations: StationPlacement[];
  readonly chef: Person;
  private chefMove: Move;
  private chefTime = 0;
  private chefWorkUntil = 0;
  private nav: NavGrid;
  private cleanPlates: THREE.InstancedMesh;
  private dirtyPlates: THREE.InstancedMesh;
  private passGroup = new THREE.Group();
  private passItems = new Map<number, THREE.Group>();
  private rings: THREE.Mesh[] = [];
  private ringPool: THREE.Mesh[] = [];
  private steam: THREE.Mesh[] = [];
  private steamAt: THREE.Vector3 | null = null;
  private bell: THREE.Group;
  private bellT = 10;
  private time = 0;
  readonly drawStats: { before: number; after: number };

  constructor(container: HTMLElement, preset: Preset, country: CountryDef, cookStations: CookStationId[], chefLook: PersonLook, decor?: DecorEffects) {
    super(container, preset);
    const b = this.b, k = country.kitchen;
    const root = new THREE.Group();
    this.scene.add(root);
    this.stations = placeStations(cookStations);
    const usesA4 = this.stations.some((s) => s.slot === 'A4');

    buildRoom(b, root, k, [2.2, 3.8, 1.05, 2.3]);
    // rak di dinding kiri
    b.rbox(0.4, 0.08, 3, 0xd9a066, -4.85, 2.2, -2, 0.03, root);
    ([[-3, 0xc9432a], [-2.4, 0xffc233], [-1.8, 0x3fa7a0], [-1.2, 0xe9573f]] as [number, number][]).forEach(([z, c]) => b.cyl(0.13, 0.13, 0.32, c, -4.85, 2.4, z, root));
    // meja dapur A (dinding kiri)
    const aLen = usesA4 ? 8.6 : 7, aZ = usesA4 ? 0.2 : -0.6;
    b.rbox(1.4, 0.85, aLen, k.counterBody, -4.25, 0.45, aZ, 0.1, root);
    b.rbox(1.5, 0.1, aLen + 0.1, k.counterTop, -4.25, 0.92, aZ, 0.05, root);
    // meja dapur B (dinding belakang)
    b.rbox(6.4, 0.85, 1.4, k.counterBody, 0.9, 0.45, -4.25, 0.1, root);
    b.rbox(6.5, 0.1, 1.5, k.counterTop, 0.9, 0.92, -4.25, 0.05, root);
    // pulau tengah
    const island = this.stations.some((s) => s.slot === 'I1' || s.slot === 'I2');
    b.rbox(2.2, 0.85, 1.6, 0xe0b25a, 0.9, 0.45, 0.9, 0.12, root);
    b.rbox(2.3, 0.1, 1.7, k.counterTop, 0.9, 0.92, 0.9, 0.05, root);
    if (!island) {
      b.cyl(0.3, 0.2, 0.18, 0xffffff, 0.3, 1.06, 0.8, root);
      b.sph(0.11, 0xe9573f, 0.22, 1.17, 0.78, root); b.sph(0.11, 0xe9573f, 0.38, 1.17, 0.84, root);
      b.sph(0.2, 0xf3d28b, 1.4, 1.08, 1.2, root).scale.set(1, 0.6, 1);
    }
    // wastafel
    const W = FIXED_STATIONS.wastafel;
    b.rbox(1.5, 0.12, 1.0, 0xc7ccd6, W.x, 0.95, W.z, 0.06, root, { m: 0.5, r: 0.3 });
    b.rbox(1.3, 0.05, 0.8, 0x9fd8ef, W.x, 1.0, W.z, 0.03, root, { r: 0.2 });
    b.cap(0.04, 0.4, 0xc7ccd6, W.x, 1.25, W.z - 0.5, root, { m: 0.6 });
    b.rbox(0.08, 0.06, 0.3, 0xc7ccd6, W.x, 1.47, W.z - 0.38, 0.02, root, { m: 0.6 });
    // alas jendela saji + bel
    const S = FIXED_STATIONS.saji;
    b.rbox(1.5, 0.03, 0.9, 0xfff6e0, S.x, 0.985, S.z + 0.05, 0.02, root);
    this.bell = new THREE.Group();
    this.bell.position.set(3.95, 0.98, -3.85);
    b.cyl(0.2, 0.2, 0.03, 0xc98f00, 0, 0, 0, this.bell);
    b.dome(0.17, Math.PI / 2, 0xffc233, 0, 0, 0, this.bell, { m: 0.5, r: 0.3 });
    b.sph(0.04, 0xc98f00, 0, 0.19, 0, this.bell);
    this.bell.traverse((o) => { o.userData.noBake = true; });
    this.scene.add(this.bell);

    for (const st of this.stations) this.buildStation(root, st);
    buildDecor(b, root, [...country.decorKitchen, ...(decor?.kitchen ?? [])], this.blobs);
    if (!this.cfg.shadows) {
      // pengganti shadow map di preset Rendah
      this.blobs.addStatic(-4.25, aZ, 0.9, aLen / 2 + 0.2);
      this.blobs.addStatic(0.9, -4.25, 3.4, 0.9);
      this.blobs.addStatic(0.9, 0.9, 1.4, 1.1);
    }
    this.drawStats = bakeStatic(root, this.lib);

    // tumpukan piring (instanced)
    const plateGeo = modelGeometry(b, 'plate');
    const dirtyGeo = modelGeometry(b, 'plate-dirty');
    const vmat = this.lib.get(0xffffff, { vertexColors: true, r: 0.4 });
    this.cleanPlates = new THREE.InstancedMesh(plateGeo, vmat, 16);
    this.dirtyPlates = new THREE.InstancedMesh(dirtyGeo, vmat, 16);
    this.cleanPlates.count = this.dirtyPlates.count = 0;
    this.scene.add(this.cleanPlates, this.dirtyPlates, this.passGroup);

    // cincin stasiun aktif & uap
    for (let i = 0; i < 4; i++) {
      const r = b.ring(0.62, 0.035, 0xffc233, 0, 0, 0, null, { e: 0xffc233, ei: 0.9 });
      r.visible = false; this.scene.add(r); this.ringPool.push(r);
    }
    for (let i = 0; i < 4; i++) {
      const s = b.sph(0.1, 0xffffff, 0, 0, 0, null, { o: 0.7 });
      s.castShadow = false; s.visible = false; this.scene.add(s); this.steam.push(s);
    }

    // Koki
    this.chef = new Person(b, chefLook);
    const start = this.stations[0].stand;
    this.chef.group.position.set(start[0], 0, start[1]);
    this.chef.group.rotation.y = -Math.PI / 2;
    this.scene.add(this.chef.group);
    this.chefMove = { pts: [start], t0: 0, speed: 3 };
    this.nav = new NavGrid(-4.75, -4.75, 4.75, 4.75, 0.25);
    this.nav.blockRect(-5, -5, -3.45, usesA4 ? 4.6 : 3.0);
    this.nav.blockRect(-2.4, -5, 4.2, -3.45);
    this.nav.blockRect(-0.3, 0.0, 2.1, 1.8);

    // kamera
    this.fitPoints = [new THREE.Vector3(-5.2, 0, -5.2), new THREE.Vector3(5, 0, 5), new THREE.Vector3(-5.2, 3, -5.2), new THREE.Vector3(5.1, 0, -5.2), new THREE.Vector3(-5.2, 0, 5.1), new THREE.Vector3(-5.2, 3, 5), new THREE.Vector3(5, 3, -5.2)];
    this.setShadowArea(8);
    this.fit();
    this.refreshShadows();
  }

  private buildStation(root: THREE.Object3D, st: StationPlacement) {
    const b = this.b, { x, z } = st;
    switch (st.id) {
      case 'talenan':
        b.rbox(0.8, 0.06, 1.1, 0xd9a066, x + 0.05, 1.0, z, 0.03, root);
        b.sph(0.14, 0xe9573f, x + 0.15, 1.12, z - 0.2, root); b.sph(0.12, 0xe9573f, x - 0.05, 1.11, z + 0.15, root);
        b.sph(0.1, 0x7ccb6b, x + 0.2, 1.09, z + 0.35, root).scale.set(1, 0.7, 1);
        b.rbox(0.06, 0.03, 0.5, 0xc7ccd6, x - 0.25, 1.05, z, 0.01, root, { m: 0.6, r: 0.3 });
        break;
      case 'kompor':
        b.rbox(1.2, 0.08, 1.4, 0x3a3a48, x, 1.0, z, 0.04, root);
        b.cyl(0.36, 0.33, 0.42, 0x9aa3b5, x, 1.25, z, root, { m: 0.6, r: 0.35 });
        b.cyl(0.32, 0.32, 0.03, 0xf4d58d, x, 1.45, z, root);
        b.cap(0.03, 0.3, 0x2b2340, x + 0.4, 1.42, z, root).rotation.z = Math.PI / 2;
        break;
      case 'oven':
        b.rbox(1.4, 1.5, 1.4, 0x2e2e3a, x, 0.75, z, 0.1, root);
        b.rbox(0.06, 0.6, 0.9, 0xff9f43, x + 0.73, 0.85, z, 0.03, root, { e: 0xff8a1f, ei: 0.9 });
        b.rbox(0.08, 0.06, 0.7, 0xc7ccd6, x + 0.75, 1.3, z, 0.02, root, { m: 0.6 });
        break;
      case 'panggangan':
        b.rbox(1.0, 0.16, 0.9, 0x3a3a48, x, 1.04, z, 0.05, root);
        for (let i = 0; i < 5; i++) b.rbox(0.85, 0.03, 0.04, 0x8a8f9c, x, 1.13, z - 0.32 + i * 0.16, 0.012, root, { m: 0.5, r: 0.4 });
        b.cyl(0.16, 0.16, 0.06, 0x7a4326, x - 0.18, 1.17, z, root);
        b.cyl(0.16, 0.16, 0.06, 0x8f5233, x + 0.2, 1.17, z + 0.05, root);
        break;
      case 'kukusan':
        for (let i = 0; i < 3; i++) b.cyl(0.36, 0.36, 0.16, i === 2 ? 0xd9b77a : 0xe8c58c, x, 1.06 + i * 0.17, z, root);
        b.dome(0.37, Math.PI / 2, 0xd9b77a, x, 1.48, z, root).scale.set(1, 0.4, 1);
        break;
      case 'wajan':
        b.rbox(1.2, 0.08, 1.2, 0x3a3a48, x, 1.0, z, 0.04, root);
        { const w = b.dome(0.4, Math.PI / 2, 0x4a4a58, x, 1.3, z, root, { m: 0.6, r: 0.4 }); w.rotation.x = Math.PI; }
        b.cap(0.03, 0.4, 0x2b2340, x + 0.55, 1.28, z, root).rotation.z = Math.PI / 2;
        break;
      default:
        break;
    }
  }

  /** Titik dunia untuk label & ketukan stasiun. */
  stationAnchor(id: StationId): THREE.Vector3 {
    const s = this.stations.find((s) => s.id === id)!;
    return new THREE.Vector3(s.x + (id === 'saji' ? 0 : 0.2), STATION_LABEL_Y[id] ?? 1.45, s.z + (id === 'saji' ? -0.3 : 0));
  }

  /** Stasiun terdekat dari titik layar (target sentuh besar & ramah anak). */
  pick(px: number, py: number, radius = 90): StationId | null {
    let best: StationId | null = null, bd = radius;
    for (const s of this.stations) {
      const a = this.stationAnchor(s.id);
      const [x, y] = this.project(a.x, a.y - 0.45, a.z);
      const d = Math.hypot(px - x, py - y);
      if (d < bd) { bd = d; best = s.id; }
    }
    if (!best) {
      // ketuk bel juga berarti jendela saji
      const [bx, by] = this.project(3.95, 1.1, -3.85);
      if (Math.hypot(px - bx, py - by) < radius) best = 'saji';
    }
    return best;
  }

  /** Koki berjalan ke stasiun. */
  chefGoTo(id: StationId, work = 2.5) {
    const s = this.stations.find((s) => s.id === id);
    if (!s) return;
    const cur = moveAt(this.chefMove, this.chefTime);
    this.chefMove = { pts: this.nav.findPath([cur.x, cur.z], s.stand), t0: this.chefTime, speed: 3.2 };
    this.chefWorkUntil = moveEnd(this.chefMove) + work;
    this.chefFace = Math.atan2(s.x - s.stand[0], s.z - s.stand[1]);
  }
  private chefFace = -Math.PI / 2;

  /** Cincin kuning pada stasiun aktif. */
  setActiveStations(ids: StationId[]) {
    this.rings = [];
    this.ringPool.forEach((r, i) => {
      const id = ids[i];
      if (!id) { r.visible = false; return; }
      const s = this.stations.find((s) => s.id === id);
      if (!s) { r.visible = false; return; }
      r.visible = true;
      const y = id === 'oven' ? 1.55 : id === 'saji' ? 1.0 : 1.06;
      r.position.set(s.x + (id === 'oven' ? 0.1 : 0), y, s.z);
      this.rings.push(r);
    });
  }

  /** Uap di atas stasiun yang sedang dipakai (null = tidak ada). */
  setSteam(id: StationId | null) {
    if (!id || id === 'talenan' || id === 'saji') { this.steamAt = null; return; }
    const s = this.stations.find((s) => s.id === id);
    this.steamAt = s ? new THREE.Vector3(s.x, id === 'oven' ? 1.6 : 1.5, s.z) : null;
  }

  ringBell() { this.bellT = 0; }

  /** Sinkronkan dengan status kafe + animasi. */
  update(dt: number, state: CafeState) {
    this.time += dt;
    this.chefTime += dt;
    const t = this.time;
    // Koki
    const m = moveAt(this.chefMove, this.chefTime);
    this.chef.group.position.set(m.x, 0, m.z);
    if (m.moving) this.chef.faceTowards(m.dir, dt); else this.chef.faceTowards(this.chefFace, dt);
    this.chef.animate(dt, { moving: m.moving, seated: false, react: null, carryUp: false, working: !m.moving && this.chefTime < this.chefWorkUntil });

    // piring bersih
    const P = FIXED_STATIONS.piring, mtx = new THREE.Matrix4();
    const nClean = Math.min(16, state.clean);
    for (let i = 0; i < nClean; i++) { mtx.makeTranslation(P.x + (i % 2 ? 0.02 : 0), 0.98 + i * 0.045, P.z + (i % 3) * 0.01); this.cleanPlates.setMatrixAt(i, mtx); }
    this.cleanPlates.count = nClean; this.cleanPlates.instanceMatrix.needsUpdate = true;
    const W = FIXED_STATIONS.wastafel, nDirty = Math.min(16, state.sink);
    for (let i = 0; i < nDirty; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      mtx.makeRotationY(i * 0.7).setPosition(W.x - 0.28 + col * 0.5, 1.03 + row * 0.045, W.z + (col ? -0.05 : 0.08));
      this.dirtyPlates.setMatrixAt(i, mtx);
    }
    this.dirtyPlates.count = nDirty; this.dirtyPlates.instanceMatrix.needsUpdate = true;

    // makanan di jendela saji
    const S = FIXED_STATIONS.saji;
    const ids = new Set(state.pass.map((d) => d.id));
    for (const [id, g] of this.passItems) if (!ids.has(id)) { this.passGroup.remove(g); this.passItems.delete(id); }
    state.pass.forEach((d, i) => {
      let g = this.passItems.get(d.id);
      if (!g) {
        g = new THREE.Group();
        const plate = new THREE.Mesh(modelGeometry(this.b, 'plate'), this.lib.get(0xffffff, { vertexColors: true, r: 0.4 }));
        g.add(plate);
        const food = makeModel(this.b, MENUS[d.menu]?.model ?? 'unknown');
        food.position.y = 0.04; g.add(food);
        g.userData.born = t;
        this.passGroup.add(g); this.passItems.set(d.id, g);
      }
      const n = state.pass.length;
      const x = S.x + (i - (n - 1) / 2) * Math.min(0.5, 1.3 / Math.max(1, n));
      g.position.set(x, 1.0, S.z + 0.05);
      const age = t - g.userData.born;
      const pop = age < 0.35 ? 1 + Math.sin((age / 0.35) * Math.PI) * 0.3 : 1;
      g.scale.setScalar(pop);
      // makanan yang belum diumumkan berdenyut pelan
      g.position.y = 1.0 + (d.announced ? 0 : Math.abs(Math.sin(t * 4)) * 0.05);
    });

    // cincin berdenyut
    for (const r of this.rings) { const k = 1 + Math.sin(t * 5) * 0.06; r.scale.set(k, 1, k); }
    // uap
    this.steam.forEach((s, i) => {
      if (!this.steamAt) { s.visible = false; return; }
      const ph = (t * 0.8 + i / this.steam.length) % 1;
      s.visible = true;
      s.position.set(this.steamAt.x + Math.sin(i * 2 + t) * 0.1, this.steamAt.y + ph * 0.9, this.steamAt.z + Math.cos(i * 3 + t) * 0.1);
      s.scale.setScalar(0.6 + ph * 0.9);
    });
    // bel bergoyang
    this.bellT += dt;
    const bk = Math.max(0, 1 - this.bellT / 0.6);
    this.bell.rotation.z = Math.sin(this.bellT * 40) * 0.25 * bk;
    this.bell.scale.setScalar(1 + bk * 0.15);

    // bayangan blob tokoh
    this.blobs.begin();
    this.blobs.push(m.x, m.z, 0.42);
    this.blobs.end();
  }
}
