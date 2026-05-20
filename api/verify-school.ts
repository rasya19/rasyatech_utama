import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. SET HEADERS CORS (Surat Izin Browser)
  const origin = req.headers.origin || 'https://rasyatech.rsch.my.id';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. TANGANI PREFLIGHT (Tes Ombak Browser)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. BATASI HANYA UNTUK METHOD POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { registrationId, email, school_name, subdomain } = req.body;
  
  if (!(registrationId || email) || !subdomain) {
    return res.status(400).json({ error: "registrationId/email and subdomain are required" });
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
    
    // 1. UPDATE STATUS DI TABEL registrations
    const { error: dbError } = await adminSupabase
      .from('registrations')
      .update({ 
        status: 'verified',
        subdomain: subdomain, // Pastikan subdomain juga diupdate di tabel registrations
        activated_at: activationDate.toISOString(),
        expired_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      })
      .or(`id.eq.${registrationId},admin_email.eq.${email}`);

    if (dbError) {
      console.error("Gagal update registrations:", dbError);
      return res.status(500).json({ error: "Gagal update status pendaftaran: " + dbError.message });
    }

    // 2. INSERT/UPSERT KE TABEL schools
    if (subdomain && subdomain !== '-') {
      await adminSupabase
        .from('schools') 
        .upsert([{
          id: subdomain,
          nama_sekolah: school_name || 'Sekolah Baru', 
          created_at: activationDate.toISOString()
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