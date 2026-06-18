import { supabase } from './supabase';
import { supabaseKuliner } from './supabase-kuliner';

async function countRegistrations(
  label: string,
  query: () => Promise<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  try {
    const { count, error } = await query();
    if (error) {
      console.warn(`[registration-stats] ${label}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.warn(`[registration-stats] ${label} exception:`, err);
    return 0;
  }
}

/**
 * Total akumulasi baris registrations — Supabase utama (LMS/SIPUT) + Kuliner.
 * Tidak pernah throw; gagal parsial mengembalikan jumlah dari DB yang masih OK.
 */
export async function fetchTotalPendaftarCount(): Promise<number> {
  try {
    const mainTotal = await countRegistrations('main DB', async () => {
      const result = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true });
      return { count: result.count, error: result.error };
    });

    const hasKuliner =
      Boolean(import.meta.env.VITE_SUPABASE_URL_KULINER) &&
      Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY_KULINER);

    if (!hasKuliner) {
      return mainTotal;
    }

    const kulinerTotal = await countRegistrations('kuliner DB', async () => {
      const result = await supabaseKuliner
        .from('registrations')
        .select('id', { count: 'exact', head: true });
      return { count: result.count, error: result.error };
    });

    return mainTotal + kulinerTotal;
  } catch (err) {
    console.warn('[registration-stats] unexpected error:', err);
    return 0;
  }
}
