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
