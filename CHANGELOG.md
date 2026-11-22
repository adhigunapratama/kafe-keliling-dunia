# Catatan Perubahan

Format: versi · tanggal · ringkasan. Nomor versi tampil di Pengaturan.

## 1.0.0 · 2026-11-22 · Tahap 6 — poles & rilis

- **Performa:** jumlah segmen geometri menyesuaikan ukuran benda (ruang makan Level 15 di preset Tinggi turun dari 232 ribu ke ±125 ribu segitiga); semua layar di bawah 120 draw call dan 150 ribu segitiga (`tools/perf.mjs`).
- **Resolusi adaptif:** pixel ratio turun bertahap bila fps < 40 dan naik lagi bila lancar (angka `res` di penghitung FPS).
- Hemat baterai: render berhenti saat game dijeda; dapur dirender lebih jarang di balik mini-game.
- Geometri tokoh tamu dibuang bersama adegan (tidak menumpuk saat bermain lama).
- Peta Dunia dimuat saat dibuka; unduhan awal ±820 KB (±240 KB gzip), seluruh game ±1,4 MB ter-cache untuk offline.
- **Layar HP pendek:** layar judul, papan mini-game, dan daftar bahan menyesuaikan tinggi layar; bahan berikutnya otomatis terlihat.
- Gelembung di atas kepala tamu kini juga bisa diketuk (lebih mudah untuk Adik).
- Narasi iOS: daftar suara dimuat ulang saat siap.
- Uji baru: emulasi iPhone & Android dengan layar sentuh (ketuk, swipe, ukuran tombol ≥ 84 px untuk Adik), PWA offline (`tools/smoke-mobile.mjs`).
- Audit teks: semua teks UI lewat file terjemahan (ID/EN).
- DEPLOY.md: langkah rilis produksi & perangkat yang didukung.

## 0.5.0 · 2026-11-22 · Tahap 5 — level 6–15, final Indonesia, Hias Kafe

- **Ke-15 level bisa dimainkan.** Level baru: Argentina (empanada, asado), Australia (meat pie, pavlova — dua menu bergantian di oven), Turki (kebab, baklava — lapisan berurutan), Korea (bibimbap, tteokbokki — banyak topping, 4 meja), Arab Saudi (kabsa, mutabbaq), Tiongkok (dimsum, mi tarik — kukusan & tarik mi), Nigeria (nasi jollof, suya), Thailand (pad thai, ketan mangga), India (kari, naan), dan **Indonesia (final: nasi goreng, sate ayam, es teh manis — 3 menu, 5 meja)**.
- 21 model makanan 3D, ±50 ikon bahan/menu baru, timing "kukus", mini-game lipat & tarik kini dipakai.
- Tema & hiasan khas 10 negara baru (karpet, pohon palem, lampion warna-warni, lampu untai, poster bulan sabit & batik). Indonesia: suasana warung/angkringan dengan gerobak dan lampu-lampu, musik bernuansa gamelan ceria (suara bonang/saron prosedural).
- **Perayaan tamat** di Indonesia: "Tamat! Kafe Keliling Dunia Juara!", piala, konfeti ekstra, fanfare.
- **Hias Kafe**: 14 dekorasi (lantai, hiasan meja, lampu, tanaman, celemek Pelayan, syal Koki) dibeli dengan koin tim — **baru terbeli bila Kakak dan Adik mengetuk barang yang sama** (di satu perangkat: dua tombol per barang; saat main berdua: tiap anak di perangkatnya, pilihan saudara terlihat). Dekorasi tampil di semua level dan ikut terkirim ke tablet Adik. Dibuka dari layar Ruangan, layar Hasil, dan Peta.
- **Tokohku**: pilih warna kulit, rambut, dan baju tokoh sendiri (layar Ruangan HP Kakak & layar tunggu tablet Adik).
- Keseimbangan: kesabaran tamu & tempo kedatangan dilonggarkan untuk level 3–15 dan batas bintang disetel ulang (tes otomatis: tim cepat 3★, tim santai ≥2★ di setiap level).
- Protokol jaringan versi 2 (pesan toko & dekorasi).

## 0.4.0 · 2026-11-22 · Tahap 4 — Peta Dunia 3D + simpanan

- **Peta Dunia 3D sungguhan** dari data Natural Earth (`world-atlas`), proyeksi Natural Earth 1, dipotong di garis tanggal internasional, tanpa Antartika. Diproses saat build (`tools/build-map.mjs`) menjadi file biner ±355 KB: satu mesh daratan (hijau bervariasi) + satu mesh 15 negara level.
- Warna negara per status (kuning = sudah dimainkan, biru = sekarang, abu-abu = terkunci, oranye = Indonesia); pin emas/biru bercincin/abu-abu/merah bermahkota; jalur busur emas + satu rute titik-titik dengan pesawat; awan dan kapal bergerak.
- Geser, pinch-zoom (dan roda tetikus), ketuk pin -> kamera terbang mendekat + kartu level (nama kafe, bintang terbaik, menu, "Main!"/"Main lagi"). Label dengan nomor, nama, bintang, gembok; ringkas saat diperkecil supaya Eropa tetap mudah diketuk.
- Header peta: kembali, "Tersimpan otomatis", total bintang, koin tim, Hias Kafe (Tahap 5).
- Peta bisa dibuka dari Layar Judul dan dari layar Ruangan (memilih level untuk dimainkan berdua).
- **Simpanan berversi (v2)** di IndexedDB + cermin localStorage, dengan migrasi dari simpanan Tahap 1–3. Bintang terbaik tidak pernah turun.
- **Kode Keluarga** (`KAFE-XXXX-XXXX`, acak dari 31 karakter): simpanan dicadangkan otomatis ke Durable Object `KafeBackup`. Pengaturan menampilkan kode + tombol salin, dan bisa memulihkan simpanan di HP baru.
- Kartu petunjuk tutorial tidak lagi menghalangi ketukan di layar HP kecil.

