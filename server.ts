import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Realtime SSE Clients Collection
  const sseClients = new Set<express.Response>();

  // Helper to broadcast freshest database data to all connected realtime clients
  async function broadcastAllData() {
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

      const payload = JSON.stringify({
        type: "realtime_update",
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

      for (const client of sseClients) {
        try {
          client.write(`data: ${payload}\n\n`);
        } catch (e) {
          sseClients.delete(client);
        }
      }
    } catch (e) {
      console.error("Broadcast error:", e);
    }
  }

  // Periodic SSE Heartbeat to prevent socket drops
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(`: heartbeat\n\n`);
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }, 20000);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // SSE Realtime Endpoint
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    sseClients.add(res);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

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
      
      process.env.DB_TYPE = dbType;
      process.env.DB_HOST = host;
      process.env.DB_PORT = port;
      process.env.DB_USER = user;
      process.env.DB_PASSWORD = password;
      process.env.DB_NAME = name;

      const { resetDbConnection } = await import("./src/db/index.js");
      resetDbConnection();

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

      const user = await db.select().from(schema.users).where(
        and(eq(schema.users.username, username), eq(schema.users.password, currentPassword))
      ).limit(1);

      if (user.length === 0) {
        return res.status(400).json({ success: false, message: "Password lama salah" });
      }

      await db.update(schema.users)
        .set({ password: newPassword })
        .where(eq(schema.users.username, username));

      broadcastAllData();
      res.json({ success: true, message: "Password berhasil diperbarui" });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Dedicated API Route to add/upsert journal entry in realtime
  app.post("/api/jurnal", express.json(), async (req, res) => {
    try {
      const entry = req.body;
      if (!entry || !entry.id || !entry.kelasId || !entry.mapelId) {
        return res.status(400).json({ success: false, message: "Data jurnal tidak lengkap" });
      }

      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { sql, desc } = await import("drizzle-orm");

      const processedEntry = {
        id: String(entry.id),
        hari: String(entry.hari || ''),
        tanggal: String(entry.tanggal || ''),
        jamKe: String(entry.jamKe || ''),
        kelasId: String(entry.kelasId || entry.kelas_id || ''),
        mapelId: String(entry.mapelId || entry.mapel_id || ''),
        guruId: String(entry.guruId || entry.guru_id || ''),
        statusKehadiran: String(entry.statusKehadiran || entry.status_kehadiran || 'hadir'),
        catatan: String(entry.catatan || ''),
        diinputOleh: String(entry.diinputOleh || entry.diinput_oleh || 'system'),
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date()
      };

      await db.transaction(async (tx: any) => {
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=0`);
        await tx.insert(schema.jurnal).values(processedEntry).onDuplicateKeyUpdate({
          set: {
            hari: processedEntry.hari,
            tanggal: processedEntry.tanggal,
            jamKe: processedEntry.jamKe,
            kelasId: processedEntry.kelasId,
            mapelId: processedEntry.mapelId,
            guruId: processedEntry.guruId,
            statusKehadiran: processedEntry.statusKehadiran,
            catatan: processedEntry.catatan,
            diinputOleh: processedEntry.diinputOleh,
          }
        });
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
      });

      const allJurnals = await db.select().from(schema.jurnal).orderBy(desc(schema.jurnal.createdAt));
      broadcastAllData();

      res.json({ success: true, jurnals: allJurnals });
    } catch (error: any) {
      console.error("Error saving single jurnal:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Dedicated API Route to delete a journal entry in realtime
  app.delete("/api/jurnal/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { eq, desc } = await import("drizzle-orm");

      await db.delete(schema.jurnal).where(eq(schema.jurnal.id, id));
      const allJurnals = await db.select().from(schema.jurnal).orderBy(desc(schema.jurnal.createdAt));
      broadcastAllData();

      res.json({ success: true, jurnals: allJurnals });
    } catch (error: any) {
      console.error("Error deleting jurnal:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Dedicated API Route for single Siswa CRUD (atomic, real-time)
  app.post("/api/siswa", express.json(), async (req, res) => {
    try {
      const { id, nama, nis, kelasId, isKetuaKelas } = req.body;
      if (!nama || !kelasId) {
        return res.status(400).json({ success: false, message: "Nama dan Kelas Siswa wajib diisi." });
      }

      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { sql } = await import("drizzle-orm");

      const siswaId = String(id || ('sis-' + Date.now()));
      const cleanNama = String(nama).trim();
      const cleanNis = String(nis || '').trim();
      const cleanKelasId = String(kelasId).trim();
      const cleanIsKetua = Boolean(isKetuaKelas);

      const siswaRecord = {
        id: siswaId,
        nama: cleanNama,
        nis: cleanNis,
        kelasId: cleanKelasId,
        isKetuaKelas: cleanIsKetua,
      };

      await db.transaction(async (tx: any) => {
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=0`);
        await tx.insert(schema.siswa).values(siswaRecord).onDuplicateKeyUpdate({
          set: {
            nama: siswaRecord.nama,
            nis: siswaRecord.nis,
            kelasId: siswaRecord.kelasId,
            isKetuaKelas: siswaRecord.isKetuaKelas,
          }
        });

        // If isKetuaKelas is true, also create/upsert user account
        if (cleanIsKetua) {
          const usernameSiswa = 'S-' + (cleanNis.padStart(5, '0') || siswaId.slice(-5));
          const userRecord = {
            id: 'usr-' + siswaId.replace('sis-', ''),
            username: usernameSiswa,
            role: 'siswa',
            name: cleanNama,
            password: 'siswa123',
            referenceId: siswaId
          };
          await tx.insert(schema.users).values(userRecord).onDuplicateKeyUpdate({
            set: {
              name: userRecord.name,
              role: 'siswa',
              referenceId: userRecord.referenceId,
            }
          });
        }

        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
      });

      broadcastAllData();
      res.json({ success: true, message: "Data Siswa berhasil disimpan." });
    } catch (error: any) {
      console.error("Error saving single siswa:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Dedicated API Route to delete a single Siswa
  app.delete("/api/siswa/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { eq, sql } = await import("drizzle-orm");

      await db.transaction(async (tx: any) => {
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=0`);
        await tx.delete(schema.siswa).where(eq(schema.siswa.id, id));
        await tx.delete(schema.users).where(eq(schema.users.referenceId, id));
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
      });

      broadcastAllData();
      res.json({ success: true, message: "Data Siswa berhasil dihapus." });
    } catch (error: any) {
      console.error("Error deleting siswa:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route to update school identity in realtime
  app.post("/api/sekolah", async (req, res) => {
    try {
      const schoolData = req.body;
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { sql } = await import("drizzle-orm");

      const entry = {
        id: schoolData.id || "sek-1",
        nama: schoolData.nama || "",
        npsn: schoolData.npsn || "",
        alamat: schoolData.alamat || "",
        kepalaSekolah: schoolData.kepalaSekolah || "",
        nipKepalaSekolah: schoolData.nipKepalaSekolah || schoolData.nbmKepalaSekolah || "",
        nbmKepalaSekolah: schoolData.nbmKepalaSekolah || "",
        wakaKurikulum: schoolData.wakaKurikulum || "",
        nbmWakaKurikulum: schoolData.nbmWakaKurikulum || "",
        website: schoolData.website || "",
        email: schoolData.email || "",
        logoUrl: schoolData.logoUrl || "",
        namaAplikasi: schoolData.namaAplikasi || "JurnalKu SMK"
      };

      await db.transaction(async (tx: any) => {
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=0`);
        await tx.insert(schema.sekolah).values(entry).onDuplicateKeyUpdate({
          set: {
            nama: entry.nama,
            npsn: entry.npsn,
            alamat: entry.alamat,
            kepalaSekolah: entry.kepalaSekolah,
            nbmKepalaSekolah: entry.nbmKepalaSekolah,
            wakaKurikulum: entry.wakaKurikulum,
            nbmWakaKurikulum: entry.nbmWakaKurikulum,
            website: entry.website,
            email: entry.email,
            logoUrl: entry.logoUrl,
            namaAplikasi: entry.namaAplikasi,
          }
        });
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
      });

      broadcastAllData();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating sekolah:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Normalizer helper for batch inserts to prevent bad nulls or mismatched column keys
  function normalizeBatchItem(table: string, item: any) {
    if (table === "siswa") {
      return {
        id: String(item.id || ('sis-' + Date.now())),
        nama: String(item.nama || '').trim(),
        nis: String(item.nis || '').trim(),
        kelasId: String(item.kelasId || item.kelas_id || '').trim(),
        isKetuaKelas: Boolean(item.isKetuaKelas ?? item.is_ketua_kelas ?? false),
      };
    }
    if (table === "users") {
      return {
        id: String(item.id || ('usr-' + Date.now())),
        username: String(item.username || '').trim(),
        role: String(item.role || 'siswa'),
        name: String(item.name || '').trim(),
        password: String(item.password || '123456'),
        referenceId: item.referenceId || item.reference_id || null,
      };
    }
    if (table === "guru") {
      return {
        id: String(item.id || ('gur-' + Date.now())),
        nama: String(item.nama || '').trim(),
        kodeGuru: String(item.kodeGuru || item.kode_guru || '').trim(),
      };
    }
    if (table === "kelas") {
      return {
        id: String(item.id || ('kls-' + Date.now())),
        nama: String(item.nama || '').trim(),
        jurusanId: String(item.jurusanId || item.jurusan_id || '').trim(),
      };
    }
    if (table === "jurusan") {
      return {
        id: String(item.id || ('jur-' + Date.now())),
        nama: String(item.nama || '').trim(),
        singkatan: String(item.singkatan || '').trim(),
      };
    }
    if (table === "mapel") {
      return {
        id: String(item.id || ('mapel-' + Date.now())),
        kode: String(item.kode || '').trim(),
        nama: String(item.nama || '').trim(),
      };
    }
    if (table === "guruMengampu") {
      return {
        id: String(item.id || ('amp-' + Date.now())),
        guruId: String(item.guruId || item.guru_id || '').trim(),
        mapelId: String(item.mapelId || item.mapel_id || '').trim(),
        kelasId: String(item.kelasId || item.kelas_id || ''),
      };
    }
    return item;
  }

  // Helper for batch upsert & delete without table wiping
  async function handleBatchSave(table: string, data: any[], req: express.Request, res: express.Response) {
    try {
      const { getDb } = await import("./src/db/index.js");
      const db = await getDb();
      const schema = await import("./src/db/schema.js");
      const { sql, eq } = await import("drizzle-orm");

      const tableSchema = (schema as any)[table];
      if (!tableSchema) {
        return res.status(400).json({ success: false, message: "Invalid table" });
      }

      if (!Array.isArray(data)) {
        return res.status(400).json({ success: false, message: "Data must be an array" });
      }

      // Deduplicate items & normalize keys
      const uniqueData: any[] = [];
      const seenIds = new Set();
      for (const rawItem of data) {
        if (rawItem && typeof rawItem === 'object') {
          const item = normalizeBatchItem(table, rawItem);
          if (item.id) {
            if (seenIds.has(item.id)) continue;
            seenIds.add(item.id);
          }
          uniqueData.push(item);
        }
      }

      await db.transaction(async (tx: any) => {
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=0`);

        let actualTableName = table;
        if (table === "guruMengampu") actualTableName = "guru_mengampu";

        // For users, ensure we don't drop existing admins
        if (table === "users") {
          try {
            const existingAdmins = await tx.select().from(tableSchema).where(eq(tableSchema.role, "admin"));
            for (const admin of existingAdmins) {
              if (!uniqueData.some(u => u.id === admin.id || (u.username && u.username.toLowerCase() === admin.username.toLowerCase()))) {
                uniqueData.push(admin);
              }
            }
          } catch (e) {}
        }

        // Replace records cleanly
        await tx.execute(sql.raw(`DELETE FROM \`${actualTableName}\``));

        if (uniqueData.length > 0) {
          const chunkSize = 50;
          for (let i = 0; i < uniqueData.length; i += chunkSize) {
            const chunk = uniqueData.slice(i, i + chunkSize);
            await tx.insert(tableSchema).values(chunk);
          }
        }

        await tx.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
      });

      broadcastAllData();
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error in batch save ${table}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Batch / Entity Save Routes
  app.post("/api/users/batch", (req, res) => handleBatchSave("users", req.body, req, res));
  app.post("/api/jurusan/batch", (req, res) => handleBatchSave("jurusan", req.body, req, res));
  app.post("/api/mapel/batch", (req, res) => handleBatchSave("mapel", req.body, req, res));
  app.post("/api/kelas/batch", (req, res) => handleBatchSave("kelas", req.body, req, res));
  app.post("/api/siswa/batch", (req, res) => handleBatchSave("siswa", req.body, req, res));
  app.post("/api/guru/batch", (req, res) => handleBatchSave("guru", req.body, req, res));
  app.post("/api/guru-mengampu/batch", (req, res) => handleBatchSave("guruMengampu", req.body, req, res));

  // Legacy sync route fallback
  app.post("/api/sync/:table", express.json({ limit: "10mb" }), (req, res) => {
    const { table } = req.params;
    if (table === "jurnal") {
      return res.json({ success: true, message: "Use /api/jurnal for realtime journal updates" });
    }
    return handleBatchSave(table, req.body, req, res);
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
