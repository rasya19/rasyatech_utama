import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { getSupabaseAnon, type SupabaseAdminProduct } from './supabase-clients';

export type TenantProductDbTab = Extract<PendaftarProductTab, 'lms' | 'siput'>;

function tabToProduct(tab: TenantProductDbTab): SupabaseAdminProduct {
  return tab === 'siput' ? 'siput' : 'lms';
}

/** Supabase client anon khusus DB produk tenant — BUKAN master Rasyatech. */
export function createTenantProductClient(tab: TenantProductDbTab): SupabaseClient {
  return getSupabaseAnon(tabToProduct(tab));
}
