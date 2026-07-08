import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { users, sekolah } from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Seeding database...");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jurnalku_smk",
  });

  const db = drizzle(connection);
  
  try {
    // Check if admin user exists
    const existingAdmins = await db.select().from(users).where(eq(users.role, "admin"));
    
    if (existingAdmins.length === 0) {
      await db.insert(users).values({
        id: "admin-1",
        username: "admin",
        password: "password", // In production, this should be hashed
        name: "Administrator Sekolah",
        role: "admin",
      });
      console.log("Admin user seeded.");
    }

    // Check if sekolah info exists
    const existingSekolah = await db.select().from(sekolah);
    if (existingSekolah.length === 0) {
      await db.insert(sekolah).values({
        id: "sek-1",
        nama: "SMK Negeri 1 Contoh",
        npsn: "12345678",
        alamat: "Jl. Pendidikan No. 1",
        kepalaSekolah: "Dr. Budi Santoso, M.Pd.",
        nipKepalaSekolah: "19700101 200003 1 001",
        website: "https://smkn1contoh.sch.id",
        email: "info@smkn1contoh.sch.id",
      });
      console.log("Sekolah data seeded.");
    }
    
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await connection.end();
  }
}

main();
