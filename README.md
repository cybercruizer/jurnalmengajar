# JurnalKu SMK 🏫

Aplikasi manajemen jurnal mengajar harian, presensi siswa, dan rekapitulasi data kelas untuk SMK/Sekolah Swasta. JurnalKu didesain modern, responsif, dan mudah digunakan baik oleh Siswa (Ketua Kelas), Guru (Tenaga Pendidik), maupun Admin Sekolah.

---

## 🛠️ Fitur Utama
- **Sistem Autentikasi Multi-Role**: Dukungan login terpisah untuk Siswa (Ketua Kelas), Guru Pengampu, dan Administrator Sekolah.
- **Konfigurasi Lingkungan yang Aman**: Setup melalui `.env` saja, dengan integrasi ORM berbasis produksi untuk keamanan pengelolaan skema database luring maupun daring.
- **Dukungan Kode Guru**: Fleksibel untuk sekolah swasta yang tidak menggunakan NIP (Nomor Induk Pegawai), melainkan Kode Guru unik.
- **Import Data Massal via CSV**: Memudahkan pendaftaran massal siswa, guru pengampu, serta mata pelajaran lengkap dengan petunjuk format kolom yang presisi.
- **Cetak Laporan Siap Pakai**: Ekspor laporan harian, mingguan, maupun bulanan ke dalam format cetak fisik/PDF resmi lengkap dengan tanda tangan Kepala Sekolah.

---

## 📋 Kebutuhan Sistem
Sebelum memulai instalasi di lingkungan produksi (Live Production), pastikan server Anda memiliki komponen berikut:
* **Node.js** v18.0 atau versi yang lebih baru.
* **NPM** atau **Yarn** sebagai package manager.
* **Database (Opsional)**: MySQL (Aplikasi juga mendukung fallback menggunakan *Browser Local Storage* jika tidak ingin menggunakan database server fisik).

---

## 🚀 Petunjuk Instalasi Live Production

Ikuti langkah-langkah di bawah ini untuk memasang JurnalKu SMK pada server VPS, Cloud Run, atau hosting Node.js pilihan Anda:

### 1. Persiapan Kode Sumber
Unggah file kode sumber ke server Anda atau clone menggunakan Git:
```bash
git clone <repository-url>
cd jurnalku-smk
```

### 2. Konfigurasi Environment Variables (`.env`)
Salin file `.env.example` menjadi `.env` untuk konfigurasi produksi:
```bash
cp .env.example .env
```

Buka file `.env` tersebut dan sesuaikan konfigurasi dasar Anda:
```env
# URL Utama Aplikasi (Diperlukan untuk callback & asset routing)
APP_URL="https://jurnal.sekolahanda.sch.id"

# Konfigurasi Database (Tipe database: mysql / local_storage)
DB_TYPE="mysql"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="your-strong-password"
DB_NAME="jurnalku_smk"
```
> **Catatan Penting**: 
> Konfigurasi database sekarang dilakukan murni melalui file `.env`. Fitur Wizard Instalasi telah dihilangkan untuk menjaga keamanan lingkungan produksi. Pastikan Anda telah mengisi kredensial database MySQL dengan benar sebelum menjalankan aplikasi.

### 3. Migrasi Struktur Database (Production-Ready)
Aplikasi ini menggunakan `drizzle-orm` untuk manajemen skema database. Setelah mengkonfigurasi file `.env` dengan kredensial MySQL yang valid, jalankan perintah migrasi untuk membangun tabel-tabel di database Anda:

```bash
npm run db:push
```

**Alternatif Migrasi Database (Jika `npm run db:push` bermasalah)**
Jika Anda mendapati banyak masalah/kegagalan saat melakukan `db:push`, Anda dapat mengeksekusi *raw* SQL command berikut langsung di antarmuka database management Anda (seperti phpMyAdmin, DBeaver, dll) atau Anda bisa menemukannya di berkas `database.sql`:

```sql
CREATE TABLE `users` (
  `id` varchar(36) PRIMARY KEY,
  `username` varchar(50) NOT NULL UNIQUE,
  `role` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reference_id` varchar(36)
);

CREATE TABLE `jurusan` (
  `id` varchar(36) PRIMARY KEY,
  `nama` varchar(100) NOT NULL,
  `singkatan` varchar(20) NOT NULL
);

CREATE TABLE `mapel` (
  `id` varchar(36) PRIMARY KEY,
  `kode` varchar(50) NOT NULL UNIQUE,
  `nama` varchar(100) NOT NULL
);

CREATE TABLE `kelas` (
  `id` varchar(36) PRIMARY KEY,
  `nama` varchar(50) NOT NULL,
  `jurusan_id` varchar(36) NOT NULL,
  FOREIGN KEY (`jurusan_id`) REFERENCES `jurusan`(`id`) ON DELETE CASCADE
);

