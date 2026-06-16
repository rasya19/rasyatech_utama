import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

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

  // ========== PERUBAHAN 1: Tambahkan kode_tenant di destructuring ==========
  const { registrationId, email, school_name, subdomain, kode_tenant } = req.body;
  
  // ========== PERUBAHAN 2: Validasi kode_tenant wajib ada ==========
  if (!(registrationId || email) || !subdomain) {
    return res.status(400).json({ error: "registrationId/email and subdomain are required" });
  }
  if (!kode_tenant) {
    return res.status(400).json({ error: "kode_tenant is required" });
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
    
    // ========== PERUBAHAN 3: Ganti tenant_master → tenant, tambahkan filter kode_tenant ==========
    const { error: dbError } = await adminSupabase
      .from('tenant')  // <-- Ganti dari tenant_master menjadi tenant
      .update({ 
        status: 'verified',
        subdomain: subdomain
      })
      .or(`id.eq.${registrationId},admin_email.eq.${email}`)
      .eq('kode_tenant', kode_tenant);  // <-- WAJIB filter!

    if (dbError) {
      console.error("Gagal update tenant:", dbError);
      return res.status(500).json({ error: "Gagal update status tenant: " + dbError.message });
    }

    // ========== PERUBAHAN 4: Tambahkan kode_tenant di UPSERT schools ==========
    if (subdomain && subdomain !== '-') {
      await adminSupabase
        .from('schools') 
        .upsert([{
          id: subdomain,
          nama_sekolah: school_name || 'Sekolah Baru', 
          created_at: activationDate.toISOString(),
          kode_tenant: kode_tenant,  // <-- simpan tenant di schools juga
        }], { onConflict: 'id' });
    }

    return res.status(200).json({ 
        success: true, 
        message: "Sekolah berhasil diverifikasi!" 
    });

  } catch (error: any) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
