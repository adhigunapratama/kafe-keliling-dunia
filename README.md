# Kafe Keliling Dunia

Game co-op 3D untuk dua anak: **Kakak (Koki)** memasak di dapur, **Adik (Pelayan)**
melayani tamu di ruang makan, masing-masing di HP/tablet sendiri. Kafenya pindah
negara di setiap level (15 negara, Indonesia terakhir). Tujuannya melatih kerja sama:
tidak ada game over, tidak ada skor per anak, tidak ada iklan atau pembelian.

PWA berbasis web (Vite + TypeScript + Three.js + Preact kecil), berjalan di Chrome
Android dan Safari iOS, layar mendatar.

## Status

**Versi 1.0** — 15 level, main berdua, Peta Dunia, Hias Kafe (lihat `CHANGELOG.md`).

| Layar (preset Tinggi) | Draw call | Segitiga |
|---|---|---|
| Judul | 8 | 22 rb |
| Peta Dunia | 14 | 47 rb |
| Dapur Level 15 | 33 | 54 rb |
| Ruang makan Level 15 (10 tamu) | 69 | 125 rb |

Target: < 120 draw call dan < 150 rb segitiga per layar (`node tools/perf.mjs`).
Coba lewat URL preview Cloudflare Pages (lihat `DEPLOY.md`).

## Perintah

```bash
npm install        # pasang dependensi
npm run dev        # server pengembangan (http://localhost:5173)
npm run build      # cek TypeScript + build produksi ke dist/
npm test           # tes otomatis (simulasi, data konten, tata letak)
```

Uji di browser (memakai Chromium yang terpasang):

```bash
npm run build && npx vite preview --port 4173
node tools/smoke.mjs http://localhost:4173/            # main otomatis + tangkapan layar
node tools/smoke-minigames.mjs http://localhost:4173/  # setiap mini-game dengan gerakan jari
node tools/smoke-stage3.mjs http://localhost:4173/     # mini-game Tahap 3 + tutorial
node tools/smoke-mobile.mjs http://localhost:4173/     # emulasi iPhone/Android (sentuh) + PWA offline
node tools/perf.mjs http://localhost:4173/ tinggi      # draw call & segitiga per layar
```

Dengan server ruangan lokal menyala (lihat di bawah):

```bash
node tools/smoke-net.mjs http://localhost:4173/ http://127.0.0.1:8787     # main berdua (2 browser)
node tools/smoke-stage4.mjs http://localhost:4173/ http://127.0.0.1:8787  # peta, simpanan, Kode Keluarga
node tools/smoke-stage5.mjs http://localhost:4173/ http://127.0.0.1:8787  # lipat/tarik, Hias Kafe berdua, tamat
```

`?test=1` di URL langsung membuka Mode Uji 1 Perangkat.

Server ruangan (main berdua) di `worker/`:

```bash
cd worker && npm install
npx wrangler dev --port 8787            # server lokal
node test/two-clients.mjs               # uji dua klien (server harus menyala)
```

Uji dua browser lewat server lokal: buka game dengan `?server=http://127.0.0.1:8787`, atau
`node tools/smoke-net.mjs http://localhost:4173/ http://127.0.0.1:8787`.
Untuk pengembangan, salin `.env.example` menjadi `.env` dan isi `VITE_ROOM_SERVER_URL`.

## Struktur

| Folder | Isi |
|---|---|
| `src/engine` | renderer 3D, preset grafis, penggabung geometri, bayangan blob, audio prosedural, loop |
| `src/scenes` | adegan dapur, ruang makan, kafe judul |
| `src/models` | tokoh chibi, makanan prosedural, sistem ganti model GLB |
| `src/game` | simulasi kafe (host otoritatif), navigasi, panduan, sesi, kemajuan |
| `src/minigames` | mini-game memasak dan cuci piring |
| `src/net` | protokol pesan, klien WebSocket + sambung ulang, pengendali ruangan host/tamu |
| `src/ui` | layar & HUD (Preact + CSS), ikon SVG |
| `src/data` | **semua konten**: level, menu, resep, bahan, negara, bendera, tata letak, teks ID/EN |
| `worker/` | server ruangan Cloudflare Worker + Durable Object (`wrangler.jsonc` sendiri) |
| `tools/` | skrip: ikon PWA, uji asap, (Tahap 4) build peta |
| `tests/` | tes Vitest |

Dokumen lain: `DEPLOY.md`, `CARA-MENAMBAH-KONTEN.md`, `ASSETS.md`, `CHANGELOG.md`.
