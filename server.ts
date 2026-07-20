import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { initializeApp, cert } from 'firebase-admin/app';
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./src/lib/prisma.js";
import cors from "cors";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Firebase Admin
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log("Firebase Admin initialized with service account");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to default credentials");
      initializeApp();
    }
  } else {
    try {
      initializeApp();
      console.log("Firebase Admin initialized with default credentials");
    } catch (err) {
      console.log("Firebase Admin already initialized or skipped");
    }
  }

  const app = express();
  const PORT = 3000;

  const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json());

  // Multi-Tenant Context Middleware
  app.use(async (req: any, res: any, next: any) => {
    let tenantId = req.headers['x-tenant-id'] || req.query.tenant_id || req.query.school_id;

    if (!tenantId && req.headers.host) {
      const host = req.headers.host;
      const parts = host.split('.');
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'rasyatech') {
        const subdomain = parts[0];
        try {
          const tenant = await prisma.tenant.findUnique({
            where: { subdomain }
          });
          if (tenant) {
            tenantId = tenant.id;
          }
        } catch (err) {
          console.error("Subdomain tenant context lookup failed:", err);
        }
      }
    }

    req.tenantId = tenantId || null;
    next();
  });

  // Seed default master admin on startup
  try {
    const adminCount = await prisma.adminCenter.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.adminCenter.create({
        data: {
          email: "master_admin@rasyatech.com",
          password: hashedPassword,
          role: "MASTER_ADMIN"
        }
      });
      console.log("Default Master Admin seeded: master_admin@rasyatech.com / admin123");
    }
  } catch (err) {
    console.error("Failed to seed default admin center:", err);
  }

  // ==========================================
  // SAAS MANAGEMENT ENDPOINTS (NEW SCHEMA)
  // ==========================================

  // Tenant CRUD
  app.get("/api/saas/tenants", async (req, res) => {
    try {
      const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json(tenants);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/saas/tenants", async (req, res) => {
    try {
      const { schoolName, subdomain, status } = req.body;
      
      // Check duplicate subdomain
      const existing = await prisma.tenant.findUnique({
        where: { subdomain }
      });
      if (existing) {
        return res.status(400).json({ error: `Subdomain '${subdomain}' sudah terdaftar.` });
      }

      const newTenant = await prisma.tenant.create({
        data: {
          schoolName,
          subdomain,
          status: status || "ACTIVE"
        }
      });
      res.json(newTenant);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Gagal membuat tenant baru." });
    }
  });

  app.put("/api/saas/tenants/:id", async (req, res) => {
    try {
      const { schoolName, subdomain, status } = req.body;
      const updated = await prisma.tenant.update({
        where: { id: req.params.id },
        data: {
          schoolName,
          subdomain,
          status
        }
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Gagal memperbarui tenant." });
    }
  });

  app.delete("/api/saas/tenants/:id", async (req, res) => {
    try {
      await prisma.tenant.delete({
        where: { id: req.params.id }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Gagal menghapus tenant." });
    }
  });

  // AdminCenter CRUD
  app.get("/api/saas/admins", async (req, res) => {
    try {
      const admins = await prisma.adminCenter.findMany({
        select: {
          id: true,
          email: true,
          role: true
        }
      });
      res.json(admins);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/saas/admins", async (req, res) => {
    try {
      const { email, password, role } = req.body;

      const existing = await prisma.adminCenter.findUnique({
        where: { email }
      });
      if (existing) {
        return res.status(400).json({ error: `Email '${email}' sudah terdaftar.` });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await prisma.adminCenter.create({
        data: {
          email,
          password: hashedPassword,
          role: role || "MASTER_ADMIN"
        }
      });
      res.json({ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Gagal membuat master admin baru." });
    }
  });

  app.delete("/api/saas/admins/:id", async (req, res) => {
    try {
      await prisma.adminCenter.delete({
        where: { id: req.params.id }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Gagal menghapus admin." });
    }
  });


  // ==========================================
  // STUB ROUTING FOR COMPATIBILITY / COMPILATION
  // ==========================================
  app.get("/api/settings/:key", (req, res) => res.json({}));
  app.post("/api/settings/:key", (req, res) => res.json({ success: true }));
  app.get("/api/services", (req, res) => res.json([]));
  app.get("/api/laptops", (req, res) => res.json([]));
  app.get("/api/products", (req, res) => res.json([]));
  app.get("/api/affiliates", (req, res) => res.json([]));
  app.get("/api/registrations", (req, res) => res.json([]));
  app.post("/api/registrations", (req, res) => res.json({ success: true }));
  app.post("/api/register", (req, res) => res.json({ success: true }));
  app.post("/api/register-school", (req, res) => res.json({ success: true }));
  app.post("/api/verify-school", (req, res) => res.json({ success: true }));
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await prisma.tenant.findMany();
      res.json(tenants.map(t => ({
        id: t.id,
        school_name: t.schoolName,
        subdomain: t.subdomain,
        status: t.status
      })));
    } catch (err) {
      res.json([]);
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
