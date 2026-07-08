import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

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

      envContent = setEnvVar(envContent, "DB_TYPE", dbType || "local_storage");
      envContent = setEnvVar(envContent, "DB_HOST", host || "localhost");
      envContent = setEnvVar(envContent, "DB_PORT", port || "5432");
      envContent = setEnvVar(envContent, "DB_USER", user || "postgres");
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
        dbType: process.env.DB_TYPE || "local_storage",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || "5432",
        user: process.env.DB_USER || "postgres",
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
