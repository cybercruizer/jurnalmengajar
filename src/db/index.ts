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
        \`id\` varchar(36) PRIMARY KEY,
        \`guru_id\` varchar(36) NOT NULL,
        \`mapel_id\` varchar(36) NOT NULL,
        \`kelas_id\` varchar(36) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`jurnal\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`hari\` varchar(20) NOT NULL,
        \`tanggal\` varchar(20) NOT NULL,
        \`jam_ke\` varchar(20) NOT NULL,
        \`kelas_id\` varchar(36) NOT NULL,
        \`mapel_id\` varchar(36) NOT NULL,
        \`guru_id\` varchar(36) NOT NULL,
        \`status_kehadiran\` varchar(20) NOT NULL,
        \`catatan\` text NOT NULL,
        \`diinput_oleh\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS \`sekolah\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`nama\` varchar(150) NOT NULL,
        \`npsn\` varchar(50) NOT NULL,
        \`alamat\` text NOT NULL,
        \`kepala_sekolah\` varchar(100) NOT NULL,
        \`nbm_kepala_sekolah\` varchar(50) NOT NULL,
        \`waka_kurikulum\` varchar(100) NOT NULL,
        \`nbm_waka_kurikulum\` varchar(50) NOT NULL,
        \`website\` varchar(100) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`logo_url\` text
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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
