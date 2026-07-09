import { Sekolah, Jurusan, Mapel, Kelas, Siswa, Guru, GuruMengampu, Jurnal, User } from './types';

export const initialSekolah: Sekolah = {
  nama: 'SMK Muhammadiyah Mungkid',
  npsn: '20338402',
  alamat: 'Jl. Letnan Sulistyo No.1, Mungkid, Magelang, Jawa Tengah',
  kepalaSekolah: 'Drs. H. Sukardiyono, M.Pd.',
  nbmKepalaSekolah: '1098475',
  wakaKurikulum: 'Sriyono, S.Pd., M.T.',
  nbmWakaKurikulum: '1152643',
  website: 'www.smkmuhmungkid.sch.id',
  email: 'info@smkmuhmungkid.sch.id'
};

export const initialJurusan: Jurusan[] = [
  { id: 'jur-1', nama: 'Rekayasa Perangkat Lunak', singkatan: 'RPL' },
  { id: 'jur-2', nama: 'Teknik Komputer & Jaringan', singkatan: 'TKJ' },
  { id: 'jur-3', nama: 'Teknik Kendaraan Ringan Otomotif', singkatan: 'TKRO' }
];

export const initialMapel: Mapel[] = [
  { id: 'mapel-1', kode: 'RPL-A1', nama: 'Pemrograman Web & Perangkat Bergerak' },
  { id: 'mapel-2', kode: 'RPL-B2', nama: 'Basis Data' },
  { id: 'mapel-3', kode: 'TKJ-A1', nama: 'Administrasi Sistem Jaringan' },
  { id: 'mapel-4', kode: 'COMMON-1', nama: 'Pendidikan Agama & Budi Pekerti' },
  { id: 'mapel-5', kode: 'COMMON-2', nama: 'Bahasa Indonesia' },
  { id: 'mapel-6', kode: 'COMMON-3', nama: 'Matematika' }
];

export const initialKelas: Kelas[] = [
  { id: 'kls-1', nama: 'XI RPL 1', jurusanId: 'jur-1' },
  { id: 'kls-2', nama: 'XI RPL 2', jurusanId: 'jur-1' },
  { id: 'kls-3', nama: 'XI TKJ 1', jurusanId: 'jur-2' },
  { id: 'kls-4', nama: 'XI TKJ 2', jurusanId: 'jur-2' }
];

export const initialGuru: Guru[] = [
  { id: 'gur-1', nama: 'Drs. Budi Santoso, M.Pd.', kodeGuru: 'KGR-001' },
  { id: 'gur-2', nama: 'Siti Aminah, S.Pd.', kodeGuru: 'KGR-002' },
  { id: 'gur-3', nama: 'Eko Prasetyo, M.T.', kodeGuru: 'KGR-003' },
  { id: 'gur-4', nama: 'Rini Astuti, S.Hum.', kodeGuru: 'KGR-004' }
];

export const initialSiswa: Siswa[] = [
  // Class XI RPL 1
  { id: 'sis-1', nama: 'Muhammad Farhan', nis: '12401', kelasId: 'kls-1', isKetuaKelas: true },
  { id: 'sis-2', nama: 'Aditya Pratama', nis: '12402', kelasId: 'kls-1', isKetuaKelas: false },
  { id: 'sis-3', nama: 'Anissa Rahmawati', nis: '12403', kelasId: 'kls-1', isKetuaKelas: false },
  
  // Class XI RPL 2
  { id: 'sis-4', nama: 'Bagus Setiawan', nis: '12411', kelasId: 'kls-2', isKetuaKelas: true },
  { id: 'sis-5', nama: 'Citra Kirana', nis: '12412', kelasId: 'kls-2', isKetuaKelas: false },
  
  // Class XI TKJ 1
  { id: 'sis-6', nama: 'Dimas Nugroho', nis: '12421', kelasId: 'kls-3', isKetuaKelas: true },
  { id: 'sis-7', nama: 'Elsa Safitri', nis: '12422', kelasId: 'kls-3', isKetuaKelas: false },
  
  // Class XI TKJ 2
  { id: 'sis-8', nama: 'Fajar Hidayat', nis: '12431', kelasId: 'kls-4', isKetuaKelas: true },
  { id: 'sis-9', nama: 'Gita Lestari', nis: '12432', kelasId: 'kls-4', isKetuaKelas: false }
];

export const initialGuruMengampu: GuruMengampu[] = [
  // Budi Santoso teaches Web to XI RPL 1 & 2
  { id: 'amp-1', guruId: 'gur-1', mapelId: 'mapel-1', kelasId: 'kls-1' },
  { id: 'amp-2', guruId: 'gur-1', mapelId: 'mapel-1', kelasId: 'kls-2' },
  
  // Siti Aminah teaches Basis Data to XI RPL 1
  { id: 'amp-3', guruId: 'gur-2', mapelId: 'mapel-2', kelasId: 'kls-1' },
  
  // Eko Prasetyo teaches ASJ to XI TKJ 1 & 2
  { id: 'amp-4', guruId: 'gur-3', mapelId: 'mapel-3', kelasId: 'kls-3' },
  { id: 'amp-5', guruId: 'gur-3', mapelId: 'mapel-3', kelasId: 'kls-4' },
  
  // Rini Astuti teaches Bahasa Indonesia to all classes
  { id: 'amp-6', guruId: 'gur-4', mapelId: 'mapel-5', kelasId: 'kls-1' },
  { id: 'amp-7', guruId: 'gur-4', mapelId: 'mapel-5', kelasId: 'kls-2' },
  { id: 'amp-8', guruId: 'gur-4', mapelId: 'mapel-5', kelasId: 'kls-3' },
  { id: 'amp-9', guruId: 'gur-4', mapelId: 'mapel-5', kelasId: 'kls-4' }
];

