import { createClient } from '@supabase/supabase-js';

// DANGER: Credentials hardcoded for prototyping purposes.
// Do NOT commit these to production or share this codebase publicly.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://erosuotjshhmhduoprwi.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3N1b3Rqc2hobWhkdW9wcndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NzAsImV4cCI6MjA5Mzg0MzQ3MH0.h2JrBMEEVlnQWq5v23g6LVryU1sclFyH6lq_vafCAhs";

// Debug: Log all environment variables to find the correct names
console.log("Supabase Debug - All Env Variables:", import.meta.env);

// Helper to check configuration
const isConfigured = supabaseUrl && supabaseKey;

if (!isConfigured) {
  console.error(
    "%c CRITICAL: Supabase Configuration Missing! %c\n\n" +
    "Application cannot connect to the database because VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is undefined.\n" +
    "Please check the browser console for a list of available environment variables.",
    "background: red; color: white; font-size: 20px; font-weight: bold;",
    ""
  );
}

// Create a safe client or a dummy one that warns if used
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      })
    } as any;
