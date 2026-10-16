# Black Bird

Buku kas pribadi untuk mencatat pemasukan dan pengeluaran. Tampilannya hitam-putih, bisa disesuaikan, dan datanya tersimpan di browser.

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

## Data

Transaksi disimpan di `localStorage` peramban, kunci `blackbird.transactions.v1`. Preferensi tampilan memakai `blackbird.preferences.v1`. Tidak ada akun dan tidak ada server. Menghapus data situs pada browser juga menghapus buku kas.
