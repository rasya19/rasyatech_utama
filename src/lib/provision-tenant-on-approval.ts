import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { kulinerTenantString } from './pendaftar-mutations';
import { getProductClient } from './supabase-hub';
import type { ProductType } from './types/products';
import {
  buildMainTenantInsertRow,
  logSupabaseInsertError,
  isMissingColumnError,
  DEFAULT_PACKAGE_TIER,
  resolvePackageTier,
  registrationDisplayName,
  normalizeTenantSubdomain,
  stripUndefinedPayloadFields,
  buildSubdomainHost,
  resolveProductApp,
  buildProvisioningSubdomain,
  sanitizeTenantInsertPayload,
} from './tenant-insert-utils';
import { getKulinerTenantDomain, getEduTenantDomain } from './tenant-url';

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

function tabToProductType(tab: PendaftarProductTab): ProductType {
  switch (tab) {
    case 'siput':
      return 'siput';
    case 'scanbite':
      return 'scanbite';
    case 'restoran_asli':
      return 'resto';
    case 'instafoto':
      return 'instafood';
    default:
      return 'lms';
  }
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

export { DEFAULT_PACKAGE_TIER, resolvePackageTier };

/**
 * INSERT baris tenant di DB produk (LMS / SIPUT) setelah approval registrations (DB Rasyatech).
 */
export async function provisionMainTenantOnApproval(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const productType = tabToProductType(tab);
  const tenantClient = getProductClient(productType);
  const tenantDomain = getEduTenantDomain();

  const cleanSlug = deriveSlugFromRegistration(registrationRow);
  if (!cleanSlug) {
    throw new Error('Subdomain tidak valid — isi nama instansi/bisnis pada pendaftaran.');
  }

  const provisioningSubdomain = buildProvisioningSubdomain(cleanSlug, tab);

  const insertRow = buildMainTenantInsertRow(
    tab,
    registrationRow,
    provisioningSubdomain,
    tenantDomain
  );

  const { data: existing, error: lookupError } = await tenantClient
    .from('tenant')
    .select('id')
    .or(`subdomain.eq.${provisioningSubdomain},subdomain.eq.${cleanSlug}`)
    .maybeSingle();

  if (lookupError) {
    console.warn('[provision-main-tenant] lookup:', lookupError.message);
  }

  if (existing?.id) {
    return {
      tenantId: String(existing.id),
      slug: provisioningSubdomain,
      created: false,
      skipped: true,
    };
  }

  const regId = registrationRow.id;
  if (isUuid(regId)) {
    insertRow.registration_id = regId;
  }

  const payload = sanitizeTenantInsertPayload(insertRow, tenantDomain);
  console.log('[provision-main-tenant] INSERT DB produk:', productType, payload);

  const { data, error } = await tenantClient
    .from('tenant')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    logSupabaseInsertError('provision-main-tenant', error, payload);
    throw new Error(
      `Gagal membuat tenant (${productType}): ${error.message} | kolom: ${Object.keys(payload).join(', ')}`
    );
  }

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug: provisioningSubdomain,
    created: true,
  };
}

/**
 * INSERT baris tenant di DB produk kuliner setelah approval registrations (DB Kuliner/Rasyatech).
 */
export async function provisionKulinerTenantOnApproval(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const productType = tabToProductType(tab);
  const tenantClient = getProductClient(productType);
  const tenantDomain = getKulinerTenantDomain();

  const slug = deriveSlugFromRegistration(registrationRow);
  if (!slug) {
    throw new Error('Slug tenant kuliner tidak valid — periksa nama bisnis/kode_tenant pendaftar.');
  }

  const { data: existing, error: lookupError } = await tenantClient
    .from('tenant')
    .select('id')
    .or(`slug.eq.${slug},subdomain.eq.${slug}`)
    .maybeSingle();

  if (lookupError) {
    console.warn('[provision-kuliner-tenant] lookup:', lookupError.message);
  }

  if (existing?.id) {
    return { tenantId: String(existing.id), slug, created: false, skipped: true };
  }

  const cafeName = registrationDisplayName(registrationRow, slug).trim() || slug;
  const productApp = resolveProductApp(tab, registrationRow, slug);
  const now = new Date().toISOString();

  const insertRow = stripUndefinedPayloadFields({
    tenant_name: cafeName,
    cafe_name: cafeName,
    slug,
    subdomain: slug,
    subdomain_host: buildSubdomainHost(slug, tenantDomain),
    product_app: productApp,
    business_type: productApp,
    package_tier: resolvePackageTier(registrationRow),
    currency_code: 'IDR',
    phone:
      String(registrationRow.whatsapp || registrationRow.whatsapp_number || '').trim() || '-',
    admin_name: String(registrationRow.full_name || cafeName).trim() || cafeName,
    admin_email: String(registrationRow.email || '').trim() || `no-reply+${slug}@rasyatech.local`,
    whatsapp:
      String(registrationRow.whatsapp || registrationRow.whatsapp_number || '').trim() || '-',
    tenant: kulinerTenantString(tab),
    status: 'verified',
    source: 'manajemen_pendaftar_approval',
    updated_at: now,
    created_at: now,
  });

  const regId = registrationRow.id;
  if (isUuid(regId)) {
    insertRow.registration_id = regId;
  } else if (isUuid(registrationRow.tenant_id)) {
    insertRow.tenant_id = registrationRow.tenant_id;
  }

  const payload = sanitizeTenantInsertPayload(insertRow, tenantDomain);
  console.log('[provision-kuliner-tenant] INSERT DB produk:', productType, payload);

  const { data, error } = await tenantClient
    .from('tenant')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    logSupabaseInsertError('provision-kuliner-tenant', error, payload);
    throw new Error(`Gagal membuat tenant (${productType}): ${error.message}`);
  }

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug,
    created: true,
  };
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
