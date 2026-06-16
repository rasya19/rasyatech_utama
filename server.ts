import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config();

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import cors from "cors";

const ROOT = process.cwd();
const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://erosuotjshhmhduoprwi.supabase.co";

function createAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(DEFAULT_SUPABASE_URL, serviceKey);
}

function parseTenantSubdomain(host: string | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;

  const parts = hostname.split(".");
  if (parts.length < 3) return null;

  const slug = parts[0];
  if (["www", "rasyatech", "api", "mail"].includes(slug)) return null;
  return slug;
}

function normalizeTenantPillar(product: string | null | undefined): "siput" | "lms" | null {
  const value = (product || "").toLowerCase();
  if (value === "siput") return "siput";
  if (value === "lms" || value === "armilla") return "lms";
  return null;
}

async function resolveTenantPillarFromDatabase(
  subdomain: string
): Promise<"siput" | "lms" | null> {
  const adminSupabase = createAdminSupabase();
  if (!adminSupabase) return null;

  const { data: tenantRow, error: tenantError } = await adminSupabase
    .from("tenant_master")
    .select("product_app")
    .eq("subdomain", subdomain)
    .neq("status", "rejected")
    .maybeSingle();

  if (tenantError) {
    const missingTable =
      tenantError.message.includes("tenant_master") &&
      tenantError.message.includes("schema cache");
    if (!missingTable) throw tenantError;
  } else {
    const pillar = normalizeTenantPillar(tenantRow?.product_app);
    if (pillar) return pillar;
  }

  const { data: regRow, error: regError } = await adminSupabase
    .from("registrations")
    .select("product_name, product_app")
    .eq("subdomain", subdomain)
    .neq("status", "rejected")
    .maybeSingle();

  if (regError) throw regError;
  return normalizeTenantPillar(regRow?.product_name || regRow?.product_app);
}

function resolveDistFolder(pillar: "siput" | "lms" | null): string {
  if (pillar === "siput") return "dist-siput";
  if (pillar === "lms") return "dist-lms";
  return "dist";
}

function resolveIndexHtml(pillar: "siput" | "lms" | null): string {
  const folder = resolveDistFolder(pillar);
  const candidate = path.join(ROOT, folder, "index.html");
  if (fs.existsSync(candidate)) return candidate;
  return path.join(ROOT, "dist", "index.html");
}

