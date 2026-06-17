/**
 * Rasyatech Master Hub – Multi-Product Supabase Client Factory
 *
 * Architecture:
 *   - The "master" Supabase project (erosuotjshhmhduoprwi) acts as the
 *     Central Registration Gate and stores all tenant data plus product-
 *     specific tables (lms_*, siput_*, scanbite_*, instafood_*, resto_*).
 *
 *   - Each product *can* optionally have its own dedicated Supabase project
 *     for data isolation (scale-out). Configure via env vars below.
 *     If a product env var is absent, the factory falls back to the master.
 *
 * Env vars (add to Vercel / .env):
 *   VITE_SUPABASE_URL               – master project URL  (required)
 *   VITE_SUPABASE_ANON_KEY          – master anon key     (required)
 *   VITE_SUPABASE_URL_LMS           – Armilla LMS project (optional)
 *   VITE_SUPABASE_ANON_KEY_LMS      – Armilla LMS anon key
 *   VITE_SUPABASE_URL_SIPUT         – SIPUT project       (optional)
 *   VITE_SUPABASE_ANON_KEY_SIPUT
 *   VITE_SUPABASE_URL_SCANBITE      – Scanbite project    (optional)
 *   VITE_SUPABASE_ANON_KEY_SCANBITE
 *   VITE_SUPABASE_URL_INSTAFOOD     – Instafood project   (optional)
 *   VITE_SUPABASE_ANON_KEY_INSTAFOOD
 *   VITE_SUPABASE_URL_RESTO         – Resto POS project   (optional)
 *   VITE_SUPABASE_ANON_KEY_RESTO
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ProductType } from './types/products';

// ─── Master client (always present) ──────────────────────────────────────────

const MASTER_URL = import.meta.env.VITE_SUPABASE_URL as string;
const MASTER_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!MASTER_URL || !MASTER_KEY) {
  console.error('[supabase-hub] CRITICAL: Master Supabase credentials missing.');
}

export const supabaseMaster: SupabaseClient = createClient(
  MASTER_URL || '',
  MASTER_KEY || ''
);

// ─── Per-product credential map (falls back to master if not set) ─────────────

const productEnvMap: Record<ProductType, { url: string; key: string }> = {
  lms: {
    url: (import.meta.env.VITE_SUPABASE_URL_LMS as string) || MASTER_URL,
    key: (import.meta.env.VITE_SUPABASE_ANON_KEY_LMS as string) || MASTER_KEY,
  },
  siput: {
    url: (import.meta.env.VITE_SUPABASE_URL_SIPUT as string) || MASTER_URL,
    key: (import.meta.env.VITE_SUPABASE_ANON_KEY_SIPUT as string) || MASTER_KEY,
  },
  scanbite: {
    url: (import.meta.env.VITE_SUPABASE_URL_SCANBITE as string) || MASTER_URL,
    key: (import.meta.env.VITE_SUPABASE_ANON_KEY_SCANBITE as string) || MASTER_KEY,
  },
  instafood: {
    url: (import.meta.env.VITE_SUPABASE_URL_INSTAFOOD as string) || MASTER_URL,
    key: (import.meta.env.VITE_SUPABASE_ANON_KEY_INSTAFOOD as string) || MASTER_KEY,
  },
  resto: {
    url: (import.meta.env.VITE_SUPABASE_URL_RESTO as string) || MASTER_URL,
    key: (import.meta.env.VITE_SUPABASE_ANON_KEY_RESTO as string) || MASTER_KEY,
  },
};

// ─── Client cache (one instance per unique URL) ───────────────────────────────

const clientCache = new Map<string, SupabaseClient>();

/**
 * Returns the Supabase client for the given product type.
 * Instances are cached per project URL so we never create duplicate clients.
 */
export function getProductClient(product: ProductType): SupabaseClient {
  const { url, key } = productEnvMap[product];
  const cacheKey = url;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  if (url === MASTER_URL && key === MASTER_KEY) {
    clientCache.set(cacheKey, supabaseMaster);
    return supabaseMaster;
  }

  const client = createClient(url, key);
  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Convenience re-export: master client is used for:
 *  - Auth (single sign-on across all products)
 *  - Reading registrations / tenant metadata
 *  - Landing page data (config, payments)
 */
export { supabaseMaster as supabase };

// ─── Table name helpers (prefix guard) ───────────────────────────────────────

/**
 * Returns the correct table prefix for a product.
 * E.g. tableFor('lms', 'students') → 'lms_students'
 */
export function tableFor(product: ProductType, entity: string): string {
  return `${product}_${entity}`;
}
