# Kafe Keliling Dunia

Game co-op 3D untuk dua anak: **Kakak (Koki)** memasak di dapur, **Adik (Pelayan)**
melayani tamu di ruang makan, masing-masing di HP/tablet sendiri. Kafenya pindah
negara di setiap level (15 negara, Indonesia terakhir). Tujuannya melatih kerja sama:
tidak ada game over, tidak ada skor per anak, tidak ada iklan atau pembelian.

PWA berbasis web (Vite + TypeScript + Three.js + Preact kecil), berjalan di Chrome
Android dan Safari iOS, layar mendatar.

## Status

**Tahap 1 — inti di satu perangkat** (lihat `CHANGELOG.md`).
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
```

`?test=1` di URL langsung membuka Mode Uji 1 Perangkat.

## Struktur

| Folder | Isi |
|---|---|
| `src/engine` | renderer 3D, preset grafis, penggabung geometri, bayangan blob, audio prosedural, loop |
| `src/scenes` | adegan dapur, ruang makan, kafe judul |
| `src/models` | tokoh chibi, makanan prosedural, sistem ganti model GLB |
| `src/game` | simulasi kafe (host otoritatif), navigasi, panduan, sesi, kemajuan |
| `src/minigames` | mini-game memasak dan cuci piring |
| `src/net` | protokol pesan (Tahap 2: WebSocket ke Worker) |
| `src/ui` | layar & HUD (Preact + CSS), ikon SVG |
| `src/data` | **semua konten**: level, menu, resep, bahan, negara, bendera, tata letak, teks ID/EN |
| `worker/` | server ruangan Cloudflare Worker + Durable Object (Tahap 2) |
| `tools/` | skrip: ikon PWA, uji asap, (Tahap 4) build peta |
| `tests/` | tes Vitest |

Dokumen lain: `DEPLOY.md`, `CARA-MENAMBAH-KONTEN.md`, `ASSETS.md`, `CHANGELOG.md`.
