import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS dan preflight...
  const origin = req.headers.origin || 'https://rasyatech.rsch.my.id';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Ambil data dari body
  const { registrationId, email, school_name, subdomain, tenant } = req.body;

  // Validasi
  if (!(registrationId || email) || !subdomain) {
    return res.status(400).json({ error: "registrationId/email and subdomain are required" });
  }
  if (!tenant) {
    return res.status(400).json({ error: "tenant is required" });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const adminSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const activationDate = new Date();

    // UPDATE di tabel tenant (bukan tenant_master)
    const { error: dbError } = await adminSupabase
      .from('tenant')  // <-- pakai tabel tenant
      .update({ 
        status: 'verified',
        subdomain: subdomain
      })
      .or(`id.eq.${registrationId},admin_email.eq.${email}`)
      .eq('tenant', tenant);  // <-- filter penting

    if (dbError) {
      console.error("Gagal update tenant:", dbError);
      return res.status(500).json({ error: "Gagal update status tenant: " + dbError.message });
    }

    // UPSERT ke schools dengan menyertakan tenant
    if (subdomain && subdomain !== '-') {
      await adminSupabase
        .from('schools')
        .upsert([{
          id: subdomain,
          nama_sekolah: school_name || 'Sekolah Baru',
          created_at: activationDate.toISOString(),
          tenant: tenant,   // <-- simpan tenant
        }], { onConflict: 'id' });
    }

    return res.status(200).json({ success: true, message: "Sekolah berhasil diverifikasi!" });

  } catch (error: any) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
