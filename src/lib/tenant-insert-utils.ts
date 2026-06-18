import type { PostgrestError } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { buildInstitutionalSubdomain, inferProductAppFromInstitutionalSlug } from './tenant-host-parser';

export const DEFAULT_PACKAGE_TIER = 'basic';

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

/** Objek INSERT wajib untuk tabel tenant (Main DB) — semua kolom skema inti terisi. */
export function buildMainTenantInsertRow(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>,
  institutionalSubdomain: string,
  tenantDomain: string
): TenantInsertPayload & Record<string, unknown> {
  const tenantName = registrationDisplayName(registrationRow, institutionalSubdomain);
  const packageTier = resolvePackageTier(registrationRow);
  const productApp = resolveProductApp(tab, registrationRow, institutionalSubdomain);
  const now = new Date().toISOString();
  const domain = tenantDomain.replace(/^\.+/, '');

  return {
    tenant_name: tenantName,
    subdomain: institutionalSubdomain,
    package_tier: packageTier,
    source: String(registrationRow.source || 'manajemen_pendaftar_approval'),
    npsn: String(registrationRow.npsn || '-'),
    product_app: productApp,
    subdomain_host: `${institutionalSubdomain}.${domain}`,
    admin_name: String(registrationRow.admin_name || registrationRow.full_name || tenantName),
    admin_email: String(registrationRow.admin_email || registrationRow.email || ''),
    whatsapp: String(registrationRow.whatsapp || registrationRow.whatsapp_number || ''),
    status: 'verified',
    created_at: now,
    updated_at: now,
  };
}

export function buildInstitutionalSubdomainForTab(
  cleanSlug: string,
  tab: PendaftarProductTab
): string {
  const pillar = tab === 'siput' ? 'siput' : 'lms';
  return buildInstitutionalSubdomain(cleanSlug, pillar);
}