## 0.3.0 · 2026-11-22 · Tahap 3 — isi level 1–5

- Level 2–5 bisa dimainkan: **Italia** (pizza, spaghetti), **Meksiko** (taco, nachos), **Prancis** (croissant, crêpes), **Jepang** (sushi, ramen). Level 3–5: 3 meja, rombongan 1–2 tamu.
- Mini-game baru: **aduk** (putar jari), **gulung** (swipe panjang ke atas), **lipat**, **tarik** (dipakai level berikutnya), seret-bahan mode **tabur** (topping jatuh di titik yang diseret), tampilan oven dan panci rebus untuk timing.
- 8 model makanan 3D prosedural baru dan ±25 ikon bahan/menu SVG baru.
- Dekorasi khas tiap negara: warna dinding & lantai, untaian bendera, kaktus, lampion, bambu, kotak bunga, poster (matahari, menara, ombak), lampu dinding.
- **Tutorial Level 1** (main pertama kali) memandu kedua layar langkah demi langkah: panah besar memantul + kartu bergambar di layar Adik, kartu petunjuk + stasiun berpanah di layar Kakak, dan suara. Selama tutorial hanya satu tamu, tamu tidak kehilangan kesabaran, dan timer berhenti.
- **Narasi suara** (Web Speech API, Bahasa Indonesia/Inggris): "Makanan siap!", "Meja merah!", dst. Bisa dimatikan di Pengaturan; diam bila perangkat tidak punya suara bahasa itu.
- Musik prosedural per negara (tangga nada & tempo berbeda) — sudah ada sejak Tahap 1, kini terdengar di 5 negara.
- Antrean tamu lebih renggang; hanya rombongan terdepan yang menampilkan gelembung kursi.

## 0.2.0 · 2026-11-22 · Tahap 2 — main berdua

- Server ruangan Cloudflare Worker + Durable Object (`KafeRoom`, backend SQLite, WebSocket Hibernation API, ping/pong otomatis tanpa membangunkan objek, kedaluwarsa otomatis setelah 2 jam tidak aktif).
- Kode ruangan 4 angka; host memakai token rahasia; cek origin + CORS untuk `*.pages.dev` proyek.
- Layar Ruangan & Pilih Peran di HP Koki: kode di kotak kuning, kartu Koki/Pelayan (Siap/Terhubung), Mode Santai, "Mulai Main!".
- Keypad angka besar 3×4 di tablet Adik (hapus & centang), tanda silang bila kode salah.
- HP Koki = host otoritatif; Pelayan mengirim ketukan, menerima event + status ringkas (lintasan, bukan posisi per frame) dan menganimasikan secara lokal.
- Emoji, banner bel, jeda, hasil level, dan "Main lagi"/"Lanjut" tersinkron di dua perangkat.
- Sambung ulang otomatis: game dijeda dengan "Menunggu Adik…/Kakak…" lalu lanjut sendiri; perangkat yang dimuat ulang masuk lagi ke ruangan yang sama.
- Nomor versi protokol: versi berbeda -> "Perbarui game dulu ya".
- Layar tetap menyala selama bermain (Wake Lock, bila didukung).
- DEPLOY.md Bagian 2 (Worker). Tes otomatis: 22 tes dua klien terhadap `wrangler dev` + 18 langkah uji dua browser.

## 0.1.0 · 2026-11-22 · Tahap 1 — inti di satu perangkat

- Mode Uji 1 Perangkat: layar Koki dan Pelayan berdampingan (atau bergantian lewat tombol Koki / Dua layar / Pelayan).
- Level 1 Amerika: burger dan kentang goreng, 2 meja, 4 piring.
- Dapur dan ruang makan 3D bergaya referensi (kamera ortografis semi-atas, geometri membulat, cahaya hangat).
- Lingkaran kerja sama lengkap: tamu datang → diantar ke meja → pesan → pesanan dibawa ke dapur → masak → bel → antar ke meja yang benar → makan → bereskan → piring kotor ke dapur → cuci.
- Mini-game: potong (swipe), balik, seret-bahan, timing, dan cuci piring (gosok).
- Tamu chibi dengan animasi prosedural (berjalan memantul, duduk, makan, senang, cemberut, menggeleng).
- Gelembung bergambar dengan warna kesabaran, panduan titik-titik dan cincin kuning, slot Bawaan dengan warna meja.
- Banner "Makanan siap!", bunyi bel, dan getar (Android).
- Tombol emoji SVG antar layar (jempol, hati, petir / tolong).
- Layar Hasil: 1–3 bintang tim, statistik tim, lencana kerja sama, koin tim.
- Layar Judul dengan kafe 3D berputar.
- Pengaturan: bahasa ID/EN, grafis (Otomatis/Rendah/Sedang/Tinggi), volume, suara, musik, Mode Santai, panduan arah, penghitung FPS.
- Suara dan musik prosedural (Web Audio).
- PWA: bisa dipasang di layar utama, aset di-cache, pemberitahuan versi baru.
