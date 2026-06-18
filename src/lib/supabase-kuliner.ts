import { createClient } from '@supabase/supabase-js';

/** Tabel outlet/konfigurasi tenant di DB Kuliner (sebelumnya `sb_settings`). */
export const KULINER_TENANT_TABLE = 'tenant' as const;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_KULINER;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_KULINER;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase Kuliner credentials missing. Form submissions may fail.');
}

export const supabaseKuliner = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
