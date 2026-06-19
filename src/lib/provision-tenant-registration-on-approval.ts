import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendaftarProductTab } from './pendaftar-mutations';
import { createTenantProductClient, type TenantProductDbTab } from './create-tenant-client';
import {
  buildProvisioningSubdomain,
  logSupabaseInsertError,
  normalizeTenantSubdomain,
  stripUndefinedPayloadFields,
  insertRowAdaptive,
} from './tenant-insert-utils';
import {
  deriveSlugFromRegistration,
  provisionMainTenantOnApproval,
  type ProvisionResult,
} from './provision-tenant-on-approval';
import { buildTenantPortalUrl } from './tenant-url';
import { toProductApp } from './saas-product-options';

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

function resolveRegistrationEmail(row: Record<string, unknown>): string {
  const email = String(row.email || row.admin_email || '').trim();
  if (!email || email === '-') {
    throw new Error('Email pendaftar tidak valid.');
  }
  return email;
}

function buildTenantRegistrationInsertRow(
  tab: TenantProductDbTab,
  row: Record<string, unknown>,
  authUserId: string,
  tenantId: string | null,
  provisioningSubdomain: string
): Record<string, unknown> {
  const productApp = String(row.product_app || row.product_type || toProductApp(tab)).toUpperCase();
  const now = new Date().toISOString();

  return stripUndefinedPayloadFields({
    id: authUserId,
    is_approved: true,
    status: 'verified',
    approved: true,
    full_name: String(row.full_name || row.admin_name || '').trim(),
    admin_name: String(row.admin_name || row.full_name || '').trim(),
    email: resolveRegistrationEmail(row),
    admin_email: resolveRegistrationEmail(row),
    whatsapp: String(row.whatsapp || row.whatsapp_number || '').trim() || null,
    whatsapp_number: String(row.whatsapp_number || row.whatsapp || '').trim() || null,
    business_name: String(row.business_name || row.school_name || row.tenant_name || '').trim(),
    school_name: String(row.school_name || row.business_name || row.tenant_name || '').trim(),
    product_type: productApp,
    product_app: productApp,
    business_type: productApp,
    package_tier: row.package_tier || row.selected_package || row.paket_langganan || 'free',
    selected_package: row.selected_package || row.package_tier || row.paket_langganan || 'free',
    kode_tenant: provisioningSubdomain,
    subdomain: provisioningSubdomain,
    npsn: row.npsn ?? null,
    tabel_count: row.tabel_count ?? row.table_count ?? null,
    tenant_id: tenantId,
    source: 'master_approval_migration',
    created_at: row.created_at || now,
    updated_at: now,
  });
}

async function createTenantAuthViaApi(
  tab: TenantProductDbTab,
  email: string,
  plainPassword: string | null,
  redirectTo: string,
  metadata: Record<string, unknown>
): Promise<TenantAuthProvisionResult> {
  const response = await fetch('/api/provision-tenant-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: tab,
      email,
      password: plainPassword,
      redirectTo,
      metadata,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(String(body.error || 'Gagal membuat akun auth di database tenant.'));
  }

  const userId = String(body.userId || '');
  if (!userId) {
    throw new Error('API auth tenant tidak mengembalikan userId.');
  }

  return {
    userId,
    created: body.created === true,
    magicLinkSent: body.magicLinkSent === true,
    message: body.message ? String(body.message) : undefined,
  };
}

/** Fallback: signUp via anon client bila service role API tidak tersedia. */
async function createTenantAuthViaSignUp(
  tenantClient: SupabaseClient,
  email: string,
  plainPassword: string,
  metadata: Record<string, unknown>
): Promise<TenantAuthProvisionResult> {
  const { data, error } = await tenantClient.auth.signUp({
    email,
    password: plainPassword,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw new Error(`signUp tenant gagal: ${error.message}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error('signUp tenant tidak mengembalikan user id.');
  }

  return {
    userId,
    created: true,
    magicLinkSent: false,
    message: 'Akun dibuat via signUp — konfirmasi email mungkin diperlukan.',
  };
}

async function createTenantAuthUser(
  tab: TenantProductDbTab,
  tenantClient: SupabaseClient,
  row: Record<string, unknown>,
  provisioningSubdomain: string
): Promise<TenantAuthProvisionResult> {
  const email = resolveRegistrationEmail(row);
  const plainPassword = extractPlainPasswordFromRegistration(row);
  const portalUrl = buildTenantPortalUrl(provisioningSubdomain, toProductApp(tab));
  const redirectTo = `${portalUrl.replace(/\/$/, '')}/reset-password`;
  const metadata = {
    tenant_subdomain: provisioningSubdomain,
    product_app: toProductApp(tab),
    business_name: String(row.business_name || row.school_name || '').trim(),
  };

  try {
    return await createTenantAuthViaApi(tab, email, plainPassword, redirectTo, metadata);
  } catch (apiError) {
    console.warn('[provision-tenant-registration] API auth gagal, coba signUp:', apiError);

    if (!plainPassword) {
      throw new Error(
        'Password asli tidak tersimpan di pendaftaran dan service role tenant belum dikonfigurasi. ' +
          'Set SUPABASE_SERVICE_ROLE_KEY_SIPUT di Vercel agar sistem dapat mengirim magic link reset password.'
      );
    }

    return createTenantAuthViaSignUp(tenantClient, email, plainPassword, metadata);
  }
}

/**
 * Provisioning lengkap setelah approval LMS/SIPUT:
 * 1. INSERT tenant di DB produk
 * 2. Buat akun Supabase Auth di DB produk
 * 3. INSERT registrations di DB produk (id = auth user id)
 */
export async function provisionTenantRegistrationOnApproval(
  tab: PendaftarProductTab,
  registrationRow: Record<string, unknown>
): Promise<TenantRegistrationProvisionResult> {
  if (!isMainProductTab(tab)) {
    throw new Error('Provisioning registrations tenant hanya untuk tab LMS/SIPUT.');
  }

  const tenantClient = createTenantProductClient(tab);
  const cleanSlug = normalizeTenantSubdomain(deriveSlugFromRegistration(registrationRow));
  const provisioningSubdomain = buildProvisioningSubdomain(cleanSlug, tab);

  const tenant = await provisionMainTenantOnApproval(tab, registrationRow);

  const auth = await createTenantAuthUser(tab, tenantClient, registrationRow, provisioningSubdomain);

  const registrationPayload = buildTenantRegistrationInsertRow(
    tab,
    registrationRow,
    auth.userId,
    tenant.tenantId,
    provisioningSubdomain
  );

  await insertRowAdaptive(
    tenantClient,
    'registrations',
    registrationPayload,
    'provision-tenant-registration'
  );

  return {
    tenant,
    auth,
    registrationId: auth.userId,
  };
}
