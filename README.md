# Jadwal Kuliah Dzaky

Website jadwal kuliah pribadi untuk melihat jadwal hari ini, menghitung waktu menuju kuliah berikutnya, dan mengubah jadwal kapan saja. Data tersimpan di browser lewat `localStorage`, jadi tidak perlu database untuk versi awal.

Jadwal awal:

- Selasa — Sistem Multimedia, 14:40–16:20, SportCenter
- Rabu — Technopreneurship, 10:30–12:10, GS4A
- Sabtu — Sistem Keamanan Jaringan, 10:30–12:10, GS4A
- Sabtu — Network Troubleshooting, 12:10–13:50, GS4C

Jadwal praktikum sengaja kosong sampai kampus mengirimkannya. Tambahkan lewat menu Praktikum saat datanya sudah ada.

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:43123](http://localhost:43123).

Perintah lain:

```bash
npm run build
npm run preview
```

## Struktur

```text
src/
  components/
    dashboard/        Dashboard, statistik, countdown
    layout/           Sidebar (laptop) dan navbar bawah (HP)
    praktikum/        Halaman jadwal praktikum
    reminder/         Pengingat dan permintaan izin notifikasi
    schedule/         Kartu, form, daftar, kalender, detail
    settings/         Notifikasi, backup, impor, PDF
    ui/               Komponen antarmuka
  context/            State jadwal dan navigasi
  data/seed.ts        Jadwal awal
  lib/
    schedule.ts       Waktu, status, bentrok, filter
    storage.ts        localStorage dan cadangan JSON
    notify.ts         Browser Notification dan suara
    pdf.ts            Ekspor PDF
  types/schedule.ts   Bentuk data
```

Lapisan penyimpanan ada di `src/lib/storage.ts`. UI tidak menulis `localStorage` langsung untuk jadwal. Adapter ini bisa diganti Supabase, Firebase, atau API MySQL nanti tanpa mengubah halaman.

## Cara memakai

### Menambah jadwal

1. Buka Dashboard lalu klik **Tambah Jadwal**, atau menu **Tambah**.
2. Isi nama mata kuliah, jenis, hari, jam mulai, dan jam selesai.
3. Ruangan, dosen, dan catatan boleh dikosongkan.
4. Klik **Simpan**. Jadwal langsung muncul di Dashboard dan Jadwal Mingguan.

Untuk praktikum, buka menu **Praktikum** lalu **Tambah Praktikum**. Isi nama praktikum, mata kuliah, hari, jam, dan laboratorium.

### Mengubah atau menghapus

Klik kartu jadwal untuk melihat detail. Gunakan **Edit** atau **Hapus**. Sebelum terhapus, website menanyakan: "Apakah kamu yakin ingin menghapus jadwal ini?"

Jika jam bentrok dengan jadwal lain di hari yang sama, muncul peringatan. Kamu bisa membatalkan atau memilih **Simpan Tetap**.

### Pengingat

Saat pertama dibuka, pilih **Aktifkan Notifikasi** atau **Nanti Saja**.

Pengingat bawaan: **15 menit** sebelum jadwal. Ubah di **Pengaturan** menjadi 5 menit, 10 menit, 15 menit, 30 menit, atau 1 jam. Suara bisa dimatikan.

Notifikasi browser hanya muncul jika izin diberikan dan halaman tetap terbuka, atau browser mengizinkan website berjalan di latar belakang. Jika izin ditolak atau browser tidak mendukung, pengingat tetap tampil di dalam website selama halaman terbuka. Menutup tab menghentikan pengingat.

### Cadangan

Di **Pengaturan**:

- **Backup Jadwal** atau **Export JSON** mengunduh file cadangan.
- **Restore Jadwal** mengganti seluruh jadwal dengan isi file.
- **Import Jadwal** menambahkan jadwal dari file tanpa menghapus yang sudah ada.
- **Export ke PDF** mengunduh ringkasan mingguan.

Simpan file JSON sebelum membersihkan data browser. Jika kunci penyimpanan dihapus seluruhnya, website memuat lagi jadwal awal. Jika semua jadwal dihapus dari dalam website, daftar tetap kosong.
