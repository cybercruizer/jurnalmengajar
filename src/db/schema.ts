import { mysqlTable, text, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 100 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull(), // admin, guru, siswa
  name: varchar("name", { length: 150 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  referenceId: varchar("reference_id", { length: 100 }),
});

export const jurusan = mysqlTable("jurusan", {
  id: varchar("id", { length: 100 }).primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  singkatan: varchar("singkatan", { length: 50 }).notNull(),
});

export const mapel = mysqlTable("mapel", {
  id: varchar("id", { length: 100 }).primaryKey(),
  kode: varchar("kode", { length: 100 }).notNull().unique(),
  nama: varchar("nama", { length: 150 }).notNull(),
});

export const kelas = mysqlTable("kelas", {
  id: varchar("id", { length: 100 }).primaryKey(),
  nama: varchar("nama", { length: 100 }).notNull(),
  jurusanId: varchar("jurusan_id", { length: 100 }).notNull(),
});

export const siswa = mysqlTable("siswa", {
  id: varchar("id", { length: 100 }).primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  nis: varchar("nis", { length: 100 }).notNull(),
  kelasId: varchar("kelas_id", { length: 100 }).notNull(),
  isKetuaKelas: boolean("is_ketua_kelas").default(false).notNull(),
});

export const guru = mysqlTable("guru", {
  id: varchar("id", { length: 100 }).primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  kodeGuru: varchar("kode_guru", { length: 100 }).notNull().unique(),
});

export const guruMengampu = mysqlTable("guru_mengampu", {
  id: varchar("id", { length: 100 }).primaryKey(),
  guruId: varchar("guru_id", { length: 100 }).notNull(),
  mapelId: varchar("mapel_id", { length: 100 }).notNull(),
  kelasId: varchar("kelas_id", { length: 255 }),
});

export const jurnal = mysqlTable("jurnal", {
  id: varchar("id", { length: 100 }).primaryKey(),
  hari: varchar("hari", { length: 50 }).notNull(),
  tanggal: varchar("tanggal", { length: 50 }).notNull(),
  jamKe: varchar("jam_ke", { length: 100 }).notNull(),
  kelasId: varchar("kelas_id", { length: 100 }).notNull(),
  mapelId: varchar("mapel_id", { length: 100 }).notNull(),
  guruId: text("guru_id").notNull(),
  statusKehadiran: varchar("status_kehadiran", { length: 50 }).notNull(), // hadir, tidak, tugas
  catatan: text("catatan").notNull(),
  diinputOleh: varchar("diinput_oleh", { length: 100 }).notNull(), // references siswaId or username
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sekolah = mysqlTable("sekolah", {
  id: varchar("id", { length: 100 }).primaryKey(),
  nama: varchar("nama", { length: 200 }).notNull(),
  npsn: varchar("npsn", { length: 50 }).notNull(),
  alamat: text("alamat").notNull(),
  kepalaSekolah: varchar("kepala_sekolah", { length: 150 }).notNull(),
  nbmKepalaSekolah: varchar("nbm_kepala_sekolah", { length: 50 }).notNull(),
  wakaKurikulum: varchar("waka_kurikulum", { length: 150 }).notNull(),
  nbmWakaKurikulum: varchar("nbm_waka_kurikulum", { length: 50 }).notNull(),
  website: varchar("website", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  logoUrl: text("logo_url"),
  namaAplikasi: varchar("nama_aplikasi", { length: 150 }),
});
