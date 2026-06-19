import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function readSiputUrl(): string {
  return (
    process.env.SIPUT_SUPABASE_URL ||
    process.env.SUPABASE_URL_SIPUT ||
    process.env.VITE_SUPABASE_URL_SIPUT ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
}

function readSiputServiceRoleKey(): string {
  return (
    process.env.SIPUT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SIPUT_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY_SIPUT ||
    ''
  ).trim();
}

/**
 * Supabase admin client khusus DB SIPUT (proyek terpisah).
 * Wajib set di Vercel project rasyatech:
 *   SIPUT_SUPABASE_URL
 *   SIPUT_SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseAdminSiput(): SupabaseClient {
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

/** Alias untuk import di route handler. */
export const supabaseAdminSiput = getSupabaseAdminSiput;
