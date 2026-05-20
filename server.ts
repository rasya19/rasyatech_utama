import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // API route for school verification
  app.post("/api/verify-school", async (req, res) => {
    console.log("Received POST to /api/verify-school. Body:", req.body);
    const { email, school_name, subdomain, registrationId } = req.body;
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing from environment");
      return res.status(500).json({ error: "Server configuration missing: Service Role Key" });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const activationDate = new Date();

        // 1. Create Supabase Auth User
        const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { school_name, subdomain }
        });

        // Jika user sudah ada (422), kita lanjut saja
        if (userError && userError.status !== 422) {
            console.error("Auth creation error:", userError.message);
            return res.status(400).json({ error: userError.message });
        }

        // 2. Update status di tabel registrations
        const { error: regError } = await adminSupabase
          .from('registrations')
          .update({ 
            status: 'verified',
            subdomain: subdomain,
            activated_at: activationDate.toISOString(),
            expired_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            auth_uid: userData?.user?.id
          })
          .eq('id', registrationId);

        if (regError) {
          console.error("Registration update error:", regError.message);
          throw regError;
        }

        // 3. Insert/Upsert ke tabel schools
        const { error: schoolError } = await adminSupabase
          .from('schools') 
          .upsert([{
            id: subdomain,
            nama_sekolah: school_name || 'Sekolah Baru', 
            registration_id: registrationId, // Menambahkan ID pendaftaran sebagai referensi
            created_at: activationDate.toISOString()
          }], { onConflict: 'id' });

        if (schoolError) {
          console.error("School upsert error:", schoolError.message);
          throw schoolError;
        }

        // 4. Send welcome email
        try {
            console.log(`Attempting to send email to ${email}...`);
            const domainUtama = "rsch.my.id";
            const urlSekolah = `https://${subdomain}.${domainUtama}`;
            
            const info = await transporter.sendMail({
                from: '"Rasyacomp Support" <ismanto095@gmail.com>',
                to: email,
                subject: `Selamat! Website Sekolah ${school_name} Telah Aktif`,
                text: `Halo Admin ${school_name},\n\nPendaftaran Anda di Rasyatech telah diverifikasi. Sekarang Anda sudah memiliki website resmi sendiri. Berikut adalah detail akses Anda:\n\nURL Website: ${urlSekolah}\n\nEmail Login: ${email}\n\nSilakan klik URL di atas untuk mulai mengelola profil sekolah Anda. Terima kasih telah mempercayakan layanan digital Anda kepada Rasyatech.\n\nSalam,\nRasyacomp Support`
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
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
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

