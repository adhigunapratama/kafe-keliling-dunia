# Cara Memasang Kafe Keliling Dunia di Cloudflare (gratis)

Panduan ini untuk orang awam. Tidak perlu mengetik perintah apa pun: semua lewat klik
di situs Cloudflare. Game akan otomatis dibangun ulang setiap kali ada perubahan
baru di GitHub.

Ada dua bagian:

1. **Game (PWA) → Cloudflare Pages** — bagian ini sudah bisa dipakai sejak Tahap 1.
2. **Server ruangan (main berdua di 2 perangkat) → Cloudflare Worker** — *menyusul di Tahap 2*.

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

Buka **Environment variables (advanced)** — boleh dilewati di Tahap 1. Mulai Tahap 2
di sini akan diisi `VITE_ROOM_SERVER_URL` (lihat Bagian 2).

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

## Bagian 2 — Server ruangan (Cloudflare Worker + Durable Object)

*Akan dilengkapi di Tahap 2* (main berdua di dua perangkat dengan kode ruangan 4 angka).
Ringkasnya nanti: membuat Worker dari repo yang sama dengan **root directory
`worker/`**, lalu mengisi variabel build `VITE_ROOM_SERVER_URL` di proyek Pages.

---

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
