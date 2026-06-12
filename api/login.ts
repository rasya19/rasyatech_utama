import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!, // ganti dari SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ganti dari SUPABASE_SERVICE_KEY
);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { subdomain, email, password } = req.body;

  // 1. Cek user di registrasi
  const { data: user } = await supabase
    .from('registrasi')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('admin_email', email)
    .single();

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Email/password salah' });
  }

  // 2. CEK POS SATPAM: ambil dari rasyatenant
  const { data: tenant } = await supabase
    .from('rasyatenant')
    .select('account_status, db_host, school_name')
    .eq('slug', subdomain)
    .single();

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant tidak ditemukan' });
  }

  // 3. SIKAT KALO STATUS GA BENER
  if (tenant.account_status === 'suspend') {
    return res.status(403).json({ error: 'Akun ditangguhkan karena tagihan macet' });
  }
  if (tenant.account_status === 'expired') {
    return res.status(403).json({ error: 'Masa kontrak habis. Silakan perpanjang' });
  }
  if (tenant.account_status === 'trial') {
    return res.status(200).json({ 
      warning: 'Masa trial aktif', 
      school_name: tenant.school_name,
      db_host: tenant.db_host 
    });
  }

  // 4. Lolos satpam
  return res.status(200).json({ 
    success: true, 
    school_name: tenant.school_name,
    db_host: tenant.db_host 
  });
}
