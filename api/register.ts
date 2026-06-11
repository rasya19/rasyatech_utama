import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { email, password, ...formData } = req.body;
    const { school_name, subdomain, admin_email } = req.body;
    
    // 1. Insert ke schools
    const { data: school, error: schoolError } = await supabase
      .from('schools').insert([{
        name: school_name,
        subdomain,
        status: 'trial',
        product_type: 'lms-kesetaraan'
      }]).select().single();
    if (schoolError) return res.status(400).json({ error: schoolError.message });

    // 2. Hash password + insert user
    const password_hash = await bcrypt.hash(password, 10);
    const { error: userError } = await supabase
      .from('users').insert([{
        school_id: school.id,
        email: admin_email,
        password_hash,
        role: 'admin'
      }]);
    if (userError) return res.status(400).json({ error: userError.message });

    return res.status(200).json({ success: true, slug: subdomain });
    
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}