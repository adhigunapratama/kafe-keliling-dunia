// Membangun data Peta Dunia 3D saat BUILD (bukan di HP).
//
//   Natural Earth (domain publik) dari npm `world-atlas` (countries-50m)
//   -> disederhanakan (topojson-simplify)
//   -> proyeksi Natural Earth 1 (d3-geo) lewat geoProject = memakai projection.stream,
//      jadi poligon DIPOTONG di garis tanggal internasional (Rusia & Fiji tidak membuat garis aneh)
//   -> Antartika dibuang
//   -> diekstrusi dengan three.js: SATU mesh daratan (hijau bervariasi lewat vertex color)
//      + SATU mesh 15 negara level (atribut indeks negara; warnanya diatur saat main)
//   -> disimpan ke public/map/world.bin (kuantisasi Int16/Int8, target < 500 KB).
//
// Jalankan: node tools/build-map.mjs   (otomatis lewat `npm run build` / `npm run dev`)
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import { geoNaturalEarth1, geoArea } from 'd3-geo';
import { geoProject } from 'd3-geo-projection';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/map/world.bin');

/** Negara level dibaca dari data (src/data/map-countries.json). */
const MAP = JSON.parse(readFileSync(resolve(root, 'src/data/map-countries.json'), 'utf8')).countries;
export const LEVEL_COUNTRIES = Object.entries(MAP).map(([code, c]) => [code, c.iso, c.pin]);
const KEEP_BOX = Object.fromEntries(Object.values(MAP).filter((c) => c.keepBox).map((c) => [c.iso, c.keepBox]));

const W = 24; // lebar peta (unit dunia)
const DEPTH_LAND = 0.1, DEPTH_LEVEL = 0.2;

const topo = JSON.parse(readFileSync(resolve(root, 'node_modules/world-atlas/countries-50m.json'), 'utf8'));
const pre = presimplify(topo);
const simple = simplify(pre, quantile(pre, 0.035));
const fc = feature(simple, simple.objects.countries);
fc.features = fc.features.filter((f) => f.id !== '010'); // Antartika

const projection = geoNaturalEarth1().fitWidth(W, { type: 'Sphere' });
const [tx, ty] = projection.translate();
projection.translate([tx - W / 2, ty - projection([0, 0])[1] + (projection([0, 0])[1] - ty)]);
// pusatkan secara vertikal pada lintang 0
const c0 = projection([0, 8]);
projection.translate([projection.translate()[0], projection.translate()[1] - c0[1]]);

const levelIds = new Map(LEVEL_COUNTRIES.map(([code, id], i) => [id, { code, i }]));

function filterOverseas(f) {
  const box = KEEP_BOX[f.id];
  if (!box || f.geometry.type !== 'MultiPolygon') return f;
  const coords = f.geometry.coordinates.filter((poly) => {
    const [lon, lat] = poly[0][0];
    return lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3];
  });
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: coords } };
}

function polysOf(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}

function ringArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a / 2; }

function extrude(polys, depth) {
  const geos = [];
  for (const rings of polys) {
    const outer = rings[0];
    if (!outer || outer.length < 4 || Math.abs(ringArea(outer)) < 0.0006) continue; // pulau sangat kecil dibuang
    const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, -y)));
    for (let k = 1; k < rings.length; k++) if (Math.abs(ringArea(rings[k])) > 0.0004) shape.holes.push(new THREE.Path(rings[k].map(([x, y]) => new THREE.Vector2(x, -y))));
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(-Math.PI / 2);
    g.deleteAttribute('uv');
    geos.push(g);
  }
  return geos;
}

const GREENS = [0x8fd06b, 0x84c862, 0x9ad874, 0x7fc15d, 0x93cf6d];
const landGeos = [], levelGeos = [];
let gi = 0;
for (const f0 of fc.features) {
  const f = geoProject(filterOverseas(f0), projection);
  const lv = levelIds.get(f0.id);
  const geos = extrude(polysOf(f.geometry), lv ? DEPTH_LEVEL : DEPTH_LAND);
  if (!geos.length) continue;
  const color = new THREE.Color(GREENS[gi++ % GREENS.length]);
  for (const g of geos) {
    const n = g.attributes.position.count;
    if (lv) {
      g.setAttribute('cid', new THREE.BufferAttribute(new Float32Array(n).fill(lv.i), 1));
      levelGeos.push(g);
    } else {
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      landGeos.push(g);
    }
  }
}

const land = mergeVertices(mergeGeometries(landGeos), 1e-4);
const levels = mergeVertices(mergeGeometries(levelGeos), 1e-4);

// ---------------- serialisasi biner
const QXZ = 32767 / 15, QY = 32767 / 1;
function pack(geo, kind) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
  const p = new Int16Array(n * 3), nn = new Int8Array(n * 3);
  for (let i = 0; i < n; i++) {
    p[i * 3] = Math.round(pos.getX(i) * QXZ); p[i * 3 + 1] = Math.round(pos.getY(i) * QY); p[i * 3 + 2] = Math.round(pos.getZ(i) * QXZ);
    nn[i * 3] = Math.round(nor.getX(i) * 127); nn[i * 3 + 1] = Math.round(nor.getY(i) * 127); nn[i * 3 + 2] = Math.round(nor.getZ(i) * 127);
  }
  const extra = kind === 'land'
    ? Uint8Array.from({ length: n * 3 }, (_, k) => Math.round(geo.attributes.color.array[k] * 255))
    : Uint8Array.from({ length: n }, (_, k) => geo.attributes.cid.array[k]);
  const idx = geo.index.array;
  const index = n > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx);
  return { n, p, nn, extra, index };
}
const parts = { land: pack(land, 'land'), levels: pack(levels, 'levels') };
const pins = Object.fromEntries(LEVEL_COUNTRIES.map(([code, , ll]) => { const [x, y] = projection(ll); return [code, [+x.toFixed(3), +y.toFixed(3)]]; }));
const header = { v: 1, qxz: QXZ, qy: QY, order: LEVEL_COUNTRIES.map((c) => c[0]), pins, meshes: {} };
const chunks = [];
let off = 0;
const add = (arr) => { const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(new Uint8Array(pad)); off += pad; } const o = off; chunks.push(new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)); off += arr.byteLength; return o; };
for (const [name, m] of Object.entries(parts)) {
  header.meshes[name] = { n: m.n, ni: m.index.length, i32: m.index instanceof Uint32Array, p: add(m.p), nn: add(m.nn), extra: add(m.extra), index: add(m.index) };
}
const hjson = new TextEncoder().encode(JSON.stringify(header));
const head = new Uint8Array(4 + hjson.length + ((4 - ((4 + hjson.length) % 4)) % 4));
new DataView(head.buffer).setUint32(0, hjson.length, true);
head.set(hjson, 4);
const total = new Uint8Array(head.length + off);
total.set(head, 0);
let o2 = head.length;
for (const c of chunks) { total.set(c, o2); o2 += c.length; }
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, total);
const kb = (statSync(OUT).size / 1024).toFixed(0);
console.log(`peta: ${fc.features.length} negara, daratan ${parts.land.n} verteks / ${parts.land.index.length / 3} segitiga, level ${parts.levels.n} verteks -> ${OUT.replace(root + '/', '')} (${kb} KB)`);