export const initialJurnal: Jurnal[] = [
  {
    id: 'jur-j1',
    hari: 'Senin',
    tanggal: '2026-06-15',
    jamKe: '1-2',
    kelasId: 'kls-1',
    mapelId: 'mapel-1',
    guruId: 'gur-1',
    statusKehadiran: 'hadir',
    catatan: 'Materi pengenalan Layout Flexbox CSS dan praktikum membuat navigasi website responsive.',
    diinputOleh: 'sis-1',
    createdAt: '2026-06-15T08:30:00.000Z'
  },
  {
    id: 'jur-j2',
    hari: 'Senin',
    tanggal: '2026-06-15',
    jamKe: '3-4',
    kelasId: 'kls-1',
    mapelId: 'mapel-2',
    guruId: 'gur-2',
    statusKehadiran: 'tugas',
    catatan: 'Latihan membuat database perpus, guru berhalangan hadir memberi tugas desain ERD.',
    diinputOleh: 'sis-1',
    createdAt: '2026-06-15T10:15:00.000Z'
  },
  {
    id: 'jur-j3',
    hari: 'Selasa',
    tanggal: '2026-06-16',
    jamKe: '1-2',
    kelasId: 'kls-1',
    mapelId: 'mapel-5',
    guruId: 'gur-4',
    statusKehadiran: 'hadir',
    catatan: 'Materi teks negosiasi dan simulasi pidato resmi di kelas secara bergantian.',
    diinputOleh: 'sis-1',
    createdAt: '2026-06-16T08:45:00.000Z'
  },
  {
    id: 'jur-j4',
    hari: 'Selasa',
    tanggal: '2026-06-16',
    jamKe: '1-2',
    kelasId: 'kls-4',
    mapelId: 'mapel-3',
    guruId: 'gur-3',
    statusKehadiran: 'hadir',
    catatan: 'Praktik konfigurasi server DNS pada OS Linux Debian 11.',
    diinputOleh: 'sis-8',
    createdAt: '2026-06-16T08:50:00.000Z'
  },
  {
    id: 'jur-j5',
    hari: 'Rabu',
    tanggal: '2026-06-17',
    jamKe: '5-6',
    kelasId: 'kls-1',
    mapelId: 'mapel-1',
    guruId: 'gur-1',
    statusKehadiran: 'hadir',
    catatan: 'Melanjutkan materi Flexbox CSS ke Grid CSS dan cara implementasikannya pada dashboard.',
    diinputOleh: 'sis-1',
    createdAt: '2026-06-17T11:20:00.000Z'
  },
  {
    id: 'jur-j6',
    hari: 'Kamis',
    tanggal: '2026-06-18',
    jamKe: '1-2',
    kelasId: 'kls-1',
    mapelId: 'mapel-2',
    guruId: 'gur-2',
    statusKehadiran: 'hadir',
    catatan: 'Kuis Struktur Query SQL JOIN (Inner, Left, Right).',
    diinputOleh: 'sis-1',
    createdAt: '2026-06-18T08:40:00.000Z'
  },
  {
    id: 'jur-j7',
    hari: 'Kamis',
    tanggal: '2026-06-18',
    jamKe: '3-4',
    kelasId: 'kls-1',
    mapelId: 'mapel-5',
    guruId: 'gur-4',
    statusKehadiran: 'tidak',
    catatan: 'Guru tidak hadir tanpa keterangan/izin tertulis, kelas kosong mendengarkan materi mandiri.',
    diinputOleh: 'sis-1',
    createdAt: '2026-06-18T10:10:00.000Z'
  }
];

export const initialUsers: User[] = [
  // Admin credentials: admin / admin123
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator Utama (Tata Usaha/Kurikulum)'
  },
  // Teacher credentials: guru / guru123, linked to Drs. Budi Santoso, M.Pd.
  {
    id: 'user-guru',
    username: 'guru',
    password: 'guru123',
    role: 'guru',
    name: 'Drs. Budi Santoso, M.Pd.',
    referenceId: 'gur-1'
  },
  {
    id: 'user-guru-2',
    username: 'siti',
    password: 'guru123',
    role: 'guru',
    name: 'Siti Aminah, S.Pd.',
    referenceId: 'gur-2'
  },
  // Student/Ketua Kelas credentials: siswa / siswa123, linked to Muhammad Farhan (XI RPL 1)
  {
    id: 'user-siswa',
    username: 'siswa',
    password: 'siswa123',
    role: 'siswa',
    name: 'Muhammad Farhan',
    referenceId: 'sis-1'
  },
  // Student/Ketua Kelas credentials: siswa2 / siswa123, linked to Fajar Hidayat (XI TKJ 2)
  {
    id: 'user-siswa-2',
    username: 'siswa2',
    password: 'siswa123',
    role: 'siswa',
    name: 'Fajar Hidayat',
    referenceId: 'sis-8'
  }
];
