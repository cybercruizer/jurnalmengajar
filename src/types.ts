export type UserRole = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  password?: string;
  referenceId?: string; // Links to guruId or siswaId
}

export interface Jurusan {
  id: string;
  nama: string; // e.g. Rekayasa Perangkat Lunak
  singkatan: string; // e.g. RPL
}

export interface Mapel {
  id: string;
  kode: string; // e.g. RPL-01
  nama: string; // e.g. Pemrograman Web
}

export interface Kelas {
  id: string;
  nama: string; // e.g. XI RPL 1
  jurusanId: string;
}

export interface Siswa {
  id: string;
  nama: string;
  nis: string;
  kelasId: string;
  isKetuaKelas: boolean;
}

export interface Guru {
  id: string;
  nama: string;
  kodeGuru: string;
}

export interface GuruMengampu {
  id: string;
  guruId: string;
  mapelId: string;
  kelasId: string;
}

export interface Jurnal {
  id: string;
  hari: string; // e.g. Senin
  tanggal: string; // YYYY-MM-DD
  jamKe: string; // e.g. "1-2" or "3-4"
  kelasId: string;
  mapelId: string;
  guruId: string;
  statusKehadiran: 'hadir' | 'tidak' | 'tugas';
  catatan: string; // e.g. "Membahas bab 2 OOP"
  diinputOleh: string; // Ref to siswaId (Ketua Kelas)
  createdAt: string;
}

export interface Sekolah {
  id?: string;
  nama: string;
  npsn: string;
  alamat: string;
  kepalaSekolah: string;
  nbmKepalaSekolah: string;
  wakaKurikulum: string;
  nbmWakaKurikulum: string;
  website: string;
  email: string;
  logoUrl?: string;
}
