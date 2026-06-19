import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { kulinerTenantString } from './pendaftar-mutations';
import { getSupabaseAdminSiput } from './supabaseSiput';
import { getSupabaseAdmin } from './supabase-clients';
import type { ProductType } from './products';
import {
  buildMainTenantInsertRow,
  logSupabaseInsertError,
  registrationDisplayName,
  resolvePackageTier,
  resolveProductApp,
  buildProvisioningSubdomain,
  sanitizeTenantInsertPayload,
  sanitizeKulinerTenantInsertPayload,
  insertRowAdaptive,
  stripUndefinedPayloadFields,
  buildSubdomainHost,
} from './tenant-insert-utils';
import { getKulinerTenantDomain, getEduTenantDomain } from './tenant-url';
import {
  deriveSlugFromRegistration,
  type ProvisionResult,
} from './provision-slug';

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

function isUuid(value: unknown): boolean {
  if (value == null) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function getTenantAdminClient(tab: PendaftarProductTab): SupabaseClient {
  if (tab === 'siput') {
    return getSupabaseAdminSiput();
  }
  if (tab === 'lms') {
    return getSupabaseAdmin('lms');
  }
  return getSupabaseAdmin('kuliner');
}

/** INSERT tenant di DB produk dengan service role (bypass RLS). */
export async function provisionMainTenantOnApprovalServer(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const productType = tabToProductType(tab);
  const tenantClient = getTenantAdminClient(tab);
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

  const data = await insertRowAdaptive(
    tenantClient,
    'tenant',
    payload,
    'provision-main-tenant'
  );

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug: provisioningSubdomain,
    created: true,
  };
}

export async function provisionKulinerTenantOnApprovalServer(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const productType = tabToProductType(tab);
  const tenantClient = getSupabaseAdmin('kuliner');
  const tenantDomain = getKulinerTenantDomain();

  const slug = deriveSlugFromRegistration(registrationRow);
  if (!slug) {
    throw new Error('Slug tenant kuliner tidak valid — periksa nama bisnis/kode_tenant pendaftar.');
  }

  const subdomainHost = buildSubdomainHost(slug, tenantDomain);

  const { data: existing, error: lookupError } = await tenantClient
    .from('tenant')
    .select('id')
    .or(`slug.eq.${slug},subdomain_host.eq.${subdomainHost}`)
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
    subdomain_host: subdomainHost,
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

  const payload = sanitizeKulinerTenantInsertPayload(insertRow, tenantDomain);
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
