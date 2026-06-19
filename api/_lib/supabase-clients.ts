import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseAdminProduct = 'lms' | 'siput' | 'kuliner';

const PRODUCT_URL_ENV_KEYS: Record<SupabaseAdminProduct, string[]> = {
  siput: ['SIPUT_SUPABASE_URL', 'SUPABASE_URL_SIPUT', 'VITE_SUPABASE_URL_SIPUT'],
  lms: ['LMS_SUPABASE_URL', 'SUPABASE_URL_LMS', 'VITE_SUPABASE_URL_LMS'],
  kuliner: ['KULINER_SUPABASE_URL', 'SUPABASE_URL_KULINER', 'VITE_SUPABASE_URL_KULINER'],
};

const PRODUCT_SERVICE_ROLE_ENV_KEYS: Record<SupabaseAdminProduct, string[]> = {
  siput: [
    'SIPUT_SUPABASE_SERVICE_ROLE_KEY',
    'SIPUT_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY_SIPUT',
  ],
  lms: ['LMS_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY_LMS'],
  kuliner: ['KULINER_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY_KULINER'],
};

const PRODUCT_ANON_ENV_KEYS: Record<SupabaseAdminProduct, string[]> = {
  siput: ['VITE_SUPABASE_ANON_KEY_SIPUT', 'SUPABASE_ANON_KEY_SIPUT'],
  lms: ['VITE_SUPABASE_ANON_KEY_LMS', 'SUPABASE_ANON_KEY_LMS'],
  kuliner: ['VITE_SUPABASE_ANON_KEY_KULINER', 'SUPABASE_ANON_KEY_KULINER'],
};

const MASTER_URL_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
] as const;

const MASTER_SERVICE_ROLE_ENV_KEYS = ['SUPABASE_SERVICE_ROLE_KEY'] as const;

const MASTER_ANON_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
] as const;

function readEnv(keys: readonly string[]): string {
  for (const key of keys) {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      const value = String(process.env[key]).trim();
      if (value) return value;
    }
    if (typeof import.meta !== 'undefined') {
      const value = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
      if (value?.trim()) return value.trim();
    }
  }
  return '';
}

export function resolveProductSupabaseUrl(product: SupabaseAdminProduct): string {
  const url = readEnv(PRODUCT_URL_ENV_KEYS[product]);
  if (!url) {
    throw new Error(
      `URL Supabase ${product.toUpperCase()} belum dikonfigurasi. Set salah satu: ${PRODUCT_URL_ENV_KEYS[product].join(', ')}`
    );
  }
  return url.replace(/\/$/, '');
}

export function resolveProductAnonKey(product: SupabaseAdminProduct): string {
  const key = readEnv(PRODUCT_ANON_ENV_KEYS[product]);
  if (!key) {
    throw new Error(
      `Anon key Supabase ${product.toUpperCase()} belum dikonfigurasi. Set salah satu: ${PRODUCT_ANON_ENV_KEYS[product].join(', ')}`
    );
  }
  return key;
}

export function resolveMasterSupabaseUrl(): string {
  const url = readEnv(MASTER_URL_ENV_KEYS);
  if (!url) {
    throw new Error(
      `URL Supabase master belum dikonfigurasi. Set salah satu: ${MASTER_URL_ENV_KEYS.join(', ')}`
    );
  }
  return url.replace(/\/$/, '');
}

function resolveMasterServiceRoleKey(): string {
  const key = readEnv(MASTER_SERVICE_ROLE_ENV_KEYS);
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.');
  }
  return key;
}

function resolveProductServiceRoleKey(product: SupabaseAdminProduct): string {
  const key = readEnv(PRODUCT_SERVICE_ROLE_ENV_KEYS[product]);
  if (!key) {
    throw new Error(
      `Service role Supabase ${product.toUpperCase()} belum dikonfigurasi. Set salah satu: ${PRODUCT_SERVICE_ROLE_ENV_KEYS[product].join(', ')}`
    );
  }
  return key;
}

function assertServerOnly(_fn: string): void {
  // API routes selalu berjalan di Node serverless Vercel — skip cek window.
}

const adminClientCache = new Map<string, SupabaseClient>();

function cacheAdminClient(cacheKey: string, client: SupabaseClient): SupabaseClient {
  adminClientCache.set(cacheKey, client);
  return client;
}

export function getSupabaseAdmin(product: SupabaseAdminProduct): SupabaseClient {
  assertServerOnly('getSupabaseAdmin');

  const url = resolveProductSupabaseUrl(product);
  const cacheKey = `admin:${product}:${url}`;
  const cached = adminClientCache.get(cacheKey);
  if (cached) return cached;

  const serviceKey = resolveProductServiceRoleKey(product);
  return cacheAdminClient(
    cacheKey,
    createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  );
}

/** Fallback ke proyek Rasyatech utama (registrations master). */
export function getSupabaseMasterAdmin(): SupabaseClient {
  assertServerOnly('getSupabaseMasterAdmin');

  const url = resolveMasterSupabaseUrl();
  const cacheKey = `admin:master:${url}`;
  const cached = adminClientCache.get(cacheKey);
  if (cached) return cached;

  return cacheAdminClient(
    cacheKey,
    createClient(url, resolveMasterServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  );
}

export function normalizeProductAppToAdminProduct(
  productApp: string | null | undefined
): SupabaseAdminProduct | 'master' {
  const value = String(productApp || '').trim().toLowerCase();
  if (!value) return 'master';
  if (value === 'siput') return 'siput';
  if (value === 'lms' || value.includes('armilla') || value.includes('kesetaraan')) {
    return 'lms';
  }
  if (
    ['scanbite', 'restoran', 'resto', 'instafood', 'instafoto', 'kuliner'].some((segment) =>
      value.includes(segment)
    )
  ) {
    return 'kuliner';
  }
  return 'master';
}

export function getSupabaseAdminForProductApp(productApp: string): SupabaseClient {
  const product = normalizeProductAppToAdminProduct(productApp);
  if (product === 'master') return getSupabaseMasterAdmin();
  return getSupabaseAdmin(product);
}

/** Client anon per produk — untuk browser / signUp fallback. */
export function getSupabaseAnon(product: SupabaseAdminProduct): SupabaseClient {
  const url = resolveProductSupabaseUrl(product);
  const key = resolveProductAnonKey(product);
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
