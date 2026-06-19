import type { PendaftarProductTab } from './pendaftar-mutations';
import type { TenantProductDbTab } from './create-tenant-client';
import type { ProvisionResult } from './provision-tenant-on-approval';
import { deriveSlugFromRegistration } from './provision-tenant-on-approval';
import {
  buildProvisioningSubdomain,
  normalizeTenantSubdomain,
} from './tenant-insert-utils';

export type TenantAuthProvisionResult = {
  userId: string;
  created: boolean;
  magicLinkSent: boolean;
  message?: string;
};

export type TenantRegistrationProvisionResult = {
  tenant: ProvisionResult;
  auth: TenantAuthProvisionResult;
  registrationId: string;
};

const PROVISION_API_PATH = '/api/provision-tenant-registration';

function isMainProductTab(tab: PendaftarProductTab): tab is TenantProductDbTab {
  return tab === 'lms' || tab === 'siput';
}

/** Ambil password plain text dari baris pendaftaran — abaikan hash bcrypt. */
export function extractPlainPasswordFromRegistration(
  row: Record<string, unknown>
): string | null {
  const candidates = [
    row.password_plain,
    row.plain_password,
    row.registration_password,
    row.password,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (!value) continue;
    if (value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')) {
      continue;
    }
    if (value.length < 6) continue;
    return value;
  }

  return null;
}

function buildProvisioningPayloadPreview(
  tab: TenantProductDbTab,
  registrationRow: Record<string, unknown>
) {
  const cleanSlug = normalizeTenantSubdomain(deriveSlugFromRegistration(registrationRow));
  const slug = buildProvisioningSubdomain(cleanSlug, tab);

  return {
    tab,
    tenantId: registrationRow.tenant_id ?? registrationRow.tenant_master_id ?? null,
    registrationId: registrationRow.id ?? null,
    slug,
    cleanSlug,
    subdomain: registrationRow.subdomain ?? registrationRow.kode_tenant ?? null,
    npsn: registrationRow.npsn ?? null,
    paket:
      registrationRow.package_tier ??
      registrationRow.selected_package ??
      registrationRow.paket_langganan ??
      null,
    email: registrationRow.email ?? registrationRow.admin_email ?? null,
    product_app: registrationRow.product_app ?? registrationRow.product_type ?? tab,
    business_name:
      registrationRow.business_name ?? registrationRow.school_name ?? registrationRow.tenant_name,
  };
}

/**
 * Provisioning lengkap setelah approval LMS/SIPUT (via API server + service role):
 * 1. INSERT tenant di DB produk yang benar (SIPUT → mqvxretzntpkwxspbvap, LMS → proyek LMS)
 * 2. Buat akun Supabase Auth di DB produk
 * 3. INSERT registrations di DB produk
 */
export async function provisionTenantRegistrationOnApproval(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<TenantRegistrationProvisionResult> {
  if (!isMainProductTab(tab)) {
    throw new Error('Provisioning registrations tenant hanya untuk tab LMS/SIPUT.');
  }

  const preview = buildProvisioningPayloadPreview(tab, registrationRow);
  console.log('[FE] Payload ke /api/provision-tenant-registration:', preview);

  if (!preview.slug) {
    console.error('[FE] SLUG KOSONG!', {
      tab,
      cleanSlug: preview.cleanSlug,
      registrationRow,
    });
    throw new Error('Subdomain/slug kosong — provisioning dibatalkan sebelum fetch API.');
  }

  const requestBody = { tab, registrationRow };

  const response = await fetch(PROVISION_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('[FE] Response provisioning:', response.status, responseText);

  let body: Record<string, unknown> = {};
  if (responseText) {
    try {
      body = JSON.parse(responseText) as Record<string, unknown>;
    } catch (parseError) {
      console.error('[FE] Response provisioning bukan JSON:', parseError);
    }
  }

  if (!response.ok) {
    const detail =
      body.detail ||
      body.error ||
      body.message ||
      (typeof body.step === 'string' ? `Gagal di langkah ${body.step}` : null) ||
      (responseText && !responseText.startsWith('{')
        ? responseText.trim().slice(0, 300)
        : null);
    console.error('[FE] Provisioning gagal:', {
      status: response.status,
      detail,
      body,
    });
    throw new Error(String(detail || `Provisioning gagal (HTTP ${response.status}).`));
  }

  return body as TenantRegistrationProvisionResult;
}
