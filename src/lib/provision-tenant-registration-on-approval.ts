import type { PendaftarProductTab } from './pendaftar-mutations';
import type { TenantProductDbTab } from './create-tenant-client';
import type { ProvisionResult } from './provision-tenant-on-approval';

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

  const response = await fetch('/api/provision-tenant-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab, registrationRow }),
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String(body.error || 'Gagal provisioning tenant di database produk.'));
  }

  return body as TenantRegistrationProvisionResult;
}
