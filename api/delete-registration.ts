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

  if (req.method !== 'DELETE' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, tenant } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }
  if (!tenant) {
    return res.status(400).json({ error: "tenant is required" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey || !supabaseUrl) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Ambil data pendaftaran dari tabel tenant (bukan tenant_master)
    const { data: reg, error: fetchError } = await adminSupabase
      .from('tenant')
      .select('id, subdomain, auth_uid')
      .eq('id', id)
      .eq('tenant', tenant)   // <-- filter tenant
      .single();

    if (fetchError) {
       console.error(`Error fetching registration ${id}:`, fetchError.message);
       return res.status(404).json({ error: "Pendaftaran tidak ditemukan untuk tenant ini" });
    }

    // 2. Hapus data di tabel schools (filter tenant)
    if (reg?.subdomain && reg.subdomain !== '-') {
      await adminSupabase
        .from('schools')
        .delete()
        .eq('id', reg.subdomain)
        .eq('tenant', tenant);   // <-- filter tenant
    }
    await adminSupabase
      .from('schools')
      .delete()
      .eq('registration_id', id)
      .eq('tenant', tenant);   // <-- filter tenant

    // 3. Hapus User Auth jika ada (tidak perlu filter tenant, karena auth terpisah)
    if (reg?.auth_uid) {
      await adminSupabase.auth.admin.deleteUser(reg.auth_uid);
    }

    // 4. Hapus pendaftaran utama dari tabel tenant (dengan filter tenant)
    const { error: deleteError } = await adminSupabase
      .from('tenant')
      .delete()
      .eq('id', id)
      .eq('tenant', tenant);   // <-- filter tenant

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: "Pendaftar berhasil dihapus permanen!" });
  } catch (error: any) {
    console.error("Delete registration error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
