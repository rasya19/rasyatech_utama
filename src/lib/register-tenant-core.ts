/**
 * Logika inti pendaftaran tenant — dipakai server Express & Vercel API.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface TenantRegistrationPayload {
  tenant_name: string;
  product_app: string;
  subdomain: string;
  admin_name: string;
  admin_email: string;
  whatsapp: string;
  npsn?: string;
  package_tier?: string;
  meta_data?: Record<string, unknown>;
  source?: string;
}

export interface TenantRegistrationResult {
  success: boolean;
  tenant_id?: string;
  registration_id?: string;
  subdomain: string;
  tenant_url: string;
  message: string;
}

const TENANT_DOMAIN = process.env.VITE_TENANT_DOMAIN || 'rsch.my.id';

function tenantUrl(subdomain: string): string {
  return `https://${subdomain}.${TENANT_DOMAIN.replace(/^\.+/, '')}`;
}

function isMissingTenantMasterTable(message: string): boolean {
  return (
    message.includes("Could not find the table 'public.tenant'") ||
    message.includes('tenant') && message.includes('schema cache')
  );
}

async function isSubdomainTaken(
  adminSupabase: SupabaseClient,
  subdomain: string
): Promise<boolean> {
  const normalized = subdomain.toLowerCase();

  const { data: fromMaster, error: masterError } = await adminSupabase
    .from('tenant')
    .select('id')
    .eq('subdomain', normalized)
    .maybeSingle();

  if (masterError && !isMissingTenantMasterTable(masterError.message)) {
    throw new Error(masterError.message);
  }

  const { data: fromRegs } = await adminSupabase
    .from('registrations')
    .select('id')
    .eq('subdomain', normalized)
    .neq('status', 'rejected')
    .maybeSingle();

  return Boolean(fromMaster || fromRegs);
}

/**
 * Simpan pendaftaran ke tenant_master (tabel master) dan registrations (legacy).
 */
export async function registerTenant(
  adminSupabase: SupabaseClient,
  payload: TenantRegistrationPayload
): Promise<TenantRegistrationResult> {
  const subdomain = payload.subdomain.trim().toLowerCase();
  const productApp = payload.product_app;

  if (await isSubdomainTaken(adminSupabase, subdomain)) {
    throw new Error('Subdomain sudah digunakan. Silakan pilih subdomain lain.');
  }

  const now = new Date().toISOString();
  const meta = payload.meta_data ?? {};

  // 1. Insert ke tenant_master (Gerbang Pendaftaran — sumber kebenaran tenant)
  const tenantMasterRow = {
    tenant_name: payload.tenant_name,
    product_app: productApp,
    subdomain,
    subdomain_host: `${subdomain}.${TENANT_DOMAIN.replace(/^\.+/, '')}`,
    admin_name: payload.admin_name,
    admin_email: payload.admin_email,
    whatsapp: payload.whatsapp,
    npsn: payload.npsn || '-',
    package_tier: payload.package_tier || 'basic',
    meta_data: meta,
    status: 'pending',
    source: payload.source || 'gerbang_pendaftaran',
    created_at: now,
    updated_at: now,
  };

  let masterData: { id: string } | null = null;
  const { data: insertedMaster, error: masterError } = await adminSupabase
    .from('tenant')
    .insert([tenantMasterRow])
    .select('id')
    .single();

  if (masterError) {
    if (!isMissingTenantMasterTable(masterError.message)) {
      throw new Error(`Gagal menyimpan ke tenant: ${masterError.message}`);
    }
    console.warn(
      '[register-tenant] tenant belum ada — fallback ke tabel registrations saja. Jalankan migration SQL.'
    );
  } else {
    masterData = insertedMaster;
  }

  // 2. Insert ke registrations (kompatibilitas alur verifikasi admin existing)
  const registrationBase = {
    school_name: payload.tenant_name,
    admin_name: payload.admin_name,
    admin_email: payload.admin_email,
    whatsapp: payload.whatsapp,
    npsn: payload.npsn || '-',
    subdomain,
    password: 'defaultpassword123',
    status: 'pending',
    product_name: productApp,
    created_at: now,
  };

  const registrationExtended = {
    ...registrationBase,
    ...(masterData ? { tenant_id: masterData.id } : {}),
  };

  let regData: { id: string } | null = null;
  let regError: { message: string } | null = null;

  const extendedResult = await adminSupabase
    .from('registrations')
    .insert([registrationExtended])
    .select('id')
    .single();

  if (extendedResult.error) {
    const fallbackResult = await adminSupabase
      .from('registrations')
      .insert([registrationBase])
      .select('id')
      .single();
    regData = fallbackResult.data;
    regError = fallbackResult.error;
  } else {
    regData = extendedResult.data;
  }

  if (regError || !regData) {
    if (masterData) {
      await adminSupabase.from('tenant').delete().eq('id', masterData.id);
    }
    throw new Error(`Gagal menyimpan ke registrations: ${regError?.message ?? 'unknown'}`);
  }

  // 3. Tautkan registration_id kembali ke tenant_master (jika tabel tersedia)
  if (masterData) {
    await adminSupabase
      .from('tenant')
      .update({ registration_id: regData.id, updated_at: now })
      .eq('id', masterData.id);
  }

  return {
    success: true,
    tenant_id: masterData?.id,
    registration_id: regData.id,
    subdomain,
    tenant_url: tenantUrl(subdomain),
    message: masterData
      ? 'Pendaftaran tenant berhasil disimpan ke Supabase.'
      : 'Pendaftaran tersimpan di registrations (tenant belum dimigrasi).',
  };
}

export async function checkSubdomainAvailable(
  adminSupabase: SupabaseClient,
  subdomain: string
): Promise<{ available: boolean; takenIn?: 'tenant' | 'registrations' }> {
  const normalized = subdomain.trim().toLowerCase();

  const { data: fromMaster, error: masterError } = await adminSupabase
    .from('tenant')
    .select('id')
    .eq('subdomain', normalized)
    .maybeSingle();

  if (masterError && !isMissingTenantMasterTable(masterError.message)) {
    throw new Error(masterError.message);
  }

  if (fromMaster) {
    return { available: false, takenIn: 'tenant' };
  }

  const { data: fromRegs } = await adminSupabase
    .from('registrations')
    .select('id')
    .eq('subdomain', normalized)
    .neq('status', 'rejected')
    .maybeSingle();

  if (fromRegs) {
    return { available: false, takenIn: 'registrations' };
  }

  return { available: true };
}
