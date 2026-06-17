import { supabase } from './supabase';
import { supabaseKuliner } from './supabase-kuliner';

/** Total akumulasi baris registrations — Supabase utama (LMS/SIPUT) + Kuliner. */
export async function fetchTotalPendaftarCount(): Promise<number> {
  let total = 0;

  const { count: mainCount, error: mainError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true });

  if (!mainError && mainCount != null) {
    total += mainCount;
  } else if (mainError) {
    console.warn('[registration-stats] main DB:', mainError.message);
  }

  const hasKuliner =
    Boolean(import.meta.env.VITE_SUPABASE_URL_KULINER) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY_KULINER);

  if (hasKuliner) {
    const { count: kulinerCount, error: kulinerError } = await supabaseKuliner
      .from('registrations')
      .select('id', { count: 'exact', head: true });

    if (!kulinerError && kulinerCount != null) {
      total += kulinerCount;
    } else if (kulinerError) {
      console.warn('[registration-stats] kuliner DB:', kulinerError.message);
    }
  }

  return total;
}
