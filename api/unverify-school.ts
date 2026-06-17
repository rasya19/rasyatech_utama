import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || 'https://rasyatech.rsch.my.id';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Ambil data dari body
  const { registrationId, subdomain, tenant } = req.body;
  // RegistrationId bisa juga bernama schoolId
  const id = registrationId || req.body.schoolId;

  if (!id) {
    return res.status(400).json({ 
      error: "registrationId is required",
      received: { body: req.body } 
    });
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
    // 1. Ambil data tenant untuk mendapatkan subdomain jika tidak dikirim
    const { data: reg, error: fetchError } = await adminSupabase
      .from('tenant') // ganti dari tenant_master ke tenant
      .select('subdomain')
      .eq('id', id)
      .eq('tenant', tenant) // filter tambahan
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, anggap tidak ada error jika tidak ditemukan
      console.warn("Tenant not found or error:", fetchError);
    }

    const finalSubdomain = subdomain || reg?.subdomain;

    // 2. UPDATE status menjadi pending dan hapus auth_uid
    const { error: dbError } = await adminSupabase
      .from('tenant') // ganti dari  ke tenant
      .update({ 
        status: 'pending',
        auth_uid: null
      })
      .eq('id', id)
      .eq('tenant', tenant); // filter wajib

    if (dbError) {
      return res.status(400).json({ error: `Database error: ${dbError.message}` });
    }

    // 3. HAPUS data di tabel schools jika ada subdomain
    if (finalSubdomain && finalSubdomain !== '-') {
      const { error: deleteError } = await adminSupabase
        .from('schools')
        .delete()
        .eq('id', finalSubdomain)
        .eq('tenant', tenant); // filter juga (jika schools punya kolom tenant)

      if (deleteError) {
        console.warn("Gagal hapus schools:", deleteError);
        // Tidak perlu gagalkan seluruh operasi, hanya peringatan
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Verifikasi berhasil dibatalkan!" 
    });

  } catch (error: any) {
    console.error("Backend Error (Unverify):", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
