import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';

export type TenantProductDbTab = Extract<PendaftarProductTab, 'lms' | 'siput'>;

/** Supabase client khusus DB produk tenant — BUKAN master Rasyatech. */
export function createTenantProductClient(tab: TenantProductDbTab): SupabaseClient {
  const url =
    tab === 'siput'
      ? (import.meta.env.VITE_SUPABASE_URL_SIPUT as string)
      : (import.meta.env.VITE_SUPABASE_URL_LMS as string);
  const anonKey =
    tab === 'siput'
      ? (import.meta.env.VITE_SUPABASE_ANON_KEY_SIPUT as string)
      : (import.meta.env.VITE_SUPABASE_ANON_KEY_LMS as string);

  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      `Kredensial Supabase ${tab.toUpperCase()} belum dikonfigurasi (VITE_SUPABASE_URL_${tab.toUpperCase()} / VITE_SUPABASE_ANON_KEY_${tab.toUpperCase()}).`
    );
  }

  return createClient(url.trim(), anonKey.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
