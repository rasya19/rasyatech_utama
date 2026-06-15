import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. SET HEADERS CORS
  const origin = req.headers.origin || 'https://rasyatech.rsch.my.id';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. TANGANI PREFLIGHT
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. BATASI HANYA UNTUK METHOD POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const registrationId = req.body.registrationId || req.body.schoolId;
  const subdomain = req.body.subdomain;
  
  if (!registrationId) {
      return res.status(400).json({ 
          error: "registrationId is required",
          received: { body: req.body } 
      });
  }

  // 4. VALIDASI KONFIGURASI SERVER (ENV)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const adminSupabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 5a. Ambil data pendaftaran dulu untuk mendapatkan subdomain jika diperlukan
    const { data: reg, error: fetchError } = await adminSupabase
      .from('tenant_master')
      .select('subdomain')
      .eq('id', registrationId)
      .single();

    const finalSubdomain = subdomain || reg?.subdomain;

    // 5b. UPDATE STATUS DI DATABASE (Reset status dan auth_uid)
    const { error: dbError } = await adminSupabase
      .from('tenant_master')
      .update({ 
        status: 'pending',
        auth_uid: null
      })
      .eq('id', registrationId);

    if (dbError) {
        return res.status(400).json({ error: `Database error: ${dbError.message}` });
    }

    // 5c. HAPUS DATA DI TABEL schools (Multi-tenant)
    if (finalSubdomain && finalSubdomain !== '-') {
      await adminSupabase
        .from('schools')
        .delete()
        .eq('id', finalSubdomain);
    }

    // 6. RESPON SUKSES
    return res.status(200).json({ 
        success: true, 
        message: "Verifikasi berhasil dibatalkan!" 
    });

  } catch (error: any) {
    console.error("Backend Error (Unverify):", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
