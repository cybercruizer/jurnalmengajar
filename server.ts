import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const syncQueues: Record<string, Promise<any>> = {};

  async function runInQueue(table: string, task: () => Promise<any>): Promise<any> {
    const previous = syncQueues[table] || Promise.resolve();
    let resolveNext: any;
    const nextPromise = new Promise((resolve) => {
      resolveNext = resolve;
    });
    syncQueues[table] = nextPromise;

    try {
      await previous;
    } catch (err) {
      // Ignore previous errors to keep queue running
    }

    try {
      const result = await task();
      resolveNext();
      return result;
    } catch (err) {
      resolveNext();
      throw err;
    }
  }

  app.use(express.json());

  // API Route to write to .env
  app.post("/api/save-env", async (req, res) => {
    try {
      const { dbType, host, port, user, password, name } = req.body;
      
      let envContent = "";
      if (fs.existsSync(".env")) {
        envContent = fs.readFileSync(".env", "utf-8");
      } else if (fs.existsSync(".env.example")) {
        envContent = fs.readFileSync(".env.example", "utf-8");
      }

      // Helper function to update or append variable
      const setEnvVar = (content: string, key: string, value: string) => {
        const regex = new RegExp(`^${key}=.*$`, "m");
        const formattedLine = `${key}="${value.replace(/"/g, '\\"')}"`;
        if (regex.test(content)) {
          return content.replace(regex, formattedLine);
        } else {
          return content.trim() + `\n${formattedLine}\n`;
        }
      };

      envContent = setEnvVar(envContent, "DB_TYPE", dbType || "mysql");
      envContent = setEnvVar(envContent, "DB_HOST", host || "localhost");
      envContent = setEnvVar(envContent, "DB_PORT", port || "3306");
      envContent = setEnvVar(envContent, "DB_USER", user || "root");
      envContent = setEnvVar(envContent, "DB_PASSWORD", password || "");
      envContent = setEnvVar(envContent, "DB_NAME", name || "jurnalku_smk");

      fs.writeFileSync(".env", envContent, "utf-8");
      
      // Update process.env so they are immediately available
      process.env.DB_TYPE = dbType;
      process.env.DB_HOST = host;
      process.env.DB_PORT = port;
      process.env.DB_USER = user;
      process.env.DB_PASSWORD = password;
      process.env.DB_NAME = name;

      res.json({ success: true, message: "Konfigurasi database berhasil disimpan ke .env" });
    } catch (error: any) {
      console.error("Gagal menyimpan .env:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal menulis file .env" });
    }
  });

  // API Route to load env config if it exists
  app.get("/api/env-config", (req, res) => {
    try {
      let config = {
        dbType: process.env.DB_TYPE || "mysql",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || "3306",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        name: process.env.DB_NAME || "jurnalku_smk",
      };

      if (fs.existsSync(".env")) {
        const envContent = fs.readFileSync(".env", "utf-8");
        const lines = envContent.split("\n");
        lines.forEach(line => {
          const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
          if (match) {
            const key = match[1].trim();
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            } else if (val.startsWith("'") && val.endsWith("'")) {
              val = val.substring(1, val.length - 1);
            }
            if (key === "DB_TYPE") config.dbType = val;
            if (key === "DB_HOST") config.host = val;
            if (key === "DB_PORT") config.port = val;
            if (key === "DB_USER") config.user = val;
            if (key === "DB_PASSWORD") config.password = val;
            if (key === "DB_NAME") config.name = val;
          }
        });
      }

      res.json({ success: true, config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route to fetch all data from DB
  app.get("/api/data", async (req, res) => {
    try {
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");

      const [
        usersData, sekolahData, jurusanData, mapelData, 
        kelasData, siswaData, guruData, guruMengampuData, jurnalData
      ] = await Promise.all([
        db.select().from(schema.users),
        db.select().from(schema.sekolah),
        db.select().from(schema.jurusan),
        db.select().from(schema.mapel),
        db.select().from(schema.kelas),
        db.select().from(schema.siswa),
        db.select().from(schema.guru),
        db.select().from(schema.guruMengampu),
        db.select().from(schema.jurnal)
      ]);

      res.json({
        success: true,
        data: {
          users: usersData,
          sekolah: sekolahData[0] || null,
          jurusan: jurusanData,
          mapel: mapelData,
          kelas: kelasData,
          siswa: siswaData,
          guru: guruData,
          guruMengampu: guruMengampuData,
          jurnal: jurnalData
        }
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route for Login
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { eq, and } = await import("drizzle-orm");

      const user = await db.select().from(schema.users).where(
        and(eq(schema.users.username, username), eq(schema.users.password, password))
      ).limit(1);

      if (user.length > 0) {
        res.json({ success: true, user: user[0] });
      } else {
        res.status(401).json({ success: false, message: "Username atau password salah" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route for Changing Password
  app.post("/api/change-password", async (req, res) => {
    try {
      const { username, currentPassword, newPassword } = req.body;
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { eq, and } = await import("drizzle-orm");

      // Verify current user & password
      const user = await db.select().from(schema.users).where(
        and(eq(schema.users.username, username), eq(schema.users.password, currentPassword))
      ).limit(1);

      if (user.length === 0) {
        return res.status(400).json({ success: false, message: "Password lama salah" });
      }

      // Update password
      await db.update(schema.users)
        .set({ password: newPassword })
        .where(eq(schema.users.username, username));

      res.json({ success: true, message: "Password berhasil diperbarui" });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route for generic sync
  app.post("/api/sync/:table", express.json({limit: "10mb"}), async (req, res) => {
    try {
      const { table } = req.params;
      const data = req.body;
      const { getDb, getPool } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");

      const tableSchema = (schema as any)[table];
      if (!tableSchema) {
        return res.status(400).json({ success: false, message: "Invalid table" });
      }

      if (!Array.isArray(data)) {
        return res.status(400).json({ success: false, message: "Data must be an array" });
      }

      // Deduplicate elements by id and unique fields to prevent constraint failures in the same batch
      const uniqueData = [];
      const seenIds = new Set();
      const seenUniques = new Set();
      for (const item of data) {
        if (item && typeof item === 'object') {
          const id = item.id;
          if (id) {
            if (seenIds.has(id)) continue;
            seenIds.add(id);
          }

          // Case-insensitive check for other unique columns
          if (table === "users") {
            const username = (item.username || item.username_ || "").toString().toLowerCase().trim();
            if (username) {
              if (seenUniques.has(`user_username_${username}`)) continue;
              seenUniques.add(`user_username_${username}`);
            }
          } else if (table === "mapel") {
            const kode = (item.kode || "").toString().toLowerCase().trim();
            if (kode) {
              if (seenUniques.has(`mapel_kode_${kode}`)) continue;
              seenUniques.add(`mapel_kode_${kode}`);
            }
          } else if (table === "siswa") {
            const nis = (item.nis || "").toString().toLowerCase().trim();
            if (nis) {
              if (seenUniques.has(`siswa_nis_${nis}`)) continue;
              seenUniques.add(`siswa_nis_${nis}`);
            }
          } else if (table === "guru") {
            const kodeGuru = (item.kodeGuru || item.kode_guru || "").toString().toLowerCase().trim();
            if (kodeGuru) {
              if (seenUniques.has(`guru_kodeguru_${kodeGuru}`)) continue;
              seenUniques.add(`guru_kodeguru_${kodeGuru}`);
            }
          }
        }
        uniqueData.push(item);
      }

      await runInQueue(table, async () => {
        const { sql } = await import("drizzle-orm");

        // If syncing users, fetch existing admin accounts from the database and preserve them
        if (table === "users") {
          try {
            const { eq } = await import("drizzle-orm");
            const existingAdmins = await db.select().from(tableSchema).where(eq(tableSchema.role, "admin"));
            for (const admin of existingAdmins) {
              const exists = uniqueData.some((u: any) => 
                u.id === admin.id || u.username.toLowerCase() === admin.username.toLowerCase()
              );
              if (!exists) {
                uniqueData.push(admin);
              }
            }
          } catch (adminErr) {
            console.error("Gagal memproses pengamanan akun admin:", adminErr);
          }
        }

        await db.transaction(async (tx: any) => {
          await tx.execute(sql`SET FOREIGN_KEY_CHECKS=0`);

          let actualTableName = table;
          if (table === "guruMengampu") actualTableName = "guru_mengampu";

          await tx.execute(sql.raw(`DELETE FROM \`${actualTableName}\``));

          if (uniqueData.length > 0) {
            // Chunk inserts to avoid query size limits
            const chunkSize = 50;
            for (let i = 0; i < uniqueData.length; i += chunkSize) {
              const chunk = uniqueData.slice(i, i + chunkSize).map((item: any) => {
                if (table === "jurnal" && item.createdAt) {
                  return {
                    ...item,
                    createdAt: new Date(item.createdAt)
                  };
                }
                return item;
              });
              await tx.insert(tableSchema).values(chunk);
            }
          }

          await tx.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
        });
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Sync error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
