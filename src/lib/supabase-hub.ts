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
import {
  resolveProductAnonKey,
  resolveProductSupabaseUrl,
  type SupabaseAdminProduct,
} from './supabase-clients';

// ─── Master client (always present) ──────────────────────────────────────────

const MASTER_URL = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  ''
).trim();

const MASTER_KEY = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  ''
).trim();

if (!MASTER_URL || !MASTER_KEY) {
  console.error('[supabase-hub] CRITICAL: Master Supabase credentials missing.');
}

export const supabaseMaster: SupabaseClient = createClient(MASTER_URL || '', MASTER_KEY || '');

function productCredentials(product: SupabaseAdminProduct): { url: string; key: string } {
  return {
    url: resolveProductSupabaseUrl(product),
    key: resolveProductAnonKey(product),
  };
}

function readOptionalProductEnv(urlKey: string, keyKey: string): { url: string; key: string } | null {
  const url =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[urlKey]) ||
    (typeof process !== 'undefined' && process.env?.[urlKey]) ||
    '';
  const key =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[keyKey]) ||
    (typeof process !== 'undefined' && process.env?.[keyKey]) ||
    '';
  if (!String(url).trim() || !String(key).trim()) return null;
  return { url: String(url).trim(), key: String(key).trim() };
}

// ─── Per-product credential map (LMS/SIPUT wajib env produk — tanpa fallback master) ─

const productEnvMap: Record<ProductType, { url: string; key: string } | null> = {
  lms: tryProductCredentials('lms'),
  siput: tryProductCredentials('siput'),
  scanbite:
    readOptionalProductEnv('VITE_SUPABASE_URL_SCANBITE', 'VITE_SUPABASE_ANON_KEY_SCANBITE') ||
    tryProductCredentials('kuliner'),
  instafood:
    readOptionalProductEnv('VITE_SUPABASE_URL_INSTAFOOD', 'VITE_SUPABASE_ANON_KEY_INSTAFOOD') ||
    tryProductCredentials('kuliner'),
  resto:
    readOptionalProductEnv('VITE_SUPABASE_URL_RESTO', 'VITE_SUPABASE_ANON_KEY_RESTO') ||
    tryProductCredentials('kuliner'),
};

function tryProductCredentials(product: SupabaseAdminProduct): { url: string; key: string } | null {
  try {
    return productCredentials(product);
  } catch {
    return null;
  }
}

// ─── Client cache (one instance per unique URL) ───────────────────────────────

const clientCache = new Map<string, SupabaseClient>();

/**
 * Returns the Supabase client for the given product type.
 * LMS/SIPUT wajib punya env produk sendiri — tidak fallback ke master.
 */
export function getProductClient(product: ProductType): SupabaseClient {
  const credentials = productEnvMap[product];
  if (!credentials?.url || !credentials.key) {
    throw new Error(
      `[supabase-hub] Kredensial Supabase ${product.toUpperCase()} belum dikonfigurasi. ` +
        `Set VITE_SUPABASE_URL_${product.toUpperCase()} dan VITE_SUPABASE_ANON_KEY_${product.toUpperCase()} di Vercel.`
    );
  }

  const { url, key } = credentials;
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
