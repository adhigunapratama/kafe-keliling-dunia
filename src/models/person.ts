import * as THREE from 'three';
import type { Builder } from '../engine/build';
import { mergeParts } from '../engine/bake';

export interface PersonLook {
  skin: number;
  shirt: number;
  pants: number;
  hair?: number;
  /** 0 = poni bulat, 1 = + sanggul, 2 = + kuncir dua */
  hairStyle?: number;
  apron?: number;
  chefHat?: boolean;
  scarf?: number;
}

export type PersonReact = 'shake' | 'happy' | 'sad' | 'yum' | null;

export interface PersonPose {
  moving: boolean;
  seated: boolean;
  react: PersonReact;
  /** tangan kanan diangkat (membawa nampan) */
  carryUp: boolean;
  /** sedang bekerja (gerakan tangan cepat, untuk Koki) */
  working?: boolean;
  /** makan (gerakan tangan ke mulut) */
  eating?: boolean;
}

const BY = 0.66; // tinggi pusat badan (dari referensi)
const HY = BY + 0.62; // tinggi kepala

type PersonGeo = { body: THREE.BufferGeometry; arm: THREE.BufferGeometry; leg: THREE.BufferGeometry };
/** Cache per Builder (= per adegan): ikut dibuang saat adegan ditutup, jadi tidak menumpuk antar level. */
const geoCaches = new WeakMap<Builder, Map<string, PersonGeo>>();

function lookKey(o: PersonLook) {
  return [o.skin, o.shirt, o.pants, o.hair ?? -1, o.hairStyle ?? 0, o.apron ?? -1, o.chefHat ? 1 : 0, o.scarf ?? -1].join('|');
}

/** Bangun geometri tokoh (sekali per tampilan, lalu di-cache & dipakai ulang). */
function buildGeometry(b: Builder, o: PersonLook) {
  const key = lookKey(o);
  let geoCache = geoCaches.get(b);
  if (!geoCache) { geoCache = new Map(); geoCaches.set(b, geoCache); }
  const hit = geoCache.get(key);
  if (hit) return hit;
  const root = new THREE.Group();
  const parts: THREE.Mesh[] = [];
  const P = <T extends THREE.Mesh>(m: T) => { parts.push(m); return m; };
  const body = P(b.cap(0.25, 0.22, o.shirt, 0, BY, 0, root)); body.scale.set(1, 1, 0.85);
  if (o.apron !== undefined) P(b.rbox(0.38, 0.4, 0.06, o.apron, 0, BY - 0.05, 0.2, 0.03, root));
  P(b.sph(0.3, o.skin, 0, HY, 0, root));
  if (o.hair !== undefined) {
    const hair = P(b.dome(0.315, Math.PI * 0.55, o.hair, 0, HY + 0.01, -0.02, root)); hair.rotation.x = -0.25;
    if (o.hairStyle === 1) P(b.sph(0.13, o.hair, 0, HY + 0.24, -0.2, root));
    if (o.hairStyle === 2) { P(b.sph(0.1, o.hair, -0.3, HY - 0.02, -0.08, root)); P(b.sph(0.1, o.hair, 0.3, HY - 0.02, -0.08, root)); }
  }
  P(b.sph(0.038, 0x2b2340, -0.1, HY + 0.02, 0.27, root));
  P(b.sph(0.038, 0x2b2340, 0.1, HY + 0.02, 0.27, root));
  P(b.sph(0.05, 0xf29b8f, -0.17, HY - 0.06, 0.24, root)).scale.set(1, 0.6, 0.5);
  P(b.sph(0.05, 0xf29b8f, 0.17, HY - 0.06, 0.24, root)).scale.set(1, 0.6, 0.5);
  if (o.chefHat) {
    P(b.cyl(0.22, 0.22, 0.16, 0xffffff, 0, HY + 0.3, 0, root));
    P(b.sph(0.17, 0xffffff, -0.1, HY + 0.45, 0, root)); P(b.sph(0.17, 0xffffff, 0.1, HY + 0.45, 0, root)); P(b.sph(0.18, 0xffffff, 0, HY + 0.5, 0.02, root));
  }
  if (o.scarf !== undefined) { const t = P(b.torus(0.17, 0.05, o.scarf, 0, BY + 0.3, 0, root)); t.rotation.x = Math.PI / 2; }
  const bodyGeo = mergeParts(parts, root)!;
  // lengan: bergantung dari bahu (pivot di 0,0)
  const armRoot = new THREE.Group();
  const arm = b.cap(0.07, 0.26, o.shirt, 0, -0.2, 0, armRoot);
  const hand = b.sph(0.075, o.skin, 0, -0.36, 0, armRoot);
  const armGeo = mergeParts([arm, hand], armRoot)!;
  const legRoot = new THREE.Group();
  const leg = b.cap(0.085, 0.22, o.pants, 0, -0.13, 0, legRoot);
  const legGeo = mergeParts([leg], legRoot)!;
  const res = { body: bodyGeo, arm: armGeo, leg: legGeo };
  geoCache.set(key, res);
  return res;
}

