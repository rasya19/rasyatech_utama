import type { PendaftarProductTab } from './pendaftar-mutations';
import { getSupabaseAdmin } from './supabase-clients';
import {
  buildProvisioningSubdomain,
  normalizeTenantSubdomain,
  stripUndefinedPayloadFields,
  insertRowAdaptive,
} from './tenant-insert-utils';
import { deriveSlugFromRegistration } from './provision-slug';
import { provisionMainTenantOnApprovalServer } from './provision-tenant-server';
import { provisionTenantAuthUser } from './provision-tenant-auth-server';
import { buildTenantPortalUrl } from './tenant-url';
import { toProductApp } from './saas-product-options';
import {
  extractPlainPasswordFromRegistration,
  type TenantAuthProvisionResult,
  type TenantProductDbTab,
  type TenantRegistrationProvisionResult,
} from './provision-registration-shared';

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

export async function provisionTenantRegistrationOnApprovalServer(
  tab: TenantProductDbTab,
  registrationRow: Record<string, unknown>
): Promise<TenantRegistrationProvisionResult> {
  const tenantClient = getSupabaseAdmin(tab);
  const cleanSlug = normalizeTenantSubdomain(deriveSlugFromRegistration(registrationRow));
  const provisioningSubdomain = buildProvisioningSubdomain(cleanSlug, tab);

  const tenant = await provisionMainTenantOnApprovalServer(tab, registrationRow);

  const email = resolveRegistrationEmail(registrationRow);
  const plainPassword = extractPlainPasswordFromRegistration(registrationRow);
  const portalUrl = buildTenantPortalUrl(provisioningSubdomain, toProductApp(tab));
  const redirectTo = `${portalUrl.replace(/\/$/, '')}/reset-password`;

  const authResult = await provisionTenantAuthUser({
    product: tab,
    email,
    password: plainPassword,
    redirectTo,
    metadata: {
      tenant_subdomain: provisioningSubdomain,
      product_app: toProductApp(tab),
      business_name: String(registrationRow.business_name || registrationRow.school_name || '').trim(),
    },
  });

  const auth: TenantAuthProvisionResult = {
    userId: authResult.userId,
    created: authResult.created,
    magicLinkSent: authResult.magicLinkSent,
    message: authResult.message,
  };

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