async function handleTenantRootRedirect(
  req: Request,
  res: Response,
  subdomain: string
): Promise<boolean> {
  const pillar = await resolveTenantPillarFromDatabase(subdomain);
  if (pillar === "siput") {
    res.redirect(302, "/admin");
    return true;
  }
  if (pillar === "lms") {
    res.redirect(302, "/login-sekolah");
    return true;
  }
  return false;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const corsOptions = {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  app.post("/api/register-school", async (req, res) => {
    console.log("Received POST to /api/register-school. Body:", req.body);
    const {
      school_name,
      admin_email,
      admin_name,
      whatsapp,
      WA,
      npsn,
      subdomain,
      password,
      status,
      is_approved,
    } = req.body;

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return res.status(500).json({ error: "Server configuration missing: Service Role Key" });
    }

    const adminSupabase = createClient(DEFAULT_SUPABASE_URL, supabaseServiceKey);

    try {
      const payload = {
        school_name,
        admin_email,
        admin_name: admin_name || school_name,
        whatsapp: whatsapp || WA || "",
        npsn: npsn || "-",
        subdomain: subdomain || "",
        password: password || "",
        status: status || "pending",
        is_approved: is_approved === undefined ? false : is_approved,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await adminSupabase.from("registrations").insert([payload]).select();
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        success: true,
        message: "Pendaftaran berhasil disimpan ke database (registrations)!",
        data,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verify-school", async (req, res) => {
    console.log("Received POST to /api/verify-school. Body:", req.body);
    const { email, school_name, subdomain, registrationId } = req.body;

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return res.status(500).json({ error: "Server configuration missing: Service Role Key" });
    }

    const adminSupabase = createClient(DEFAULT_SUPABASE_URL, supabaseServiceKey);

    try {
      const activationDate = new Date();
      let password = "AktivasiSekolah123!";
      let regData: any = null;

      if (registrationId) {
        const { data, error: fetchError } = await adminSupabase
          .from("registrations")
          .select("*")
          .eq("id", registrationId)
          .single();

        if (!fetchError && data) {
          regData = data;
          if (data.password) password = data.password;
        }
      }

      const targetEmail = email || regData?.admin_email;
      const targetSchoolName = school_name || regData?.school_name || "Sekolah Baru";
      const targetSubdomain = subdomain || regData?.subdomain;

      if (!targetEmail) {
        return res.status(400).json({ error: "Email is required for verification" });
      }

      const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: { school_name: targetSchoolName, subdomain: targetSubdomain },
      });

      if (userError && userError.status !== 422) {
        return res.status(400).json({ error: userError.message });
      }

      const authUid = userData?.user?.id;

      const { error: regError } = await adminSupabase
        .from("registrations")
        .update({
          status: "verified",
          subdomain: targetSubdomain,
          auth_uid: authUid || null,
        })
        .eq("id", registrationId);

      if (regError) throw regError;

      if (targetSubdomain) {
        const { error: schoolError } = await adminSupabase.from("schools").upsert(
          [
            {
              id: targetSubdomain,
              nama_sekolah: targetSchoolName,
              registration_id: registrationId,
              created_at: activationDate.toISOString(),
            },
          ],
          { onConflict: "id" }
        );
        if (schoolError) throw schoolError;
      }

      if (authUid) {
        try {
          await adminSupabase.from("profiles").upsert(
            [
              {
                id: authUid,
                email: targetEmail,
                role: "school_admin",
                school_id: targetSubdomain || "",
                name: targetSchoolName,
                created_at: activationDate.toISOString(),
                updated_at: activationDate.toISOString(),
              },
            ],
            { onConflict: "id" }
          );
        } catch {
          /* optional table */
        }

        try {
          await adminSupabase.from("users").upsert(
            [
              {
                id: authUid,
                email: targetEmail,
                name: targetSchoolName,
                plan: regData?.package || "silver",
                school_id: targetSubdomain || "",
                created_at: activationDate.toISOString(),
              },
            ],
            { onConflict: "id" }
          );
        } catch {
          /* optional table */
        }
      }

      try {
        const urlSekolah = `https://${targetSubdomain}.rsch.my.id`;
        await transporter.sendMail({
          from: '"Rasyacomp Support" <ismanto095@gmail.com>',
          to: targetEmail,
          subject: `Selamat! Website Sekolah ${targetSchoolName} Telah Aktif`,
          text: `Halo Admin ${targetSchoolName},\n\nPendaftaran Anda di Rasyatech telah diverifikasi.\n\nURL Website: ${urlSekolah}\nEmail Login: ${targetEmail}\n\nSalam,\nRasyacomp Support`,
        });
      } catch {
        /* email optional */
      }

      res.json({ success: true, message: "Verifikasi berhasil & Email terkirim!" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/delete-registration", async (req, res) => {
  const id = (req.query.id as string) || (req.params as any).id;
  const tenant = req.query.tenant as string;
  
  if (!id) return res.status(400).json({ error: "ID is required" });
  if (!tenant) return res.status(400).json({ error: "tenant is required" });

  // ... (lanjutkan dengan logika yang sama seperti di atas)
});

  try {
    // 1. Ambil data tenant
    const { data: reg, error: fetchError } = await adminSupabase
      .from('tenant')
      .select('id, subdomain, auth_uid')
      .eq('id', id)
      .eq('tenant', tenant) // filter tenant
      .single();

    if (fetchError) {
      return res.status(404).json({ error: "Pendaftaran tidak ditemukan untuk tenant ini" });
    }

    // 2. Hapus schools
    if (reg?.subdomain && reg.subdomain !== '-') {
      await adminSupabase
        .from('schools')
        .delete()
        .eq('id', reg.subdomain)
        .eq('tenant', tenant);
    }
    await adminSupabase
      .from('schools')
      .delete()
      .eq('registration_id', id)
      .eq('tenant', tenant);

    // 3. Hapus auth user jika ada
    if (reg?.auth_uid) {
      await adminSupabase.auth.admin.deleteUser(reg.auth_uid);
    }

    // 4. Hapus dari tenant
    const { error: deleteError } = await adminSupabase
      .from('tenant')
      .delete()
      .eq('id', id)
      .eq('tenant', tenant);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: "Pendaftar berhasil dihapus permanen!" });
  } catch (error: any) {
    console.error("Delete registration error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api")) return next();
      vite.middlewares(req, res, next);
    });

    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api")) return next();

      const tenantSubdomain = parseTenantSubdomain(req.headers.host);
      if (tenantSubdomain && req.path === "/") {
        try {
          const redirected = await handleTenantRootRedirect(req, res, tenantSubdomain);
          if (redirected) return;
        } catch (routingError: any) {
          console.warn("[tenant-routing][dev]", routingError.message);
        }
      }

      try {
        const template = fs.readFileSync(path.join(ROOT, "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (error) {
        next(error);
      }
    });
  } else {
    const defaultDistPath = path.join(ROOT, "dist");
    const defaultIndexHtml = path.join(defaultDistPath, "index.html");

    if (!fs.existsSync(defaultIndexHtml)) {
      console.error("ERROR: dist/index.html tidak ditemukan. Jalankan `npm run build` dulu.");
      process.exit(1);
    }

    for (const folder of ["dist", "dist-siput", "dist-lms"]) {
      const staticPath = path.join(ROOT, folder);
      if (fs.existsSync(staticPath)) {
        app.use(express.static(staticPath));
      }
    }

    app.get("*", async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api")) return next();

      const tenantSubdomain = parseTenantSubdomain(req.headers.host);

      try {
        if (tenantSubdomain && req.path === "/") {
          const redirected = await handleTenantRootRedirect(req, res, tenantSubdomain);
          if (redirected) return;
        }

        let pillar: "siput" | "lms" | null = null;
        if (tenantSubdomain) {
          pillar = await resolveTenantPillarFromDatabase(tenantSubdomain);
        }

        if (pillar && tenantSubdomain) {
          console.log(`Routing ${tenantSubdomain} → ${resolveDistFolder(pillar)}`);
        }

        res.sendFile(resolveIndexHtml(pillar));
      } catch (routingError: any) {
        console.error("[tenant-routing][prod]", routingError.message);
        res.sendFile(defaultIndexHtml);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Rasyatech server — mode: ${isProduction ? "production" : "development"}`);
    console.log(`  URL utama : http://localhost:${PORT}`);
    console.log(`  Form daftar: http://localhost:${PORT}/daftar`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("");
  });
}

startServer();
