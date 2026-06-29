import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_KULINER;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_KULINER;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase Kuliner credentials missing. Form submissions may fail.');
}

export const supabaseKuliner = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
