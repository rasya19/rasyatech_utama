import type { PostgrestError } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { inferProductAppFromInstitutionalSlug } from './tenant-host-parser';

export const DEFAULT_PACKAGE_TIER = 'basic';

/** Regex selaras constraint DB provisioning: huruf kecil + angka saja, 3–32 karakter. */
export const TENANT_SUBDOMAIN_REGEX = /^[a-z0-9]{3,32}$/;

/**
 * Sanitasi subdomain sebelum INSERT tenant (provisioning).
 * Huruf kecil semua, hapus strip/spasi/karakter lain.
 * Contoh: 'TK-Armilla-Nusa' → 'tkarmillanusa'
 */
export function normalizeTenantSubdomain(raw: string): string {
  let slug = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (slug.length < 3) {
    slug = `${slug || 'tenant'}app`.slice(0, 32);
  }

  return slug.slice(0, 32);
}

export function validateTenantSubdomain(subdomain: string): string | null {
  if (!TENANT_SUBDOMAIN_REGEX.test(subdomain)) {
    return `Format subdomain tidak valid: "${subdomain}". Gunakan huruf kecil dan angka (3–32 karakter, tanpa strip).`;
  }
  return null;
}

export type TenantInsertPayload = {
  tenant_name: string;
  subdomain: string;
  package_tier: string;
  source: string;
  npsn: string;
  product_app: string;
  subdomain_host: string;
  admin_name: string;
  admin_email: string;
  whatsapp: string;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Hapus key undefined agar PostgREST tidak menolak payload. */
export function stripUndefinedPayloadFields(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

/** Regex hostname penuh (Scanbite/Kuliner): slug.domain.tld */
export const TENANT_SUBDOMAIN_HOST_REGEX =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function validateSubdomainHost(hostname: string): string | null {
  const host = String(hostname || '').trim().toLowerCase();
  if (!TENANT_SUBDOMAIN_HOST_REGEX.test(host)) {
    return `Format subdomain_host tidak valid: "${hostname}". Gunakan hostname penuh, mis. tokokopi.rsch.web.id`;
  }
  return null;
}

export function buildSubdomainHost(subdomain: string, tenantDomain: string): string {
  const domain = tenantDomain.replace(/^\.+/, '').toLowerCase();
  return `${normalizeTenantSubdomain(subdomain)}.${domain}`;
}

/**
 * Subdomain final untuk provisioning — huruf kecil, tanpa strip.
 * SIPUT: tkarmillanusa (dari TK-Armilla-Nusa) atau kb{nama} jika belum ada awalan.
 * LMS: pkbm{nama} atau skb{nama} jika belum ada awalan.
 */
export function buildProvisioningSubdomain(
  cleanSlug: string,
  tab: PendaftarProductTab
): string {
  const base = normalizeTenantSubdomain(cleanSlug);
  if (!base) return '';

  if (tab === 'siput') {
    if (/^(kb|tk|sps|tpa|paud)/.test(base)) {
      return base;
    }
    return normalizeTenantSubdomain(`kb${base}`);
  }

  if (/^(pkbm|skb)/.test(base)) {
    return base;
  }
  return normalizeTenantSubdomain(`pkbm${base}`);
}

/** Paksa subdomain + subdomain_host konsisten tepat sebelum INSERT. */
export function sanitizeTenantInsertPayload(
  row: Record<string, unknown>,
  tenantDomain: string
): Record<string, unknown> {
  const cleaned = stripUndefinedPayloadFields(row);
  const subdomain = normalizeTenantSubdomain(
    String(cleaned.subdomain || cleaned.slug || cleaned.kode_tenant || '')
  );
  const validationError = validateTenantSubdomain(subdomain);
  if (validationError) {
    throw new Error(validationError);
  }

  cleaned.subdomain = subdomain;
  cleaned.subdomain_host = buildSubdomainHost(subdomain, tenantDomain);
  if ('slug' in cleaned) {
    cleaned.slug = subdomain;
  }
  if ('kode_tenant' in cleaned) {
    cleaned.kode_tenant = subdomain;
  }

  return cleaned;
}

/**
 * Sanitasi payload tenant Scanbite/Kuliner — hanya subdomain_host (tanpa kolom subdomain).
 */
export function sanitizeKulinerTenantInsertPayload(
  row: Record<string, unknown>,
  tenantDomain: string
): Record<string, unknown> {
  const cleaned = stripUndefinedPayloadFields(row);
  delete cleaned.subdomain;

  const slug = normalizeTenantSubdomain(
    String(cleaned.slug || cleaned.kode_tenant || cleaned.subdomain_host || '')
  );
  const subdomainHost = String(cleaned.subdomain_host || '').includes('.')
    ? String(cleaned.subdomain_host).trim().toLowerCase()
    : buildSubdomainHost(slug, tenantDomain);

  const validationError = validateSubdomainHost(subdomainHost);
  if (validationError) {
    throw new Error(validationError);
  }

  cleaned.subdomain_host = subdomainHost;
  if ('slug' in cleaned) {
    cleaned.slug = slug;
  }
  if ('kode_tenant' in cleaned) {
    cleaned.kode_tenant = slug;
  }

  return cleaned;
}

export function isMissingColumnError(message: string, column: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(`column "${column}"`) ||
    lower.includes(`column ${column}`) ||
    lower.includes(`'${column}'`) ||
    (lower.includes('could not find') && lower.includes(column))
  );
}

/** Log detail eror Supabase + payload yang dikirim (debug kolom gagal). */
export function logSupabaseInsertError(
  context: string,
  error: PostgrestError | Error | unknown,
  payload?: Record<string, unknown>
): void {
  const pgError = error as PostgrestError;
  console.error(`[${context}] Supabase error:`, {
    message: pgError?.message ?? String(error),
    code: pgError?.code,
    details: pgError?.details,
    hint: pgError?.hint,
    payloadKeys: payload ? Object.keys(payload) : [],
    payload,
  });
}

export function resolvePackageTier(row: Record<string, unknown>): string {
  const product = String(row.product_app || row.product_type || '').toUpperCase();
  if (product && product !== 'LMS') {
    return 'free';
  }

  const tier = String(
    row.package_tier ||
      row.paket_langganan ||
      row.selected_package ||
      row.package ||
      DEFAULT_PACKAGE_TIER
  ).trim();
  return tier || DEFAULT_PACKAGE_TIER;
}

export function resolveProductApp(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>,
  subdomain: string
): string {
  const fromRow = String(registrationRow.product_app || registrationRow.product_type || '')
    .trim()
    .toUpperCase();
  if (fromRow) return fromRow;

  const fromInstitutional = inferProductAppFromInstitutionalSlug(subdomain);
  if (fromInstitutional) return fromInstitutional.toUpperCase();

  if (tab === 'siput') return 'SIPUT';
  if (tab === 'lms') return 'LMS';
  if (tab === 'scanbite') return 'SCANBITE';
  if (tab === 'restoran_asli') return 'RESTO';
  if (tab === 'instafoto') return 'INSTAFOOD';

  return 'LMS';
}

export function registrationDisplayName(row: Record<string, unknown>, fallback: string): string {
  return String(
    row.school_name ||
      row.business_name ||
      row.tenant_name ||
      row.full_name ||
      row.admin_name ||
      fallback
  );
}

/** Objek INSERT wajib untuk tabel tenant (DB produk LMS/SIPUT) — semua kolom terisi. */
export function buildMainTenantInsertRow(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>,
  institutionalSubdomain: string,
  tenantDomain: string
): Record<string, unknown> {
  const subdomain = normalizeTenantSubdomain(institutionalSubdomain);
  const validationError = validateTenantSubdomain(subdomain);
  if (validationError) {
    throw new Error(validationError);
  }

  const tenantName =
    registrationDisplayName(registrationRow, subdomain).trim() || subdomain;
  const packageTier = resolvePackageTier(registrationRow);
  const productApp = resolveProductApp(tab, registrationRow, subdomain);
  const now = new Date().toISOString();
  const adminEmail = String(
    registrationRow.admin_email || registrationRow.email || ''
  ).trim();
  const safeEmail =
    adminEmail && adminEmail !== '-'
      ? adminEmail
      : `no-reply+${subdomain}@rasyatech.local`;

  return stripUndefinedPayloadFields({
    tenant_name: tenantName,
    subdomain,
    package_tier: packageTier,
    source: String(registrationRow.source || 'manajemen_pendaftar_approval'),
    npsn:
      registrationRow.npsn != null && String(registrationRow.npsn).trim() !== ''
        ? String(registrationRow.npsn)
        : '-',
    product_app: productApp,
    subdomain_host: buildSubdomainHost(subdomain, tenantDomain),
    admin_name: String(
      registrationRow.admin_name || registrationRow.full_name || tenantName
    ).trim() || tenantName,
    admin_email: safeEmail,
    whatsapp:
      String(registrationRow.whatsapp || registrationRow.whatsapp_number || '').trim() ||
      '-',
    status: 'verified',
    created_at: now,
    updated_at: now,
  });
}

export function buildInstitutionalSubdomainForTab(
  cleanSlug: string,
  tab: PendaftarProductTab
): string {
  return buildProvisioningSubdomain(cleanSlug, tab);
}
