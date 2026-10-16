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

## Deploy ke Render

Blueprint ada di `render.yaml`: situs statis, perintah build `npm ci && npm run build`, folder publik `dist`, Node 22. Buat Static Site atau Blueprint baru di Render dari repositori GitHub atau GitLab, lalu pakai file itu.

## Data

Transaksi tersimpan di browser (`blackbird.transactions.v1`) dan disalin ke buku bersama, jadi perangkat lain yang membuka tautan yang sama melihat transaksi yang sama. Preferensi tampilan tetap di perangkat masing-masing, kunci `blackbird.preferences.v1`.

Buka dulu tautan di perangkat yang sudah berisi catatan, supaya catatan itu terunggah. Setelah itu perangkat lain menampilkan buku yang sama. Siapa pun yang membuka tautan itu dapat melihat transaksi di dalamnya.
