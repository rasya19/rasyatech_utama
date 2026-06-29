import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_SIPUT || import.meta.env.VITE_SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_SIPUT || import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3N1b3Rqc2hobWhkdW9wcndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NzAsImV4cCI6MjA5Mzg0MzQ3MH0.h2JrBMEEVlnQWq5v23g6LVryU1sclFyH6lq_vafCAhs";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase Siput credentials missing. Form submissions may fail.');
}

export const supabaseSiput = createClient(
  supabaseUrl,
  supabaseAnonKey
);
