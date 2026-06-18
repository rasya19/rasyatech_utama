import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';

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
  const explicit = String(row.subdomain || row.slug || '')
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

function registrationDisplayName(row: Record<string, unknown>, fallback: string): string {
  return String(
    row.school_name ||
      row.business_name ||
      row.tenant_name ||
      row.full_name ||
      row.admin_name ||
      fallback
  );
}

/**
 * INSERT baris tenant di Main DB (LMS / SIPUT) setelah approval registrations.
 */
export async function provisionMainTenantOnApproval(
  client: SupabaseClient,
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const slug = deriveSlugFromRegistration(registrationRow);
  if (!slug) {
    throw new Error('Subdomain tidak valid — isi nama instansi/bisnis pada pendaftaran.');
  }

  const { data: existing, error: lookupError } = await client
    .from('tenant')
    .select('id')
    .eq('subdomain', slug)
    .maybeSingle();

  if (lookupError) {
    console.warn('[provision-main-tenant] lookup:', lookupError.message);
  }

  if (existing?.id) {
    return { tenantId: String(existing.id), slug, created: false, skipped: true };
  }

  const tenantName = registrationDisplayName(registrationRow, slug);
  const productApp =
    tab === 'siput'
      ? 'siput'
      : String(registrationRow.product_type || registrationRow.product_name || 'lms').toLowerCase();

  const now = new Date().toISOString();
  const domain = TENANT_DOMAIN.replace(/^\.+/, '');

  const insertRow: Record<string, unknown> = {
    tenant_name: tenantName,
    product_app: productApp,
    subdomain: slug,
    subdomain_host: `${slug}.${domain}`,
    admin_name: String(registrationRow.admin_name || registrationRow.full_name || tenantName),
    admin_email: String(registrationRow.admin_email || registrationRow.email || ''),
    whatsapp: String(registrationRow.whatsapp || registrationRow.whatsapp_number || ''),
    npsn: String(registrationRow.npsn || '-'),
    package_tier: String(
      registrationRow.paket_langganan ||
        registrationRow.selected_package ||
        registrationRow.package_tier ||
        'standard'
    ),
    status: 'verified',
    source: 'manajemen_pendaftar_approval',
    created_at: now,
    updated_at: now,
  };

  const regId = registrationRow.id;
  if (isUuid(regId)) {
    insertRow.registration_id = regId;
  }

  const { data, error } = await client.from('tenant').insert([insertRow]).select('id').single();

  if (error) {
    throw new Error(`Gagal membuat tenant (Main DB): ${error.message}`);
  }

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug,
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

  const { data, error } = await client.from('tenant').insert([insertRow]).select('id').single();

  if (error) {
    throw new Error(`Gagal membuat tenant (Kuliner DB): ${error.message}`);
  }

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug,
    created: true,
  };
}

/** Tautkan UUID tenant baru ke baris registrations (Main DB). */
export async function linkMainRegistrationTenantId(
  client: SupabaseClient,
  registrationId: string | number,
  tenantId: string
): Promise<void> {
  const { error } = await client
    .from('registrations')
    .update({ tenant_id: tenantId, tenant_master_id: tenantId })
    .eq('id', registrationId);

  if (error) {
    console.warn('[provision-main-tenant] link registration:', error.message);
  }
}
