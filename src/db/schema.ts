import { mysqlTable, text, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull(), // admin, guru, siswa
  name: varchar("name", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  referenceId: varchar("reference_id", { length: 36 }),
});

export const jurusan = mysqlTable("jurusan", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nama: varchar("nama", { length: 100 }).notNull(),
  singkatan: varchar("singkatan", { length: 20 }).notNull(),
});

export const mapel = mysqlTable("mapel", {
  id: varchar("id", { length: 36 }).primaryKey(),
  kode: varchar("kode", { length: 50 }).notNull().unique(),
  nama: varchar("nama", { length: 100 }).notNull(),
});

export const kelas = mysqlTable("kelas", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nama: varchar("nama", { length: 50 }).notNull(),
  jurusanId: varchar("jurusan_id", { length: 36 }).notNull().references(() => jurusan.id, { onDelete: "cascade" }),
});

export const siswa = mysqlTable("siswa", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nama: varchar("nama", { length: 100 }).notNull(),
  nis: varchar("nis", { length: 50 }).notNull().unique(),
  kelasId: varchar("kelas_id", { length: 36 }).notNull().references(() => kelas.id, { onDelete: "cascade" }),
  isKetuaKelas: boolean("is_ketua_kelas").default(false).notNull(),
});

export const guru = mysqlTable("guru", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nama: varchar("nama", { length: 100 }).notNull(),
  kodeGuru: varchar("kode_guru", { length: 50 }).notNull().unique(),
});

export const guruMengampu = mysqlTable("guru_mengampu", {
  id: varchar("id", { length: 36 }).primaryKey(),
  guruId: varchar("guru_id", { length: 36 }).notNull().references(() => guru.id, { onDelete: "cascade" }),
  mapelId: varchar("mapel_id", { length: 36 }).notNull().references(() => mapel.id, { onDelete: "cascade" }),
  kelasId: varchar("kelas_id", { length: 36 }).notNull().references(() => kelas.id, { onDelete: "cascade" }),
});

export const jurnal = mysqlTable("jurnal", {
  id: varchar("id", { length: 36 }).primaryKey(),
  hari: varchar("hari", { length: 20 }).notNull(),
  tanggal: varchar("tanggal", { length: 20 }).notNull(),
  jamKe: varchar("jam_ke", { length: 20 }).notNull(),
  kelasId: varchar("kelas_id", { length: 36 }).notNull().references(() => kelas.id, { onDelete: "cascade" }),
  mapelId: varchar("mapel_id", { length: 36 }).notNull().references(() => mapel.id, { onDelete: "cascade" }),
  guruId: varchar("guru_id", { length: 36 }).notNull().references(() => guru.id, { onDelete: "cascade" }),
  statusKehadiran: varchar("status_kehadiran", { length: 20 }).notNull(), // hadir, tidak, tugas
  catatan: text("catatan").notNull(),
  diinputOleh: varchar("diinput_oleh", { length: 36 }).notNull(), // references siswaId
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sekolah = mysqlTable("sekolah", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nama: varchar("nama", { length: 150 }).notNull(),
  npsn: varchar("npsn", { length: 50 }).notNull(),
  alamat: text("alamat").notNull(),
  kepalaSekolah: varchar("kepala_sekolah", { length: 100 }).notNull(),
  nbmKepalaSekolah: varchar("nbm_kepala_sekolah", { length: 50 }).notNull(),
  wakaKurikulum: varchar("waka_kurikulum", { length: 100 }).notNull(),
  nbmWakaKurikulum: varchar("nbm_waka_kurikulum", { length: 50 }).notNull(),
  website: varchar("website", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  logoUrl: text("logo_url"),
});
