import type { PendaftarProductTab } from './pendaftar-mutations';
import type { ProvisionResult } from './provision-slug';

export type TenantProductDbTab = Extract<PendaftarProductTab, 'lms' | 'siput'>;

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
