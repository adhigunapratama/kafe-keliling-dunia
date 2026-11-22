# Server ruangan Kafe Keliling Dunia

Cloudflare Worker + Durable Object (`KafeRoom`) yang menghubungkan HP Koki dan tablet
Pelayan lewat kode ruangan 4 angka. Cara memasang: lihat `DEPLOY.md` Bagian 2.

```bash
npm install
npx wrangler dev --port 8787     # server lokal
node test/two-clients.mjs        # uji dua klien
```

Di dasbor Cloudflare (Workers Builds): Root directory `worker`, Deploy command `npx wrangler deploy`,
Production branch = branch tahap yang sedang diuji (mis. `tahap-2`).