CREATE TABLE `siswa` (
  `id` varchar(36) PRIMARY KEY,
  `nama` varchar(100) NOT NULL,
  `nis` varchar(50) NOT NULL UNIQUE,
  `kelas_id` varchar(36) NOT NULL,
  `is_ketua_kelas` boolean NOT NULL DEFAULT FALSE,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE CASCADE
);

CREATE TABLE `guru` (
  `id` varchar(36) PRIMARY KEY,
  `nama` varchar(100) NOT NULL,
  `kode_guru` varchar(50) NOT NULL UNIQUE
);

CREATE TABLE `guru_mengampu` (
  `id` varchar(36) PRIMARY KEY,
  `guru_id` varchar(36) NOT NULL,
  `mapel_id` varchar(36) NOT NULL,
  `kelas_id` varchar(36) NOT NULL,
  FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE CASCADE
);

CREATE TABLE `jurnal` (
  `id` varchar(36) PRIMARY KEY,
  `hari` varchar(20) NOT NULL,
  `tanggal` varchar(20) NOT NULL,
  `jam_ke` varchar(20) NOT NULL,
  `kelas_id` varchar(36) NOT NULL,
  `mapel_id` varchar(36) NOT NULL,
  `guru_id` varchar(36) NOT NULL,
  `status_kehadiran` varchar(20) NOT NULL,
  `catatan` text NOT NULL,
  `diinput_oleh` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mapel_id`) REFERENCES `mapel`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON DELETE CASCADE
);

CREATE TABLE `sekolah` (
  `id` varchar(36) PRIMARY KEY,
  `nama` varchar(150) NOT NULL,
  `npsn` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `kepala_sekolah` varchar(100) NOT NULL,
  `nip_kepala_sekolah` varchar(50) NOT NULL,
  `website` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL
);
```

Atau jika Anda ingin melakukan seed data awal (opsional):
```bash
npm run db:seed
```

### 4. Pemasangan Dependensi
Pasang semua paket pustaka yang dibutuhkan oleh sistem:
```bash
npm install
```

### 4. Build untuk Production
Kompilasi komponen frontend dan bundel server backend ke dalam folder distribusi (`dist/`) menggunakan perintah build produksi:
```bash
npm run build
```
Perintah di atas akan melakukan compile aset client-side sekaligus membundel file server backend (`server.ts`) menjadi format CommonJS mandiri di `dist/server.cjs` menggunakan esbuild.

### 5. Jalankan Aplikasi
Jalankan aplikasi di mode production:
```bash
npm start
```
Aplikasi secara default akan berjalan di port **3000** dan mengikat ke host `0.0.0.0` sehingga aman diakses dari reverse proxy luar (seperti Nginx atau Cloudflare).

---

## 🔒 Konfigurasi Keamanan Tambahan (Nginx Reverse Proxy)
Disarankan untuk membungkus aplikasi dengan Nginx sebagai reverse proxy dan mengaktifkan SSL (HTTPS). Contoh konfigurasi block Nginx:

```nginx
server {
    listen 80;
    server_name jurnal.sekolahanda.sch.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name jurnal.sekolahanda.sch.id;

    ssl_certificate /etc/letsencrypt/live/jurnal.sekolahanda.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jurnal.sekolahanda.sch.id/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📂 Format Import File CSV Massal

Saat masuk ke Panel Admin, Anda dapat mengunggah file CSV secara massal untuk mempercepat pengisian data awal sekolah:

### A. Mata Pelajaran (Mapel)
- **Nama Header Kolom**: `kode,nama`
- **Contoh baris**:
  ```csv
  kode,nama
  RPL-A1,Pemrograman Web Dasar
  COMMON-4,Bahasa Inggris Bisnis
  ```

### B. Tenaga Guru Pengampu
- **Nama Header Kolom**: `kode,nama`
- **Contoh baris**:
  ```csv
  kode,nama
  KGR-009,Drs. H. Ahmad Dahlan, M.Ag.
  KGR-010,Siti Zubaidah, S.Pd.
  ```
  *(Sistem akan otomatis membuat akun login guru dengan username unik & password default `guru123`)*

### C. Siswa & Kelas
- **Nama Header Kolom**: `nis,nama,kelas,is_ketua`
- **Contoh baris**:
  ```csv
  nis,nama,kelas,is_ketua
  12499,Rizky Pratama,XI RPL 1,false
  12501,M. Syahputra,XI RPL 1,true
  ```
  *(Jika `is_ketua` diset `true`, sistem otomatis membukakan akun login ketua kelas dengan password default `siswa123` untuk otorisasi pengisian jurnal)*

---

*Hak Cipta © SMK / Sekolah Swasta Partner - Dikembangkan untuk efisiensi administrasi sekolah.*
