import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { buildInstitutionalSubdomain } from './tenant-host-parser';
import {
  buildMainTenantInsertRow,
  logSupabaseInsertError,
  isMissingColumnError,
  DEFAULT_PACKAGE_TIER,
  resolvePackageTier,
  registrationDisplayName,
} from './tenant-insert-utils';

const TENANT_DOMAIN = import.meta.env.VITE_TENANT_DOMAIN || 'rsch.my.id';

export type ProvisionResult = {
  tenantId: string | null;
  slug: string;
  created: boolean;
  skipped?: boolean;
};

function isUuid(value: unknown): boolean {
  if (value == null) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

/** Normalisasi slug/subdomain dari baris registrations. */
export function deriveSlugFromRegistration(row: Record<string, unknown>): string {
  const explicit = String(row.kode_tenant || row.subdomain || row.slug || '')
    .trim()
    .toLowerCase();
  if (explicit && explicit !== '-') {
    return sanitizeSlug(explicit);
  }

  const name = String(
    row.business_name ||
      row.school_name ||
      row.tenant_name ||
      row.full_name ||
      row.admin_name ||
      ''
  );
  return sanitizeSlug(name);
}

function sanitizeSlug(input: string): string {
  let slug = input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length < 3) {
    slug = `${slug || 'tenant'}-app`.replace(/-+/g, '-').slice(0, 48);
  }

  return slug.slice(0, 48);
}

export { DEFAULT_PACKAGE_TIER, resolvePackageTier };

/**
 * INSERT baris tenant di Main DB (LMS / SIPUT) setelah approval registrations.
 */
export async function provisionMainTenantOnApproval(
  client: SupabaseClient,
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const cleanSlug = deriveSlugFromRegistration(registrationRow);
  if (!cleanSlug) {
    throw new Error('Subdomain tidak valid — isi nama instansi/bisnis pada pendaftaran.');
  }

  const pillar = tab === 'siput' ? 'siput' : 'lms';
  const institutionalSubdomain = buildInstitutionalSubdomain(cleanSlug, pillar);
  const insertRow = buildMainTenantInsertRow(
    tab,
    registrationRow,
    institutionalSubdomain,
    TENANT_DOMAIN
  );

  const { data: existing, error: lookupError } = await client
    .from('tenant')
    .select('id')
    .or(`subdomain.eq.${institutionalSubdomain},subdomain.eq.${cleanSlug}`)
    .maybeSingle();

  if (lookupError) {
    console.warn('[provision-main-tenant] lookup:', lookupError.message);
  }

  if (existing?.id) {
    return { tenantId: String(existing.id), slug: institutionalSubdomain, created: false, skipped: true };
  }

  const regId = registrationRow.id;
  if (isUuid(regId)) {
    insertRow.registration_id = regId;
  }

  console.log('[provision-main-tenant] INSERT payload:', insertRow);

  const { data, error } = await client.from('tenant').insert([insertRow]).select('id').single();

  if (error) {
    logSupabaseInsertError('provision-main-tenant', error, insertRow);
    throw new Error(
      `Gagal membuat tenant (Main DB): ${error.message} | kolom terkirim: ${Object.keys(insertRow).join(', ')}`
    );
  }

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug: institutionalSubdomain,
    created: true,
  };
}

/**
 * INSERT baris tenant di Kuliner DB (eks sb_settings) setelah approval registrations.
 */
export async function provisionKulinerTenantOnApproval(
  client: SupabaseClient,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const slug = deriveSlugFromRegistration(registrationRow);
  if (!slug) {
    throw new Error('Slug tenant kuliner tidak valid — periksa nama bisnis/subdomain pendaftar.');
  }

  const { data: existing, error: lookupError } = await client
    .from('tenant')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (lookupError) {
    console.warn('[provision-kuliner-tenant] lookup:', lookupError.message);
  }

  if (existing?.id) {
    return { tenantId: String(existing.id), slug, created: false, skipped: true };
  }

  const cafeName = registrationDisplayName(registrationRow, slug);
  const insertRow: Record<string, unknown> = {
    cafe_name: cafeName,
    slug,
    currency_code: 'IDR',
    phone: String(registrationRow.whatsapp || registrationRow.whatsapp_number || '') || null,
    address: String(registrationRow.address || '') || null,
    updated_at: new Date().toISOString(),
  };

  const candidateTenantId = registrationRow.tenant_id ?? registrationRow.id;
  if (isUuid(candidateTenantId)) {
    insertRow.tenant_id = candidateTenantId;
  }

  console.log('[provision-kuliner-tenant] INSERT payload:', insertRow);

  const { data, error } = await client.from('tenant').insert([insertRow]).select('id').single();

  if (error) {
    logSupabaseInsertError('provision-kuliner-tenant', error, insertRow);
    throw new Error(`Gagal membuat tenant (Kuliner DB): ${error.message}`);
  }

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug,
    created: true,
  };
}

/** Tautkan UUID tenant baru ke baris registrations (Main DB) — aman jika kolom opsional tidak ada. */
export async function linkMainRegistrationTenantId(
  client: SupabaseClient,
  registrationId: string | number,
  tenantId: string
): Promise<void> {
  const { error: tenantIdError } = await client
    .from('registrations')
    .update({ tenant_id: tenantId })
    .eq('id', registrationId);

  if (tenantIdError) {
    logSupabaseInsertError('link-registration tenant_id', tenantIdError, { tenant_id: tenantId });
    throw new Error(`Gagal menautkan tenant_id: ${tenantIdError.message}`);
  }

  const { error: masterError } = await client
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
