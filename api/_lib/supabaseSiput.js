import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

function readSiputUrl() {
  return (
    process.env.SIPUT_SUPABASE_URL ||
    process.env.SUPABASE_URL_SIPUT ||
    process.env.VITE_SUPABASE_URL_SIPUT ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
}

function readSiputServiceRoleKey() {
  return (
    process.env.SIPUT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SIPUT_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY_SIPUT ||
    ''
  ).trim();
}

export function getSupabaseAdminSiput() {
  if (cachedClient) return cachedClient;

  const url = readSiputUrl();
  const serviceKey = readSiputServiceRoleKey();

  if (!url) {
    throw new Error(
      'SIPUT_SUPABASE_URL belum dikonfigurasi di Vercel (project rasyatech).'
    );
  }
  if (!serviceKey) {
    throw new Error(
      'SIPUT_SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di Vercel (project rasyatech).'
    );
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}

export const supabaseAdminSiput = getSupabaseAdminSiput;
