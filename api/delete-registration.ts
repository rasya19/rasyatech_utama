import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // We allow both DELETE and GET for easier testing, though DELETE is better
  if (req.method !== 'DELETE' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey || !supabaseUrl) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Ambil data pendaftaran
    const { data: reg, error: fetchError } = await adminSupabase
      .from('registrations')
      .select('id, subdomain, auth_uid')
      .eq('id', id)
      .single();

    if (fetchError) {
       console.error(`Error fetching registration ${id}:`, fetchError.message);
       return res.status(404).json({ error: "Pendaftaran tidak ditemukan" });
    }

    // 2. Hapus data di tabel schools
    if (reg?.subdomain && reg.subdomain !== '-') {
      await adminSupabase.from('schools').delete().eq('id', reg.subdomain);
    }
    await adminSupabase.from('schools').delete().eq('registration_id', id);

    // 3. Hapus User Auth jika ada
    if (reg?.auth_uid) {
      await adminSupabase.auth.admin.deleteUser(reg.auth_uid);
    }

    // 4. Hapus pendaftaran utama
    const { error: deleteError } = await adminSupabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: "Pendaftar berhasil dihapus permanen!" });
  } catch (error: any) {
    console.error("Delete registration error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
