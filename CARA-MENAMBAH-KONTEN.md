# Cara Menambah Konten

Semua konten adalah **data** di `src/data/`, terpisah dari mesin game. Setelah
mengubah data, jalankan `npm test` — tes otomatis memeriksa bahwa semua rujukan
(menu → resep → mini-game → bahan → teks → ikon) lengkap.

## Menambah menu + resep

1. **Bahan** baru (bila perlu) di `src/data/ingredients.ts`:
   ```ts
   keju: { id: 'keju', icon: 'cheese' },
   ```
   dan gambar ikonnya di `FOOD_ICONS` (`src/ui/icons.ts`, SVG 64×64 garis tinta).
2. **Menu** di `src/data/menus.ts`:
   ```ts
   pizza: { id: 'pizza', icon: 'pizza', model: 'food/pizza', weight: 1 },
   ```
   - `icon`: ikon 2D di `FOOD_ICONS`.
   - `model`: ID model 3D. Tambahkan pembuat prosedural di `MAKERS` (`src/models/food.ts`)
     atau taruh file GLB di `src/assets/models/food/pizza.glb` (lihat `ASSETS.md`).
3. **Resep** di `src/data/recipes.ts` — tiap langkah = satu mini-game di satu stasiun:
   ```ts
   pizza: {
     menu: 'pizza',
     steps: [
       { type: 'potong', station: 'talenan', ingredient: 'tomat', cuts: 3 },
       { type: 'seret-bahan', station: 'talenan', base: 'adonan', items: ['saus', 'keju'], distractors: ['selada'] },
       { type: 'timing', station: 'oven', ingredient: 'pizza', action: 'panggang', seconds: 4, zone: [0.6, 0.8] },
     ],
   },
   ```
4. **Teks** di `src/data/i18n/id.ts` **dan** `src/data/i18n/en.ts`:
   `'menu.pizza'`, serta `'ing.<bahan>'` untuk bahan baru.

Stasiun dapur yang muncul di level dihitung otomatis dari resep menu level itu.

## Jenis mini-game yang tersedia

| `type` | Gerakan | Isian |
|---|---|---|
| `potong` | swipe melintasi garis putus-putus | `ingredient`, `cuts` |
| `seret-bahan` | seret bahan ke piring sesuai urutan | `base`, `items` (urut), `distractors` |
| `timing` | ketuk saat jarum di zona hijau | `ingredient`, `action` (`goreng`/`panggang`/`rebus`), `seconds`, `zone` |
| `balik` | ketuk "Balik!" saat warnanya pas | `ingredient`, `flips`, `seconds` |
| `aduk` | putar jari melingkar di mangkuk | `ingredient`, `turns` |
| `gulung` | swipe panjang dari bawah ke atas | `ingredient`, `rolls` |
| `lipat` | seret separuh atas ke bawah | `ingredient`, `folds` |
| `tarik` | swipe lebar ke kiri-kanan | `ingredient`, `pulls` |

`seret-bahan` punya `layout`: `'stack'` (ditumpuk, mis. burger) atau `'scatter'`
(ditabur di titik yang diseret, mis. pizza, mangkuk ramen). Bahan boleh punya
`topIcon` (mis. saus tomat tampil sebagai cipratan saat ditabur).

### Menambah jenis mini-game baru

1. Buat file `src/minigames/<nama>.ts` yang mengekspor `MinigameFactory`
   (lihat `potong.ts` sebagai contoh). Mini-game menerima `area` (tempat menggambar),
   `side` (kolom kanan), `step`, dan memanggil `done(kualitas 0..1)` saat selesai.
   **Jangan pernah membuat mini-game bisa gagal** — kesalahan cukup menurunkan kualitas.
2. Tambahkan bentuk langkahnya di tipe `RecipeStep` (`src/data/recipes.ts`).
3. Daftarkan di `MINIGAMES` (`src/minigames/index.ts`).
4. Tambahkan label langkah di i18n (`step.<nama>`).

## Menambah negara / level

1. **Negara** di `src/data/countries.ts` → `COUNTRIES`:
   warna bendera (`colors`), tema dapur & ruang makan (warna dinding, lantai),
   hiasan (`decorKitchen`, `decorDining`: `bunting` untaian bendera, `poster`
   (bentuk star/circle/stripes/sun/tower/wave), `plant`, `cactus`, `bamboo`, `lantern`,
   `flowerbox`, `lamp`). Tanaman, kaktus, dan bambu otomatis menjadi penghalang jalan.
   dan gaya musik (tangga nada, tempo).
2. **Bendera** di `src/data/flags.ts` (SVG sederhana 30×20).
3. **Level** di `src/data/levels.ts` → `LEVELS`. Semua angka kesulitan ada di sini:
   jumlah meja (2–5), jeda kedatangan, kesabaran per fase, ukuran rombongan, jumlah
   piring, durasi, batas bintang, lama makan.
4. **Teks** `country.<id>` di kedua file i18n.

Level otomatis "bisa dimainkan" begitu semua menunya punya data menu + resep.

## Menambah meja / tata letak

Tata letak meja untuk 2–5 meja ada di `src/data/layouts.ts`. Tes otomatis memastikan
setiap kursi, meja, antrean, dan jendela saji bisa dijangkau dari pintu.

## Menambah teks / bahasa

Semua teks lewat `t('kunci')` (`src/data/i18n`). Kunci baru wajib ada di `id.ts`
dan `en.ts` (TypeScript dan tes akan menolak bila ada yang kurang).

## Dekorasi (Hias Kafe)

*Menyusul di Tahap 5* (`src/data/decor.ts`).

## Tutorial

Langkah tutorial dihitung dari status kafe di `src/game/tutorial.ts` (satu fungsi untuk
kedua layar). Level dengan `tutorial: true` menjalankannya saat pertama kali dimainkan.
Kalimat suara ada di i18n (`voice.*`), teks kartu Koki di `tut.*`.
