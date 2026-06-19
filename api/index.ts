import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import {
  registerTenant,
  checkSubdomainAvailable,
  type TenantRegistrationPayload,
} from "../src/lib/register-tenant-core";
import { provisionTenantAuthUser } from "../src/lib/provision-tenant-auth-server";

const app = express();

const DEFAULT_SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://erosuotjshhmhduoprwi.supabase.co";

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

function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Server configuration missing: Service Role Key");
  }
  return createClient(DEFAULT_SUPABASE_URL, serviceKey);
}

app.post("/api/provision-tenant-auth", async (req, res) => {
  const { product, email, password, redirectTo, metadata } = req.body || {};

  if (!product || (product !== "siput" && product !== "lms")) {
    return res.status(400).json({ error: "product harus siput atau lms" });
  }
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email wajib" });
  }

  try {
    const result = await provisionTenantAuthUser({
      product,
      email,
      password,
      redirectTo: typeof redirectTo === "string" ? redirectTo : undefined,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return res.status(500).json({ error: message });
  }
});

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

  if (!tenant_name || !product_app || !subdomain || !admin_name || !admin_email || !whatsapp) {
    return res.status(400).json({
      error:
        "Field wajib: tenant_name, product_app, subdomain, admin_name, admin_email, whatsapp",
    });
  }

  try {
    const adminSupabase = getAdminSupabase();
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

app.get("/api/check-subdomain", async (req, res) => {
  const subdomain = req.query.subdomain as string;
  if (!subdomain) {
    return res.status(400).json({ error: "Subdomain is required" });
  }

  try {
    const adminSupabase = getAdminSupabase();
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

app.post("/api/register-school", async (req, res) => {
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
  } = req.body ?? {};

  try {
    const adminSupabase = getAdminSupabase();

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
  const { email, school_name, subdomain, registrationId } = req.body ?? {};

  try {
    const adminSupabase = getAdminSupabase();
    const activationDate = new Date();

    let password = "AktivasiSekolah123!";
    let regData: Record<string, unknown> | null = null;

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

    const targetEmail = email || (regData?.admin_email as string | undefined);
    const targetSchoolName = school_name || (regData?.school_name as string) || "Sekolah Baru";
    const targetSubdomain = subdomain || (regData?.subdomain as string | undefined);

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

    if (regError) {
      throw regError;
    }

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
              plan: (regData?.package as string) || "silver",
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
  const id = (req.query.id as string) || (req.params as { id?: string }).id;
  const tenant = req.query.tenant as string; // ambil tenant dari query

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }
  if (!tenant) {
    return res.status(400).json({ error: "tenant is required" });
  }
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey || !supabaseUrl) {
    return res.status(500).json({ error: "Server configuration missing" });
  }
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  // ... koneksi supabase

  try {
    // 1. Ambil data dari tabel tenant (bukan tenant_master)
    const { data: reg, error: fetchError } = await adminSupabase
      .from('tenant')
      .select('id, subdomain, auth_uid')
      .eq('id', id)
      .eq('tenant', tenant) // filter tenant
      .single();

    if (fetchError) {
      return res.status(404).json({ error: "Pendaftaran tidak ditemukan untuk tenant ini" });
    }

    // 2. Hapus data di schools (filter tenant)
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

    // 3. Hapus auth user jika ada (tidak perlu filter tenant)
    if (reg?.auth_uid) {
      await adminSupabase.auth.admin.deleteUser(reg.auth_uid);
    }

    // 4. Hapus dari tabel tenant (filter tenant)
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

export default app;
