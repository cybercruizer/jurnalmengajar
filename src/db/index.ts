import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

let pool: mysql.Pool | null = null;
let db: any = null;
let tablesInitialized = false;

export function resetDbConnection() {
  if (pool) {
    try {
      pool.end();
    } catch (e) {
      // Ignore pool closing errors
    }
  }
  pool = null;
  db = null;
  tablesInitialized = false;
}

export async function getPool() {
  if (!pool) await getDb();
  return pool as mysql.Pool;
}

export async function ensureTablesExist(poolConn: mysql.Pool) {
  if (tablesInitialized) return;
  try {
    await poolConn.query("SET FOREIGN_KEY_CHECKS=0");

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`username\` varchar(50) NOT NULL UNIQUE,
        \`role\` varchar(20) NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`reference_id\` varchar(36)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`jurusan\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`nama\` varchar(100) NOT NULL,
        \`singkatan\` varchar(20) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`mapel\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`kode\` varchar(50) NOT NULL UNIQUE,
        \`nama\` varchar(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`kelas\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`nama\` varchar(50) NOT NULL,
        \`jurusan_id\` varchar(36) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`siswa\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`nama\` varchar(100) NOT NULL,
        \`nis\` varchar(50) NOT NULL UNIQUE,
        \`kelas_id\` varchar(36) NOT NULL,
        \`is_ketua_kelas\` boolean NOT NULL DEFAULT FALSE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`guru\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`nama\` varchar(100) NOT NULL,
        \`kode_guru\` varchar(50) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`guru_mengampu\` (
        \`id\` varchar(100) PRIMARY KEY,
        \`guru_id\` varchar(100) NOT NULL,
        \`mapel_id\` varchar(100) NOT NULL,
        \`kelas_id\` varchar(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`jurnal\` (
        \`id\` varchar(100) PRIMARY KEY,
        \`hari\` varchar(50) NOT NULL,
        \`tanggal\` varchar(50) NOT NULL,
        \`jam_ke\` varchar(100) NOT NULL,
        \`kelas_id\` varchar(100) NOT NULL,
        \`mapel_id\` varchar(100) NOT NULL,
        \`guru_id\` text NOT NULL,
        \`status_kehadiran\` varchar(50) NOT NULL,
        \`catatan\` text NOT NULL,
        \`diinput_oleh\` varchar(100) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`sekolah\` (
        \`id\` varchar(100) PRIMARY KEY,
        \`nama\` varchar(200) NOT NULL,
        \`npsn\` varchar(50) NOT NULL,
        \`alamat\` text NOT NULL,
        \`kepala_sekolah\` varchar(150) NOT NULL,
        \`nbm_kepala_sekolah\` varchar(50) NOT NULL,
        \`waka_kurikulum\` varchar(150) NOT NULL,
        \`nbm_waka_kurikulum\` varchar(50) NOT NULL,
        \`website\` varchar(150) NOT NULL,
        \`email\` varchar(150) NOT NULL,
        \`logo_url\` longtext,
        \`nama_aplikasi\` varchar(150)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await poolConn.query("ALTER TABLE `sekolah` ADD COLUMN `nama_aplikasi` varchar(150)");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `nama` VARCHAR(200) NOT NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `logo_url` LONGTEXT NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `nama_aplikasi` VARCHAR(150) NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `kepala_sekolah` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `waka_kurikulum` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `website` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `sekolah` MODIFY COLUMN `email` VARCHAR(150) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `guru_id` TEXT NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `hari` VARCHAR(50) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `tanggal` VARCHAR(50) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `jam_ke` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `kelas_id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `mapel_id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `status_kehadiran` VARCHAR(50) NOT NULL");
      await poolConn.query("ALTER TABLE `jurnal` MODIFY COLUMN `diinput_oleh` VARCHAR(100) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `siswa` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `siswa` MODIFY COLUMN `nama` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `siswa` MODIFY COLUMN `nis` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `siswa` MODIFY COLUMN `kelas_id` VARCHAR(100) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `users` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `users` MODIFY COLUMN `username` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `users` MODIFY COLUMN `reference_id` VARCHAR(100) NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `kelas` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `kelas` MODIFY COLUMN `nama` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `kelas` MODIFY COLUMN `jurusan_id` VARCHAR(100) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `guru` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `guru` MODIFY COLUMN `nama` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `guru` MODIFY COLUMN `kode_guru` VARCHAR(100) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `jurusan` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `jurusan` MODIFY COLUMN `nama` VARCHAR(150) NOT NULL");
      await poolConn.query("ALTER TABLE `jurusan` MODIFY COLUMN `singkatan` VARCHAR(50) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `mapel` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `mapel` MODIFY COLUMN `kode` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `mapel` MODIFY COLUMN `nama` VARCHAR(150) NOT NULL");
    } catch (e) {}

    try {
      await poolConn.query("ALTER TABLE `guru_mengampu` MODIFY COLUMN `kelas_id` VARCHAR(255) NULL");
      await poolConn.query("ALTER TABLE `guru_mengampu` MODIFY COLUMN `guru_id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `guru_mengampu` MODIFY COLUMN `mapel_id` VARCHAR(100) NOT NULL");
      await poolConn.query("ALTER TABLE `guru_mengampu` MODIFY COLUMN `id` VARCHAR(100) NOT NULL");
    } catch (e) {}

    await poolConn.query("SET FOREIGN_KEY_CHECKS=1");
    tablesInitialized = true;
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

export async function getDb() {
  if (!db) {
    const dbName = process.env.DB_NAME || "jurnalku_smk";
    try {
      const tempConn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await tempConn.end();
    } catch (dbErr) {
      console.warn("Could not ensure database creation:", dbErr);
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await ensureTablesExist(pool);
    db = drizzle(pool, { mode: 'default', schema });
  }
  return db;
}
