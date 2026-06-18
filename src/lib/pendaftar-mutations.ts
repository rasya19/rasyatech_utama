import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveTenantUuidForRegistration, type TenantProductTab } from './tenant-lookup';

export type PendaftarProductTab =
  | 'lms'
  | 'scanbite'
  | 'restoran_asli'
  | 'siput'
  | 'instafoto';

export function isMainDbTab(tab: PendaftarProductTab): boolean {
  return tab === 'lms' || tab === 'siput';
}

export function isKulinerTab(tab: PendaftarProductTab): boolean {
  return !isMainDbTab(tab);
}

/** Nilai kolom `tenant` (text) di DB Kuliner — bukan UUID. */
export function kulinerTenantString(tab: PendaftarProductTab): string {
  switch (tab) {
    case 'scanbite':
      return 'scanbite';
    case 'restoran_asli':
      return 'restoran_asli';
    case 'instafoto':
      return 'instafoto';
    default:
      return tab;
  }
}

export type StatusUpdatePayload = {
  payload: Record<string, unknown>;
  selectColumns: string;
};

/** Bangun payload update sesuai cluster DB (Kuliner vs Main). */
export async function buildRegistrationStatusPayload(
  tab: PendaftarProductTab,
  activating: boolean,
  client: SupabaseClient,
  registrationRow: Record<string, unknown>
): Promise<StatusUpdatePayload> {
  const payload: Record<string, unknown> = {
    is_approved: activating,
    status: activating ? 'verified' : 'pending',
  };

  if (isKulinerTab(tab)) {
    if (activating) {
      payload.tenant = kulinerTenantString(tab);
    }
    return {
      payload,
      selectColumns: 'id, tenant, status, is_approved',
    };
  }

  if (activating) {
    const tenantUuid = await resolveTenantUuidForRegistration(
      tab as TenantProductTab,
      client,
      registrationRow
    );
    if (tenantUuid) {
      payload.tenant_id = tenantUuid;
      payload.tenant_master_id = tenantUuid;
    }
  }

  return {
    payload,
    selectColumns: 'id, tenant_id, tenant_master_id, status, is_approved',
  };
}

export type LocalStatusPatch = {
  status: 'pending' | 'verified';
  is_approved: boolean;
  tenant?: string;
  tenant_id?: string | null;
  tenant_master_id?: string | null;
};

/** Patch state lokal + _raw setelah update sukses. */
export function buildLocalStatusPatch(
  tab: PendaftarProductTab,
  activating: boolean,
  updatedRow: Record<string, unknown>
): LocalStatusPatch {
  const patch: LocalStatusPatch = {
    status: activating ? 'verified' : 'pending',
    is_approved: activating,
  };

  if (isKulinerTab(tab)) {
    if (activating) {
      patch.tenant = String(updatedRow.tenant ?? kulinerTenantString(tab));
    }
    return patch;
  }

  if (activating) {
    patch.tenant_id = updatedRow.tenant_id ? String(updatedRow.tenant_id) : null;
    patch.tenant_master_id = updatedRow.tenant_master_id
      ? String(updatedRow.tenant_master_id)
      : null;
  }

  return patch;
}