/**
 * Tokoh chibi bulat (kepala bola, badan kapsul, mata titik, pipi merona).
 * Hanya 5 mesh per tokoh (badan + 2 lengan + 2 kaki) dengan satu material bersama.
 * Animasi prosedural: memantul, mengayun, squash-stretch.
 */
export class Person {
  readonly group = new THREE.Group();
  /** bagian yang memantul / squash */
  readonly rig = new THREE.Group();
  readonly body: THREE.Mesh;
  readonly armL = new THREE.Group();
  readonly armR = new THREE.Group();
  readonly legL = new THREE.Group();
  readonly legR = new THREE.Group();
  /** titik pegang nampan (di atas tangan kanan yang diangkat) */
  readonly hold = new THREE.Group();
  private phase = Math.random() * 10;
  private walkAmt = 0;
  private reactT = 0;
  private lastReact: PersonReact = null;
  private carryAmt = 0;

  constructor(b: Builder, look: PersonLook) {
    const g = buildGeometry(b, look);
    const mat = b.lib.get(0xffffff, { vertexColors: true });
    this.body = new THREE.Mesh(g.body, mat);
    this.rig.add(this.body);
    const mk = (geo: THREE.BufferGeometry, pivot: THREE.Group, x: number, y: number) => {
      const m = new THREE.Mesh(geo, mat); pivot.add(m); pivot.position.set(x, y, 0); this.rig.add(pivot);
    };
    mk(g.arm, this.armL, -0.36, BY + 0.2);
    mk(g.arm, this.armR, 0.36, BY + 0.2);
    mk(g.leg, this.legL, -0.1, 0.33);
    mk(g.leg, this.legR, 0.1, 0.33);
    this.hold.position.set(0.5, 1.5, 0.05);
    this.rig.add(this.hold);
    this.group.add(this.rig);
    this.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  }

  /** Panggil tiap frame. */
  animate(dt: number, pose: PersonPose) {
    this.phase += dt;
    const t = this.phase;
    this.walkAmt += ((pose.moving ? 1 : 0) - this.walkAmt) * Math.min(1, dt * 10);
    this.carryAmt += ((pose.carryUp ? 1 : 0) - this.carryAmt) * Math.min(1, dt * 8);
    if (pose.react !== this.lastReact) { this.lastReact = pose.react; this.reactT = 0; }
    this.reactT += dt;
    const w = this.walkAmt;
    const step = t * 9;
    // pantulan & squash-stretch
    let bob = Math.abs(Math.sin(step)) * 0.09 * w;
    let sy = 1 + Math.sin(step * 2) * 0.04 * w;
    let tiltZ = Math.sin(step) * 0.06 * w;
    let yaw = 0;
    let lean = 0.06 * w;
    // napas saat diam
    sy += Math.sin(t * 2.2) * 0.015 * (1 - w);
    if (pose.react === 'happy') { const k = this.reactT * 7; bob += Math.max(0, Math.sin(k)) * 0.22; sy += Math.sin(k) * 0.06; }
    else if (pose.react === 'yum') { bob += Math.max(0, Math.sin(this.reactT * 10)) * 0.08; }
    else if (pose.react === 'shake') { yaw = Math.sin(this.reactT * 18) * 0.35 * Math.max(0, 1 - this.reactT / 1.3); }
    else if (pose.react === 'sad') { sy -= 0.07; lean = -0.12; }
    this.rig.position.y = bob + (pose.seated ? 0.1 : 0);
    this.rig.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    this.rig.rotation.set(lean, yaw, tiltZ);
    // lengan & kaki
    const swing = Math.sin(step) * 0.7 * w;
    let aL = 0.35, aR = -0.35, axL = swing, axR = -swing;
    if (pose.working) { axL = -0.9 + Math.sin(t * 14) * 0.35; axR = -0.9 - Math.sin(t * 14) * 0.35; }
    if (pose.eating) { axR = -1.2 + Math.sin(t * 6) * 0.4; }
    if (pose.react === 'happy') { aL = -2.4; aR = 2.4; axL = axR = 0; }
    // tangan kanan membawa nampan
    aR = aR * (1 - this.carryAmt) + 2.75 * this.carryAmt;
    axR = axR * (1 - this.carryAmt) + -0.15 * this.carryAmt;
    this.armL.rotation.set(axL, 0, aL);
    this.armR.rotation.set(axR, 0, aR);
    this.hold.scale.setScalar(Math.max(0.001, this.carryAmt));
    if (pose.seated) { this.legL.rotation.set(-1.45, 0, 0); this.legR.rotation.set(-1.45, 0, 0); }
    else { this.legL.rotation.set(-swing * 0.8, 0, 0); this.legR.rotation.set(swing * 0.8, 0, 0); }
  }

  /** Arahkan tokoh secara halus ke sudut yaw tujuan. */
  faceTowards(target: number, dt: number) {
    let d = target - this.group.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.group.rotation.y += d * Math.min(1, dt * 10);
  }
}
