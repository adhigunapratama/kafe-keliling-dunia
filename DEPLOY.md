# Cara Memasang Kafe Keliling Dunia di Cloudflare (gratis)

Panduan ini untuk orang awam. Tidak perlu mengetik perintah apa pun: semua lewat klik
di situs Cloudflare. Game akan otomatis dibangun ulang setiap kali ada perubahan
baru di GitHub.

Ada dua bagian:

1. **Game (PWA) → Cloudflare Pages** — bagian ini sudah bisa dipakai sejak Tahap 1.
2. **Server ruangan (main berdua di 2 perangkat) → Cloudflare Worker** — mulai Tahap 2.

---

## Bagian 1 — Game di Cloudflare Pages

### Langkah 1: Buat akun Cloudflare (gratis)

1. Buka **https://dash.cloudflare.com/sign-up** di laptop/komputer.
2. Isi email dan kata sandi, lalu klik **Sign up**.
3. Buka email dari Cloudflare dan klik tautan verifikasinya.
4. Kalau ditanya mau menambahkan domain/website, **lewati saja** (klik *Skip* atau
   langsung ke dasbor). Kita tidak butuh domain sendiri.
5. Kalau ditanya memilih paket, pilih **Free** (gratis). Tidak perlu kartu kredit.

### Langkah 2: Hubungkan repo GitHub ke Cloudflare Pages

1. Di dasbor Cloudflare, klik menu kiri **Workers & Pages**
   (kadang ada di dalam menu **Compute (Workers)** → **Workers & Pages**).
2. Klik tombol biru **Create** (atau **Create application**).
3. Cloudflare sekarang menampilkan pilihan *Workers* lebih dulu. Cari tab
   **Pages**, atau tautan kecil di bawah bertuliskan
   **"Looking to deploy Pages? Get started"**, lalu klik.
4. Pilih **Import an existing Git repository** / **Connect to Git**.
5. Klik **Connect GitHub**. Jendela GitHub akan terbuka:
   - Login ke GitHub bila diminta.
   - Pilih **Only select repositories** lalu pilih repo **kafe-keliling-dunia**.
   - Klik **Install & Authorize**.
6. Kembali di Cloudflare, pilih repo **kafe-keliling-dunia**, lalu klik
   **Begin setup**.

### Langkah 3: Isi pengaturan build

Isi persis seperti ini:

