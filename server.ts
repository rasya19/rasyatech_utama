import dotenv from "dotenv";
import fs from "fs";
// Muat .env.local dulu (dev lokal), lalu .env sebagai fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import cors from "cors";
import {
  registerTenant,
  checkSubdomainAvailable,
  type TenantRegistrationPayload,
} from "./src/lib/register-tenant-core";

const ROOT = process.cwd();
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
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

  // Gerbang Pendaftaran — simpan tenant ke tenant_master + registrations
  app.post("/api/register-tenant", async (req, res) => {
    const {
      tenant_name,
      product_app,
      subdomain,
      admin_name,
      admin_email,
      whatsapp,
      npsn,
      package_tier,
      meta_data,
      source,
    } = req.body ?? {};

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://erosuotjshhmhduoprwi.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return res.status(500).json({ error: "Server configuration missing: Service Role Key" });
    }

    if (!tenant_name || !product_app || !subdomain || !admin_name || !admin_email || !whatsapp) {
      return res.status(400).json({
        error:
          "Field wajib: tenant_name, product_app, subdomain, admin_name, admin_email, whatsapp",
      });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      const payload: TenantRegistrationPayload = {
        tenant_name,
        product_app,
        subdomain,
        admin_name,
        admin_email,
        whatsapp,
        npsn,
        package_tier,
        meta_data,
        source,
      };
      const result = await registerTenant(adminSupabase, payload);
      res.json(result);
    } catch (error: any) {
      console.error("register-tenant error:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  // Cek ketersediaan subdomain (tenant_master + registrations)
  app.get("/api/check-subdomain", async (req, res) => {
    const subdomain = req.query.subdomain as string;
    if (!subdomain) {
      return res.status(400).json({ error: "Subdomain is required" });
    }

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://erosuotjshhmhduoprwi.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return res.status(500).json({ error: "Server configuration missing" });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      const result = await checkSubdomainAvailable(adminSupabase, subdomain);
      if (result.available) {
        return res.status(404).json({ success: true, available: true, subdomain });
      }
      return res.status(200).json({
        success: true,
        available: false,
        takenIn: result.takenIn,
        subdomain,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API route for school registration (bypasses direct client RLS by using service role key)
  app.post("/api/register-school", async (req, res) => {
    console.log("Received POST to /api/register-school. Body:", req.body);
    const { school_name, admin_email, admin_name, whatsapp, WA, npsn, subdomain, password, status, is_approved } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing from environment");
      return res.status(500).json({ error: "Server configuration missing: Service Role Key" });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      const payload: any = {
        school_name,
        admin_email,
        admin_name: admin_name || school_name,
        whatsapp: whatsapp || WA || '',
        npsn: npsn || '-',
        subdomain: subdomain || '',
        password: password || '',
        status: status || 'pending',
        is_approved: is_approved === undefined ? false : is_approved,
        created_at: new Date().toISOString()
      };

      console.log("Inserting registration with payload:", payload);

      const { data, error } = await adminSupabase
        .from('registrations')
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase Database Insertion Error during registration:", error.message, error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: "Pendaftaran berhasil disimpan ke database (registrations)!", data });
    } catch (error: any) {
      console.error("Registration endpoint caught error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route for school verification
  app.post("/api/verify-school", async (req, res) => {
    console.log("Received POST to /api/verify-school. Body:", req.body);
    const { email, school_name, subdomain, registrationId } = req.body;
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing from environment");
      return res.status(500).json({ error: "Server configuration missing: Service Role Key" });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const activationDate = new Date();

        // Fetch registration info to retrieve password and any other registered values
        let password = 'AktivasiSekolah123!'; // Fallback password
        let regData: any = null;

        if (registrationId) {
          const { data, error: fetchError } = await adminSupabase
            .from('registrations')
            .select('*')
            .eq('id', registrationId)
            .single();
          
          if (!fetchError && data) {
            regData = data;
            if (data.password) {
              password = data.password;
            }
          } else {
            console.warn("Could not fetch registration details for ID:", registrationId, fetchError?.message);
          }
        }

        const targetEmail = email || regData?.admin_email;
        const targetSchoolName = school_name || regData?.school_name || 'Sekolah Baru';
        const targetSubdomain = subdomain || regData?.subdomain;

        if (!targetEmail) {
          return res.status(400).json({ error: "Email is required for verification" });
        }

        // 1. Create Supabase Auth User with Password
        const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
          email: targetEmail,
          password: password,
          email_confirm: true,
          user_metadata: { school_name: targetSchoolName, subdomain: targetSubdomain }
        });

        // Jika user sudah ada (422), kita lanjut saja
        if (userError && userError.status !== 422) {
            console.error("Auth creation error:", userError.message);
            return res.status(400).json({ error: userError.message });
        }

        const authUid = userData?.user?.id;

        // 2. Update status di tabel registrations
        const { error: regError } = await adminSupabase
          .from('registrations')
          .update({ 
            status: 'verified',
            subdomain: targetSubdomain,
            auth_uid: authUid || null
          })
          .eq('id', registrationId);

        if (regError) {
          console.error("Registration update error:", regError.message);
          throw regError;
        }

        // 3. Insert/Upsert ke tabel schools
        if (targetSubdomain) {
          const { error: schoolError } = await adminSupabase
            .from('schools') 
            .upsert([{
              id: targetSubdomain,
              nama_sekolah: targetSchoolName, 
              registration_id: registrationId, // Menambahkan ID pendaftaran sebagai referensi
              created_at: activationDate.toISOString()
            }], { onConflict: 'id' });

          if (schoolError) {
            console.error("School upsert error:", schoolError.message);
            throw schoolError;
          }
        }

        // 4. Safe Insert/Upsert ke tabel profiles
        if (authUid) {
          try {
            const { error: profileError } = await adminSupabase
              .from('profiles')
              .upsert([{
                id: authUid,
                email: targetEmail,
                role: 'school_admin',
                school_id: targetSubdomain || '',
                name: targetSchoolName,
                created_at: activationDate.toISOString(),
                updated_at: activationDate.toISOString()
              }], { onConflict: 'id' });

            if (profileError) {
              console.warn("Profiles table upsert warned (continuing...):", profileError.message);
            } else {
              console.log("Profiles successfully updated for user:", authUid);
            }
          } catch (profileCatchError: any) {
            console.warn("Profiles table upsert caught error (continuing...):", profileCatchError.message);
          }

          // 5. Safe Insert/Upsert ke tabel users
          try {
            const { error: usersError } = await adminSupabase
              .from('users')
              .upsert([{
                id: authUid,
                email: targetEmail,
                name: targetSchoolName,
                plan: regData?.package || 'silver',
                school_id: targetSubdomain || '',
                created_at: activationDate.toISOString()
              }], { onConflict: 'id' });

            if (usersError) {
               console.warn("Users table upsert warned (continuing...):", usersError.message);
            } else {
              console.log("Users table successfully updated for user:", authUid);
            }
          } catch (usersCatchError: any) {
             console.warn("Users table upsert caught error (continuing...):", usersCatchError.message);
          }
        }

        // 6. Send welcome email
        try {
            console.log(`Attempting to send email to ${targetEmail}...`);
            const domainUtama = "rsch.my.id";
            const urlSekolah = `https://${targetSubdomain}.${domainUtama}`;
            
            const info = await transporter.sendMail({
                from: '"Rasyacomp Support" <ismanto095@gmail.com>',
                to: targetEmail,
                subject: `Selamat! Website Sekolah ${targetSchoolName} Telah Aktif`,
                text: `Halo Admin ${targetSchoolName},\n\nPendaftaran Anda di Rasyatech telah diverifikasi. Sekarang Anda sudah memiliki website resmi sendiri. Berikut adalah detail akses Anda:\n\nURL Website: ${urlSekolah}\n\nEmail Login: ${targetEmail}\n\nSilakan klik URL di atas untuk mulai mengelola profil sekolah Anda. Terima kasih telah mempercayakan layanan digital Anda kepada Rasyatech.\n\nSalam,\nRasyacomp Support`
            });
            console.log("Email sent successfully:", info.messageId);
        } catch (emailError: any) {
            console.warn("Failed to send email:", emailError.message);
        }

        res.json({ success: true, message: "Verifikasi berhasil & Email terkirim!" });

    } catch (error: any) {
        console.error("Verification endpoint caught error:", error);
        res.status(500).json({ error: error.message });
    }
  });

  // API route for deleting registration
  app.delete("/api/delete-registration", async (req, res) => {
    const id = (req.query.id as string) || (req.params as any).id;
    if (!id) return res.status(400).json({ error: "ID is required" });
    console.log(`Processing DELETE for registration ID: ${id}`);
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing from environment");
      return res.status(500).json({ error: "Server configuration missing" });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Ambil data subdomain & auth_uid pendaftaran
        const { data: reg, error: fetchError } = await adminSupabase
            .from('registrations')
            .select('subdomain, auth_uid')
            .eq('id', id)
            .single();

        if (fetchError) {
          console.error(`Error fetching registration ${id}:`, fetchError.message);
          // Jika tidak ada di registrasi, mungkin sudah terhapus atau ID salah
          return res.status(404).json({ error: "Pendaftaran tidak ditemukan" });
        }

        // 2. Hapus data di tabel schools (jika ada)
        // Kita hapus berdasarkan ID (subdomain) DAN registration_id agar aman
        if (reg?.subdomain && reg.subdomain !== '-') {
            console.log(`Deleting school with subdomain: ${reg.subdomain}`);
            await adminSupabase.from('schools').delete().eq('id', reg.subdomain);
        }
        // Juga hapus berdasarkan registration_id jika tabel schools punya kolom tersebut
        await adminSupabase.from('schools').delete().eq('registration_id', id);

        // 3. Hapus User Auth jika ada (Jika admin ingin sekalian menghapus akun loginnya)
        if (reg?.auth_uid) {
           console.log(`Deleting auth user: ${reg.auth_uid}`);
           const { error: authError } = await adminSupabase.auth.admin.deleteUser(reg.auth_uid);
           if (authError) {
             console.warn(`Auth deletion failed (continuing...): ${authError.message}`);
           }
        }

        // 4. Akhirnya hapus data pendaftaran utama
        console.log(`Deleting record from registrations table for ID: ${id}`);
        const { error: deleteError } = await adminSupabase
            .from('registrations')
            .delete()
            .eq('id', id);

        if (deleteError) {
          console.error("Registration table deletion error:", deleteError.message);
          throw deleteError;
        }

        res.json({ success: true, message: "Pendaftar dan data terkait berhasil dihapus permanen!" });
    } catch (error: any) {
        console.error("Delete registration route error:", error);
        res.status(500).json({ error: error.message });
    }
  });

  // Frontend SPA — port 3000 melayani UI + API (bukan API saja)
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Lewati Vite untuk route API
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      vite.middlewares(req, res, next);
    });

    // SPA fallback: /daftar, /master-admin, dll. → index.html + React Router
    app.use("*", async (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
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
    const distPath = path.join(ROOT, "dist");
    const indexHtml = path.join(distPath, "index.html");

    if (!fs.existsSync(indexHtml)) {
      console.error(
        "ERROR: dist/index.html tidak ditemukan. Jalankan `npm run build` sebelum `npm start`."
      );
      process.exit(1);
    }

    app.use(express.static(distPath));

    // SPA fallback production (React Router: /daftar, /master-admin, ...)
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(indexHtml);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Rasyatech dev server — mode: ${isProduction ? "production" : "development"}`);
    console.log(`  URL utama : http://localhost:${PORT}`);
    console.log(`  Form daftar: http://localhost:${PORT}/daftar`);
    console.log(`  API tenant : POST http://localhost:${PORT}/api/register-tenant`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("");
  });
}

startServer();

