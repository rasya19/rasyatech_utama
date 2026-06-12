import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import cors from "cors";

// Import logic core (Pastikan file ini ada di folder src/lib/ atau sesuaikan path-nya)
import {
  registerTenant,
  checkSubdomainAvailable,
} from "./src/lib/register-tenant-core";

const ROOT = process.cwd();
const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";

function createAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(DEFAULT_SUPABASE_URL, serviceKey);
}

const app = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Setup nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- API ROUTES ---

// 1. Register Tenant
app.post("/api/register-tenant", async (req, res) => {
  const adminSupabase = createAdminSupabase();
  if (!adminSupabase) return res.status(500).json({ error: "Server config missing" });
  try {
    const result = await registerTenant(adminSupabase, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Check Subdomain
app.get("/api/check-subdomain", async (req, res) => {
  const adminSupabase = createAdminSupabase();
  const subdomain = req.query.subdomain as string;
  try {
    const result = await checkSubdomainAvailable(adminSupabase!, subdomain);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Register School (Direct)
app.post("/api/register-school", async (req, res) => {
  const adminSupabase = createAdminSupabase();
  try {
    const { data, error } = await adminSupabase!.from('registrations').insert([req.body]).select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Verify School
app.post("/api/verify-school", async (req, res) => {
  const adminSupabase = createAdminSupabase();
  // ... (Gunakan logika verifikasi yang sudah Abang buat sebelumnya di sini)
  res.json({ success: true, message: "Verifikasi berhasil" });
});

// 5. Delete Registration
app.delete("/api/delete-registration", async (req, res) => {
    // ... (Gunakan logika hapus yang sudah Abang buat sebelumnya)
    res.json({ success: true, message: "Berhasil dihapus" });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      vite.middlewares(req, res, next);
    });
    app.use("*", async (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        const template = fs.readFileSync(path.join(ROOT, "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
    });
  } else {
    app.use(express.static(path.join(ROOT, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(ROOT, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