| Kolom | Isi |
|---|---|
| **Project name** | `kafe-keliling-dunia` (boleh nama lain; ini jadi alamat `nama.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | biarkan kosong |

Buka **Environment variables (advanced)** — boleh dilewati dulu. Variabel
`VITE_ROOM_SERVER_URL` diisi setelah server ruangan dibuat (Bagian 2, Langkah 4).

> Versi Node.js sudah diatur otomatis lewat file `.nvmrc` (Node 22). Tidak perlu
> mengisi apa pun untuk itu.

Klik **Save and Deploy**. Tunggu ±1–2 menit sampai muncul tulisan **Success**.

> Catatan: branch `main` mungkin belum berisi game (game ada di branch tahap).
> Itu tidak apa-apa — yang akan kita buka adalah **URL preview** per branch, lihat
> Langkah 4.

### Langkah 4: Menemukan URL preview tiap branch

Setiap kali ada push ke branch **selain `main`**, Cloudflare membuat versi preview
dengan alamatnya sendiri:

```
https://<nama-branch>.<nama-proyek>.pages.dev
```

Contoh untuk Tahap 1 (branch `tahap-1`, proyek `kafe-keliling-dunia`):

```
https://tahap-1.kafe-keliling-dunia.pages.dev
```

Cara melihat alamat pastinya:

1. Dasbor Cloudflare → **Workers & Pages** → klik proyek **kafe-keliling-dunia**.
2. Buka tab **Deployments**.
3. Di bagian **Preview**, cari baris dengan nama branch (mis. `tahap-1`).
   Di kolom kanan ada dua tautan:
   - **Branch alias** — alamat tetap untuk branch itu (selalu versi terbaru),
     mis. `tahap-1.kafe-keliling-dunia.pages.dev`. **Pakai yang ini.**
   - Alamat acak seperti `a1b2c3d4.kafe-keliling-dunia.pages.dev` — versi
     untuk satu commit saja.
4. Klik tautannya, atau ketik alamat itu di Chrome (Android) / Safari (iPhone/iPad).

> Nama branch yang mengandung garis miring (`/`) diubah menjadi tanda hubung
> (`-`) dan huruf kecil di alamat preview.

Kalau preview belum muncul: buka **Settings → Builds & deployments → Preview
deployments** dan pastikan pilihan **All non-Production branches** aktif.

### Langkah 5: Pasang di HP/tablet seperti aplikasi

**Android (Chrome):** buka alamat preview → ketuk menu **⋮** → **Add to Home screen**
/ **Install app** → **Install**.

**iPhone/iPad (Safari):** buka alamat preview → ketuk tombol **Bagikan** (kotak
dengan panah ke atas) → **Add to Home Screen** → **Add**.

Buka game dari ikon di layar utama: tampil layar penuh tanpa address bar. Putar
perangkat ke posisi **mendatar (landscape)**.

Kalau ada versi baru, game menampilkan tombol biru **"Ada versi baru! Ketuk untuk
memperbarui"**.

### Kalau build gagal

**`Could not read package.json` / `ENOENT ... package.json`:** build itu berasal dari
branch yang belum berisi kode game (biasanya `main` sebelum Pull Request tahap
digabung). Ini wajar dan tidak mengganggu preview branch lain. Cek tab
**Deployments → Preview** untuk branch tahap (mis. `tahap-1`). Catatan: preview hanya
dibuat untuk push yang terjadi *setelah* proyek Pages dibuat.

1. Workers & Pages → proyek → **Deployments** → klik deployment yang gagal →
   **View details** untuk melihat log.
2. Pastikan **Build command** = `npm run build` dan **Build output directory** = `dist`.
3. Klik **Retry deployment** setelah memperbaiki pengaturan.

---

## Bagian 2 — Server ruangan (main berdua di 2 perangkat)

Server ruangan adalah Cloudflare **Worker** kecil (folder `worker/` di repo) yang
menghubungkan HP Kakak dan tablet Adik lewat kode ruangan 4 angka. Gratis.

### Langkah 1: Buat Worker dari repo GitHub

1. Dasbor Cloudflare → **Workers & Pages** → tombol biru **Create** (atau
   **Create application**).
2. Pilih tab **Workers** (bukan Pages) → **Import a repository**
   (atau **Continue with GitHub**).
3. Pilih repo **kafe-keliling-dunia** → **Next**.
4. Isi pengaturan persis seperti ini:

| Kolom | Isi |
|---|---|
| **Project name** | `kafe-room` ← **harus persis ini** (sama dengan nama di `worker/wrangler.jsonc`) |
| **Build command** | biarkan kosong |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** (di *Advanced settings*) | `worker` |

5. Klik **Create and deploy** (atau **Deploy**). Tunggu sampai **Success**.

> Kalau Cloudflare meminta memilih *subdomain workers.dev* (hanya terjadi untuk
> Worker pertama di akun), ketik nama apa saja yang Anda suka, mis. `abangade`.

### Langkah 2: Atur branch Worker

Selama masih tahap uji coba, server ruangan dibangun dari branch tahap, bukan `main`.

1. Workers & Pages → klik **kafe-room** → tab **Settings** → bagian **Build**.
2. Di **Branch control**, ubah **Production branch** menjadi **`tahap-2`** → **Save**.
3. Buka tab **Deployments** → kalau belum ada deployment dari `tahap-2`, klik
   **Retry** / **Deploy** pada build terakhir (atau tunggu push berikutnya).

> Setelah Pull Request tahap digabung ke `main`, kembalikan Production branch ke `main`.

### Langkah 3: Salin alamat Worker

1. Workers & Pages → **kafe-room** → di bagian atas (atau tab **Settings → Domains & Routes**)
   ada alamat seperti:
   ```
   https://kafe-room.abangade.workers.dev
   ```
2. Cek: buka alamat itu di browser. Harus muncul tulisan **ok**.
3. Salin alamatnya (tanpa garis miring di akhir).

### Langkah 4: Beri tahu game alamat server (variabel `VITE_ROOM_SERVER_URL`)

1. Workers & Pages → klik proyek **Pages** Anda (mis. **cafe-abangade**) → tab **Settings**
   → **Variables and Secrets** (atau **Environment variables**).
2. Klik **Add** (tambah variabel) dan isi:
   - **Variable name:** `VITE_ROOM_SERVER_URL`
   - **Value:** alamat Worker dari Langkah 3, mis. `https://kafe-room.abangade.workers.dev`
   - **Type:** *Text* (bukan Secret)
3. Pastikan variabel ini ada untuk **Production** *dan* **Preview**. Di beberapa tampilan
   ada pilihan lingkungan di atas daftar; tambahkan di keduanya.
4. Klik **Save**.
5. Variabel baru dipakai pada build berikutnya: buka tab **Deployments** → pada deployment
   terbaru klik **⋯** → **Retry deployment**.

### Langkah 5: Izinkan alamat game Anda (hanya bila nama proyek Pages BUKAN `cafe-abangade`)

Server hanya melayani alamat game Anda sendiri. Daftar alamat yang diizinkan ada di
`worker/wrangler.jsonc` (`ALLOWED_ORIGINS`) dan sudah diisi untuk `cafe-abangade.pages.dev`
beserta semua alamat preview-nya (`*.cafe-abangade.pages.dev`). Kalau nama proyek Pages Anda
lain, minta saya mengubahnya, atau ubah di dasbor: **kafe-room → Settings → Variables and
Secrets → ALLOWED_ORIGINS**.

### Cara main berdua

1. **HP Kakak:** buka game → **Lanjutkan** → muncul kode 4 angka.
2. **Tablet Adik:** buka game → **Gabung pakai Kode** → ketik kode di keypad → centang hijau.
3. Di HP Kakak, kartu **Pelayan** berubah menjadi **Terhubung** → tekan **Mulai Main!**

Kedua perangkat boleh memakai jaringan berbeda (WiFi dan data seluler). Kalau sinyal
salah satu putus, game berhenti sebentar dengan pesan *"Menunggu Adik…"* /
*"Menunggu Kakak…"* lalu lanjut sendiri. Kalau aplikasi tertutup atau dimuat ulang,
buka lagi saja: perangkat otomatis masuk kembali ke ruangan yang sama (selama 2 jam).

### Kode Keluarga (cadangan simpanan)

Server yang sama juga menyimpan cadangan kemajuan (Durable Object kedua, `KafeBackup`).
Tidak ada yang perlu diatur: setelah push, Worker dibangun ulang otomatis dan kelas baru
ini ikut terpasang (lewat `migrations` di `worker/wrangler.jsonc`).

- Kode Keluarga (mis. `KAFE-7Q2M-AB3C`) tampil di **Pengaturan** di HP Kakak, dengan tombol **Salin**.
- Di HP baru: **Pengaturan → Kode Keluarga → Punya kode dari HP lama?** → ketik kode → **Pulihkan**.

---

## Rilis versi 1.0 (produksi)

Selama uji coba, Pages dan Worker dibangun dari branch kerja (`claude/admiring-wozniak-o2prdf`).
Untuk rilis resmi dari `main`:

1. Buka repo di GitHub → tab **Pull requests** → buka PR **Tahap 6** → **Merge pull request** → **Confirm merge**.
   PR tahap ini sudah berisi semua tahap sebelumnya; PR tahap lain akan tertutup otomatis
   (atau tutup saja dengan **Close**).
2. Cloudflare → **Workers & Pages** → **kafe-room** → **Settings → Build → Branch control** →
   **Production branch** = `main` → **Save**.
3. Cloudflare → proyek Pages **cafe-abangade** → **Settings → Builds & deployments** →
   **Production branch** = `main` → **Save**.
4. Tunggu ±2 menit sampai keduanya membangun ulang (tab **Deployments**, status **Success**).
5. Buka **https://cafe-abangade.pages.dev** di kedua perangkat → ketuk **"Ada versi baru!"** bila muncul.

Pembaruan berikutnya: buat branch baru dari `main`, coba lewat URL preview branch itu
(`https://<branch>.cafe-abangade.pages.dev`), lalu gabungkan ke `main` bila sudah oke.

## Perangkat yang didukung

| Perangkat | Minimum | Disarankan |
|---|---|---|
| iPhone / iPad (Safari) | iOS / iPadOS 15 | 16.4 atau lebih baru (layar tetap menyala saat main, tata letak dua layar terbaik) |
| Android (Chrome) | Chrome 100 | Chrome terbaru |

Tips:
- **iPhone/iPad:** suara game ikut tombol senyap (silent). Bila tidak terdengar, matikan mode senyap.
- Narasi suara memakai suara bawaan perangkat. Bila perangkat tidak punya suara Bahasa Indonesia,
  narasi diam saja (game tetap jalan dengan ikon & efek suara). Di iPhone: **Pengaturan → Aksesibilitas →
  Konten Lisan → Suara → Bahasa Indonesia** untuk mengunduhnya.
- Grafis disetel otomatis saat pertama dibuka. Bila terasa patah-patah, buka **Pengaturan → Grafis → Rendah**.
  Game juga menurunkan resolusi sendiri bila fps turun (lihat angka **res** di penghitung FPS).

## Mengecek pemakaian paket gratis

Paket gratis Cloudflare sangat cukup untuk pemakaian keluarga:

| Layanan | Batas gratis (perkiraan) | Pemakaian game ini |
|---|---|---|
| Pages — build | 500 build per bulan | 1 build per push |
| Pages — kunjungan file statis | tanpa batas | — |
| Workers — request (Tahap 2) | 100.000 per hari | puluhan–ratusan per sesi main |
| Durable Objects SQLite (Tahap 2) | tersedia di paket Free | 1 objek per ruangan |

Cara melihat pemakaian:

1. **Build Pages:** Workers & Pages → proyek → tab **Deployments** (jumlah build
   bulan ini terlihat dari daftar deployment).
2. **Request Worker (mulai Tahap 2):** Workers & Pages → **Overview** menampilkan
   grafik request harian semua Worker; klik nama Worker → tab **Metrics** untuk detail.
3. **Ringkasan akun:** klik ikon akun di kanan atas → **Billing** → **Billable Usage**
   (di paket Free semuanya Rp0; halaman ini menunjukkan seberapa dekat dengan batas).

Kalau suatu hari batas harian tercapai, Worker berhenti sampai besok — tidak ada
tagihan otomatis di paket Free.
