import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";
import bcrypt from 'bcrypt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const origin = req.headers.origin || 'https://rasyatech.rsch.my.id';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, password, tenant } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
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
    // 1. Cari user di school_admins dengan filter tenant
    const { data: user, error: userError } = await adminSupabase
      .from('school_admins')
      .select('*')
      .eq('email', email)
      .eq('tenant', tenant)   // <-- filter tenant
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    // 2. Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    // 3. Jika login berhasil, generate token atau session (sesuai kebutuhan)
    // Misal buat JWT atau sesi
    // ...

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        tenant: user.tenant,
      },
      // token: tokenJWT,
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
