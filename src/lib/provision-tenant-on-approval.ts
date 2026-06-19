import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import {
  logSupabaseInsertError,
  isMissingColumnError,
  DEFAULT_PACKAGE_TIER,
  resolvePackageTier,
  normalizeTenantSubdomain,
} from './tenant-insert-utils';

export type ProvisionResult = {
  tenantId: string | null;
  slug: string;
  created: boolean;
  skipped?: boolean;
};

export { DEFAULT_PACKAGE_TIER, resolvePackageTier };

async function postProvisionApi<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String(data.error || 'Provisioning tenant gagal.'));
  }

  return data as T;
}

/** Normalisasi slug/subdomain dari baris registrations. */
export function deriveSlugFromRegistration(row: Record<string, unknown>): string {
  const explicit = String(row.kode_tenant || row.subdomain || row.slug || '')
    .trim()
    .toLowerCase();
  if (explicit && explicit !== '-') {
    return normalizeTenantSubdomain(explicit);
  }

  const name = String(
    row.business_name ||
      row.school_name ||
      row.tenant_name ||
      row.full_name ||
      row.admin_name ||
      ''
  );
  return normalizeTenantSubdomain(name);
}

/**
 * INSERT baris tenant di DB produk (LMS / SIPUT) setelah approval registrations (DB Rasyatech).
 * Dijalankan via API server dengan service role — bukan master/LMS fallback.
 */
export async function provisionMainTenantOnApproval(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  return postProvisionApi<ProvisionResult>('/api/provision-main-tenant', {
    tab,
    registrationRow,
  });
}

/**
 * INSERT baris tenant di DB produk kuliner setelah approval registrations.
 */
export async function provisionKulinerTenantOnApproval(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  return postProvisionApi<ProvisionResult>('/api/provision-main-tenant', {
    tab,
    registrationRow,
  });
}

/** Tautkan UUID tenant baru ke baris registrations di DB Rasyatech (master). */
export async function linkMainRegistrationTenantId(
  registrationClient: SupabaseClient,
  registrationId: string | number,
  tenantId: string
): Promise<void> {
  const { error: tenantIdError } = await registrationClient
    .from('registrations')
    .update({ tenant_id: tenantId })
    .eq('id', registrationId);

  if (tenantIdError) {
    logSupabaseInsertError('link-registration tenant_id', tenantIdError, { tenant_id: tenantId });
    throw new Error(`Gagal menautkan tenant_id: ${tenantIdError.message}`);
  }

  const { error: masterError } = await registrationClient
    .from('registrations')
    .update({ tenant_master_id: tenantId })
    .eq('id', registrationId);

  if (masterError && !isMissingColumnError(masterError.message, 'tenant_master_id')) {
    logSupabaseInsertError('link-registration tenant_master_id', masterError, {
      tenant_master_id: tenantId,
    });
    console.warn('[provision-main-tenant] tenant_master_id tidak diupdate:', masterError.message);
  }
}
