# Black Bird

Buku kas pribadi untuk mencatat pemasukan dan pengeluaran. Tampilannya hitam-putih, bisa disesuaikan, dan buku yang sama terbuka di setiap perangkat yang memakai tautan ini.

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://127.0.0.1:43123](http://127.0.0.1:43123).

Perintah lain:

```bash
npm run build
npm run preview
npm run lint
```

## Yang bisa dilakukan

- Catat, ubah, dan hapus pemasukan atau pengeluaran: nominal, tanggal, kategori, dan catatan.
- Lihat total pemasukan, pengeluaran, saldo, dan grafik bulanan di dasbor.
- Cari transaksi, lalu saring menurut tanggal, kategori, dan jenis.
- Baca laporan bulan yang dipilih dan unduh CSV.
- Ganti tema terang atau gelap, warna aksen, ukuran teks, serta tampilan tabel atau kartu.

Nominal memakai rupiah penuh tanpa sen. Penghapusan selalu minta konfirmasi.

## Tautan GitHub Pages

Situs publiknya ada di [https://zanalpha.github.io/black-bird/](https://zanalpha.github.io/black-bird/).

Setiap dorongan ke branch `main` di GitHub menjalankan `.github/workflows/pages.yml`: menginstal, membangun folder `dist`, lalu menerbitkannya lewat GitHub Pages. Aset memakai path relatif, jadi tautan proyek itu tetap benar.

## Deploy ke Render

Blueprint ada di `render.yaml`: situs statis, perintah build `npm ci && npm run build`, folder publik `dist`, Node 22. Buat Static Site atau Blueprint baru di Render dari repositori GitHub atau GitLab, lalu pakai file itu.

## Data

Transaksi disimpan di satu buku bersama, bukan di tiap perangkat. HP dan laptop yang membuka tautan yang sama melihat catatan yang sama, biasanya dalam beberapa detik. Salinan buku juga ada di [zanalpha/black-bird-book](https://github.com/zanalpha/black-bird-book), berkas `ledger.json`.

Preferensi tampilan tetap di perangkat masing-masing, kunci `blackbird.preferences.v1`.

Siapa pun yang membuka tautan itu dapat melihat dan mengubah transaksi di dalamnya.
