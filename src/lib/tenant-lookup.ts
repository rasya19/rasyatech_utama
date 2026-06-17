import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

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
 * Dipakai untuk mengisi tenant_id & tenant_master_id di registrations.
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
