# Catatan Perubahan

Format: versi · tanggal · ringkasan. Nomor versi tampil di Pengaturan.

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
