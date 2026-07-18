import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { initializeApp, cert } from 'firebase-admin/app';
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { RegistrationService } from "./src/services/RegistrationService.js";
import { TenantsService } from "./src/services/TenantsService.js";
import { ContentService } from "./src/services/ContentService.js";
import nodemailer from "nodemailer";
import cors from "cors";

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
    initializeApp();
    console.log("Firebase Admin initialized with default credentials");
  }

  const app = express();
  const PORT = 3000;

  const allowedOrigins = [
    'https://rasyatech.rsch.my.id',
    'https://rasyatech.rsch.web.id',
    'https://rasyatech-lms-engine.vercel.app'
  ];

  const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json());

  // Setup nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Registration Endpoints
  app.get("/api/registrations", async (req, res) => {
    try {
      const data = await RegistrationService.getAll();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/registrations", async (req, res) => {
    try {
      const data = await RegistrationService.create(req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/registrations/:id", async (req, res) => {
    try {
      const data = await RegistrationService.update(req.params.id, req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/registrations/:id", async (req, res) => {
    try {
      await RegistrationService.delete(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/registrations/:id/status", async (req, res) => {
    try {
      const data = await RegistrationService.updateStatus(req.params.id, req.body.status);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Legacy Registration endpoint (mapped to new service)
  app.post("/api/register-school", async (req, res) => {
    try {
      const { school_name, admin_email, admin_name, whatsapp, WA, npsn, subdomain, password, status, product_type, referral_code, affiliateEmail } = req.body;
      const data = await RegistrationService.create({
        full_name: admin_name || school_name,
        email: admin_email,
        business_name: school_name,
        tenant_type: (product_type || 'LMS').toUpperCase(),
        status: status || 'pending',
        meta_data: { npsn, subdomain, password, whatsapp_number: whatsapp || WA, referral_code, affiliateEmail }
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Tenant Endpoints
  app.get("/api/tenants", async (req, res) => {
    try {
      const data = await TenantsService.getAll();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const data = await TenantsService.create(req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    try {
      const data = await TenantsService.update(req.params.id, req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    try {
      await TenantsService.delete(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Content Endpoints
  app.get("/api/services", async (req, res) => {
    try {
      const data = await ContentService.getServices();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/laptops", async (req, res) => {
    try {
      const data = await ContentService.getLaptops();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const data = await ContentService.getProducts();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/affiliates", async (req, res) => {
    try {
      const data = await ContentService.getAffiliates();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const data = await ContentService.getSettings(req.params.key);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings/:key", async (req, res) => {
    try {
      const data = await ContentService.updateSettings(req.params.key, req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generic Content CRUD
  app.get("/api/content/:collection", async (req, res) => {
    try {
      const data = await ContentService.getAll(req.params.collection, req.query.school_id as string);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/content/:collection", async (req, res) => {
    try {
      const data = await ContentService.upsert(req.params.collection, req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/content/:collection/:id", async (req, res) => {
    try {
      await ContentService.deleteItem(req.params.collection, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // API route for school verification (Simplified using RegistrationService)
  app.post("/api/verify-school", async (req, res) => {
    const { registrationId, status } = req.body;
    try {
      const registration = await RegistrationService.getById(registrationId) as any;
      if (!registration) return res.status(404).json({ error: "Registration not found" });

      const updated = await RegistrationService.updateStatus(registrationId, status || 'verified');

      // Send welcome email if verified
      if (status === 'verified' || !status) {
        try {
          await transporter.sendMail({
            from: '"Rasyacomp Support" <ismanto095@gmail.com>',
            to: registration.email || registration.admin_email,
            subject: `Selamat! Website Sekolah ${registration.business_name || registration.school_name} Telah Aktif`,
            text: `Halo ${registration.full_name || registration.admin_name || 'Admin'},\n\nPendaftaran Anda di Rasyatech telah diverifikasi.\n\nTerima kasih telah mempercayakan layanan digital Anda kepada Rasyatech.\n\nSalam,\nRasyacomp Support`
          });
        } catch (e) {
          console.error("Email send failed:", e);
        }
      }

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

