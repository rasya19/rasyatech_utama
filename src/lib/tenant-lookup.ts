import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { supabaseKuliner } from './supabase-kuliner';

export type TenantProductTab =
  | 'lms'
  | 'scanbite'
  | 'restoran_asli'
  | 'siput'
  | 'instafoto';

/** Kunci product_app / slug di tabel tenant untuk tiap tab produk. */
const PRODUCT_APP_KEYS: Record<TenantProductTab, string[]> = {
  lms: ['lms', 'armilla', 'kesetaraan'],
  siput: ['siput'],
  scanbite: ['scanbite'],
  restoran_asli: ['restoran_asli', 'resto', 'restoran'],
  instafoto: ['instafoto', 'instafood', 'Instafood'],
};

async function queryTenantIdByProductApp(
  client: SupabaseClient,
  productApp: string
): Promise<string | null> {
  const { data, error } = await client
    .from('tenant')
    .select('id')
    .eq('product_app', productApp)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.includes('Could not find the table')) return null;
    console.warn('[tenant-lookup] query tenant by product_app:', error.message);
    return null;
  }

  return data?.id ? String(data.id) : null;
}

async function queryTenantIdBySubdomain(
  client: SupabaseClient,
  subdomain: string
): Promise<string | null> {
  const { data, error } = await client
    .from('tenant')
    .select('id')
    .eq('subdomain', subdomain.trim().toLowerCase())
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.includes('Could not find the table')) return null;
    console.warn('[tenant-lookup] query tenant by subdomain:', error.message);
    return null;
  }

  return data?.id ? String(data.id) : null;
}

async function queryTenantIdBySlugOrName(
  client: SupabaseClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await client
    .from('tenant')
    .select('id')
    .or(`subdomain.eq.${slug},tenant_name.ilike.%${slug}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.includes('Could not find the table')) return null;
    console.warn('[tenant-lookup] query tenant by slug/name:', error.message);
    return null;
  }

  return data?.id ? String(data.id) : null;
}

async function resolveFromClient(
  client: SupabaseClient,
  activeTab: TenantProductTab
): Promise<string | null> {
  const keys = PRODUCT_APP_KEYS[activeTab];

  for (const key of keys) {
    const id = await queryTenantIdByProductApp(client, key);
    if (id) return id;
  }

  for (const key of keys) {
    const id = await queryTenantIdBySlugOrName(client, key);
    if (id) return id;
  }

  return null;
}

/**
 * Ambil UUID tenant induk dari tabel `tenant` sesuai produk aktif.
 */
export async function resolveTenantUuid(
  activeTab: TenantProductTab,
  registrationClient: SupabaseClient
): Promise<string | null> {
  const fromRegistrationDb = await resolveFromClient(registrationClient, activeTab);
  if (fromRegistrationDb) return fromRegistrationDb;

  if (registrationClient !== supabase) {
    const fromMainHub = await resolveFromClient(supabase, activeTab);
    if (fromMainHub) return fromMainHub;
  }

  return null;
}

/**
 * Lookup UUID tenant untuk satu baris pendaftar — prioritas subdomain spesifik tenant.
 */
export async function resolveTenantUuidForRegistration(
  activeTab: TenantProductTab,
  registrationClient: SupabaseClient,
  registrationRow?: Record<string, unknown>
): Promise<string | null> {
  const subdomain = String(registrationRow?.subdomain || '').trim().toLowerCase();

  if (subdomain && subdomain !== '-') {
    const fromRegDb = await queryTenantIdBySubdomain(registrationClient, subdomain);
    if (fromRegDb) {
      console.log('[tenant-lookup] UUID via subdomain (registration DB):', fromRegDb);
      return fromRegDb;
    }

    const fromMain = await queryTenantIdBySubdomain(supabase, subdomain);
    if (fromMain) {
      console.log('[tenant-lookup] UUID via subdomain (main DB):', fromMain);
      return fromMain;
    }
  }

  const fromTab = await resolveTenantUuid(activeTab, registrationClient);
  if (fromTab) {
    console.log('[tenant-lookup] UUID via product_app tab:', activeTab, fromTab);
    return fromTab;
  }

  // Kuliner: coba tabel tenant di Supabase Kuliner bila ada
  if (registrationClient === supabaseKuliner) {
    const fromKulinerProduct = await resolveFromClient(supabaseKuliner, activeTab);
    if (fromKulinerProduct) return fromKulinerProduct;
  }

  return null;
}
