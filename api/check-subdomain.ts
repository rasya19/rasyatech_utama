import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. SET HEADERS CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. TANGANI PREFLIGHT
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. BATASI HANYA UNTUK METHOD GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subdomain } = req.query;
  
  if (!subdomain) {
      return res.status(400).json({ error: "Subdomain is required" });
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
    // 5. QUERY CHECK SUBDOMAIN
    // Using adminSupabase to query the registrations table for the subdomain
    const { data, error } = await adminSupabase
      .from('registrations')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('status', 'verified')
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: "Subdomain not found" });
        }
        return res.status(400).json({ error: error.message });
    }

    // 6. RESPON SUKSES
    return res.status(200).json({ 
        success: true, 
        data
    });

  } catch (error: any) {
    console.error("Backend Error (Check Subdomain):", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
