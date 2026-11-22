# Aset, Lisensi, dan Konvensi Model

Semua aset game ini gratis untuk dipakai **dan** dijual. Setiap aset baru wajib
dicatat di sini (sumber + lisensi). Lisensi yang diizinkan: **CC0, OFL, domain
publik**, serta library open-source berlisensi permisif (MIT/BSD/Apache/ISC).

## Daftar aset

| Aset | Sumber | Lisensi | Catatan |
|---|---|---|---|
| Font **Baloo 2** (700, 800) | npm `@fontsource/baloo-2` (Ek Type) | SIL Open Font License 1.1 | Di-host sendiri, hanya subset latin |
| Font **Nunito** (700, 800, 900) | npm `@fontsource/nunito` (Vernon Adams et al.) | SIL Open Font License 1.1 | Di-host sendiri, hanya subset latin |
| Semua model 3D (kafe, dapur, ruang makan, tokoh, makanan) | Dibuat prosedural di kode (`src/scenes`, `src/models`) | Milik proyek | Tanpa file model eksternal |
| Semua ikon UI & ikon makanan (SVG) | Digambar sendiri (`src/ui/icons.ts`) | Milik proyek | Tanpa emoji sistem |
| Bendera negara (SVG sederhana) | Digambar sendiri (`src/data/flags.ts`) | Milik proyek | Bendera negara tidak dilindungi hak cipta |
| Ikon aplikasi (PWA) | Digambar sendiri (`public/icons/icon.svg`), PNG dibuat `tools/make-icons.mjs` | Milik proyek | |
| Semua efek suara & musik | Disintesis dengan Web Audio API (`src/engine/audio.ts`) | Milik proyek | Tanpa file audio |
| Tekstur lantai, garis kanopi | Digambar di canvas saat runtime | Milik proyek | |
| Data peta dunia (Tahap 4) | npm `world-atlas` (Natural Earth) | Domain publik | Diproses saat build |

## Library (kode)

| Library | Lisensi |
|---|---|
| three.js | MIT |
| Preact | MIT |
| Vite, vite-plugin-pwa, Workbox | MIT |
| Vitest, TypeScript | MIT / Apache-2.0 |
| Wrangler, @cloudflare/workers-types (alat server) | MIT / Apache-2.0 |

## Sistem ganti model (GLB)

Setiap benda dirujuk lewat **ID model**, misalnya `food/burger`. Saat game butuh
model itu:

1. Bila file `src/assets/models/<id>.glb` ada (mis. `src/assets/models/food/burger.glb`),
   file itu dipakai. Daftar file diketahui saat build, jadi tidak ada request yang gagal.
2. Bila tidak ada, dipakai **model prosedural** dari `src/models/food.ts`.

Model prosedural tampil seketika; GLB dimuat di belakang lalu menggantikannya.

### Konvensi untuk file GLB pengganti

| Hal | Aturan |
|---|---|
| Skala | **1 unit = 1 meter dunia mainan.** Piring berdiameter 0.48; burger ±0.36 lebar × 0.32 tinggi; tokoh ±1.9 tinggi; meja makan berdiameter ±1.8. |
| Titik asal | Di **tengah dasar** benda (benda berdiri di y = 0). |
| Arah depan | Menghadap **+Z**. Atas = **+Y**. |
| Titik pegang (makanan) | Titik asal = tempat menyentuh piring/nampan; makanan diletakkan 0.04 di atas piring. |
| Titik pegang (tokoh) | Nampan di tangan kanan, ±(0.5, 1.5, 0.05) dari titik asal tokoh. |
| Material | Warna flat dari palet (`src/data/palette.ts`), roughness 0.7–0.85, tanpa metal (kecuali panci/wastafel/bel). Tanpa tekstur foto. |
| Ukuran | Kompres dengan **meshopt** (`gltfpack -cc`) atau Draco; tekstur (bila ada) KTX2. Target < 100 KB per model makanan. |
| Bayangan | Benda bergerak tidak memberi bayangan shadow map (pakai bayangan blob otomatis). |

Lisensi model GLB yang ditambahkan harus CC0 (atau buatan sendiri) dan dicatat di tabel atas.
