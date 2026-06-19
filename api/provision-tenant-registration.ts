import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
  runtime: 'nodejs',
};

type TenantProductDbTab = 'lms' | 'siput';

type ProvisionResult = {
  tenantId: string | null;
  slug: string;
  created: boolean;
  skipped?: boolean;
};

type TenantAuthProvisionResult = {
  userId: string;
  created: boolean;
  magicLinkSent: boolean;
  message?: string;
};

type TenantRegistrationProvisionResult = {
  tenant: ProvisionResult;
  auth: TenantAuthProvisionResult;
  registrationId: string;
};

const TENANT_SUBDOMAIN_REGEX = /^[a-z0-9]{3,32}$/;
const DEFAULT_PACKAGE_TIER = 'basic';
const EDU_TENANT_DOMAIN = String(process.env.VITE_TENANT_DOMAIN || 'rsch.my.id')
  .toLowerCase()
  .replace(/^\.+/, '');

function readEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }
  return '';
}

function getSupabaseAdminSiput(): SupabaseClient {
  const url = readEnv(['SIPUT_SUPABASE_URL', 'SUPABASE_URL_SIPUT', 'VITE_SUPABASE_URL_SIPUT']);
  const key = readEnv([
    'SIPUT_SERVICE_ROLE_KEY',
    'SIPUT_SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY_SIPUT',
  ]);
  if (!url || !key) {
    throw new Error(
      'Env SIPUT belum lengkap — set SIPUT_SUPABASE_URL dan SIPUT_SERVICE_ROLE_KEY di Vercel.'
    );
  }
  return createClient(url.replace(/\/$/, ''), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getSupabaseAdminLms(): SupabaseClient {
  const url = readEnv(['LMS_SUPABASE_URL', 'SUPABASE_URL_LMS', 'VITE_SUPABASE_URL_LMS']);
  const key = readEnv(['LMS_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY_LMS']);
  if (!url || !key) {
    throw new Error(
      'Env LMS belum lengkap — set LMS_SUPABASE_URL dan LMS_SERVICE_ROLE_KEY di Vercel.'
    );
  }
  return createClient(url.replace(/\/$/, ''), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getTenantClient(tab: TenantProductDbTab): SupabaseClient {
  return tab === 'siput' ? getSupabaseAdminSiput() : getSupabaseAdminLms();
}

function normalizeTenantSubdomain(raw: string): string {
  let slug = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (slug.length < 3) {
    slug = `${slug || 'tenant'}app`.slice(0, 32);
  }

  return slug.slice(0, 32);
}

function validateTenantSubdomain(subdomain: string): string | null {
  if (!TENANT_SUBDOMAIN_REGEX.test(subdomain)) {
    return `Format subdomain tidak valid: "${subdomain}". Gunakan huruf kecil dan angka (3–32 karakter).`;
  }
  return null;
}

function buildProvisioningSubdomain(cleanSlug: string, tab: TenantProductDbTab): string {
  const base = normalizeTenantSubdomain(cleanSlug);
  if (!base) return '';

  if (tab === 'siput') {
    if (/^(kb|tk|sps|tpa|paud)/.test(base)) return base;
    return normalizeTenantSubdomain(`kb${base}`);
  }

  if (/^(pkbm|skb)/.test(base)) return base;
  return normalizeTenantSubdomain(`pkbm${base}`);
}

function deriveSlugFromRegistration(row: Record<string, unknown>): string {
  const explicit = String(
    row.kode_tenant || row.kode_semart || row.subdomain || row.slug || ''
  )
    .trim()
    .toLowerCase();
  if (explicit && explicit !== '-') {
    return normalizeTenantSubdomain(explicit);
  }

  const name = String(
    row.business_name ||
      row.school_name ||
      row.tenant_name ||
      row.full_name ||
      row.admin_name ||
      ''
  );
  return normalizeTenantSubdomain(name);
}

function stripUndefinedPayloadFields(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function buildSubdomainHost(subdomain: string, tenantDomain: string): string {
  const domain = tenantDomain.replace(/^\.+/, '').toLowerCase();
  return `${normalizeTenantSubdomain(subdomain)}.${domain}`;
}

function sanitizeTenantInsertPayload(
  row: Record<string, unknown>,
  tenantDomain: string
): Record<string, unknown> {
  const cleaned = stripUndefinedPayloadFields(row);
  const subdomain = normalizeTenantSubdomain(
    String(cleaned.subdomain || cleaned.slug || cleaned.kode_tenant || '')
  );
  const validationError = validateTenantSubdomain(subdomain);
  if (validationError) throw new Error(validationError);

  cleaned.subdomain = subdomain;
  cleaned.subdomain_host = buildSubdomainHost(subdomain, tenantDomain);
  if ('slug' in cleaned) cleaned.slug = subdomain;
  if ('kode_tenant' in cleaned) cleaned.kode_tenant = subdomain;
  return cleaned;
}

function extractMissingColumnFromPostgrestError(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

function remapPayloadMissingColumn(
  payload: Record<string, unknown>,
  missingColumn: string
): Record<string, unknown> {
  const next = { ...payload };
  const removedValue = next[missingColumn];
  delete next[missingColumn];

  switch (missingColumn) {
    case 'admin_email':
      if (next.email == null && removedValue != null) next.email = removedValue;
      break;
    case 'email':
      if (next.admin_email == null && removedValue != null) next.admin_email = removedValue;
      break;
    case 'admin_name':
      if (next.name == null && removedValue != null) next.name = removedValue;
      break;
    case 'tenant_name':
      if (next.school_name == null && removedValue != null) next.school_name = removedValue;
      break;
    case 'product_app':
      if (next.product_type == null && removedValue != null) next.product_type = removedValue;
      break;
    case 'subdomain':
      if (next.slug == null && removedValue != null) next.slug = removedValue;
      if (next.kode_tenant == null && removedValue != null) next.kode_tenant = removedValue;
      break;
    default:
      break;
  }

  return stripUndefinedPayloadFields(next);
}

function logSupabaseInsertError(
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
  });
}

async function insertRowAdaptive(
  client: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
  context: string
): Promise<Record<string, unknown>> {
  let current = { ...payload };

  for (let attempt = 0; attempt < 20; attempt++) {
    const { data, error } = await client.from(table).insert([current]).select('id').single();

    if (!error) return (data ?? {}) as Record<string, unknown>;

    const missingCol = extractMissingColumnFromPostgrestError(error.message);
    if (missingCol) {
      const next = remapPayloadMissingColumn(current, missingCol);
      const unchanged =
        Object.keys(next).length === Object.keys(current).length &&
        Object.keys(next).every((k) => next[k] === current[k]);
      if (unchanged) {
        logSupabaseInsertError(`${context}.insert`, error, current);
        throw new Error(
          `Kolom "${missingCol}" tidak ada di tabel ${table} — sesuaikan skema DB produk.`
        );
      }
      console.warn(`[insertRowAdaptive][${context}] remap kolom "${missingCol}"`, {
        attempt,
        remaining: Object.keys(next),
      });
      current = next;
      continue;
    }

    logSupabaseInsertError(`${context}.insert`, error, current);
    throw new Error(error.message || `INSERT ke ${table} gagal (${context}).`);
  }

  throw new Error(`INSERT ke ${table} gagal setelah menyesuaikan skema (${context}).`);
}

function resolvePackageTier(row: Record<string, unknown>): string {
  const tier = String(
    row.package_tier ||
      row.paket_langganan ||
      row.selected_package ||
      row.package ||
      DEFAULT_PACKAGE_TIER
  ).trim();
  return tier || DEFAULT_PACKAGE_TIER;
}

function resolveProductApp(tab: TenantProductDbTab, row: Record<string, unknown>): string {
  const fromRow = String(row.product_app || row.product_type || '')
    .trim()
    .toUpperCase();
  if (fromRow) return fromRow;
  return tab === 'siput' ? 'SIPUT' : 'LMS';
}

function toProductApp(tab: TenantProductDbTab): string {
  return tab === 'siput' ? 'SIPUT' : 'LMS';
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

function buildMainTenantInsertRow(
  tab: TenantProductDbTab,
  registrationRow: Record<string, unknown>,
  institutionalSubdomain: string
): Record<string, unknown> {
  const subdomain = normalizeTenantSubdomain(institutionalSubdomain);
  const validationError = validateTenantSubdomain(subdomain);
  if (validationError) throw new Error(validationError);

  const tenantName = registrationDisplayName(registrationRow, subdomain).trim() || subdomain;
  const now = new Date().toISOString();
  const adminEmail = String(registrationRow.admin_email || registrationRow.email || '').trim();
  const safeEmail =
    adminEmail && adminEmail !== '-' ? adminEmail : `no-reply+${subdomain}@rasyatech.local`;

  return stripUndefinedPayloadFields({
    tenant_name: tenantName,
    subdomain,
    package_tier: resolvePackageTier(registrationRow),
    source: String(registrationRow.source || 'manajemen_pendaftar_approval'),
    npsn:
      registrationRow.npsn != null && String(registrationRow.npsn).trim() !== ''
        ? String(registrationRow.npsn)
        : '-',
    product_app: resolveProductApp(tab, registrationRow),
    subdomain_host: buildSubdomainHost(subdomain, EDU_TENANT_DOMAIN),
    admin_name:
      String(registrationRow.admin_name || registrationRow.full_name || tenantName).trim() ||
      tenantName,
    admin_email: safeEmail,
    whatsapp:
      String(registrationRow.whatsapp || registrationRow.whatsapp_number || '').trim() || '-',
    status: 'verified',
    created_at: now,
    updated_at: now,
  });
}

function isUuid(value: unknown): boolean {
  if (value == null) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

async function provisionMainTenant(
  tab: TenantProductDbTab,
  registrationRow: Record<string, unknown>
): Promise<ProvisionResult> {
  const tenantClient = getTenantClient(tab);
  const cleanSlug = deriveSlugFromRegistration(registrationRow);
  if (!cleanSlug) {
    throw new Error('Subdomain tidak valid — isi nama instansi/bisnis pada pendaftaran.');
  }

  const provisioningSubdomain = buildProvisioningSubdomain(cleanSlug, tab);
  const insertRow = buildMainTenantInsertRow(tab, registrationRow, provisioningSubdomain);

  console.log('[BE] Langkah 1/3 — insert tenant:', {
    tab,
    slug: provisioningSubdomain,
    npsn: registrationRow.npsn,
  });

  const { data: existing, error: lookupError } = await tenantClient
    .from('tenant')
    .select('id')
    .or(`subdomain.eq.${provisioningSubdomain},subdomain.eq.${cleanSlug}`)
    .maybeSingle();

  if (lookupError) {
    console.warn('[BE] tenant lookup:', lookupError.message);
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

  const payload = sanitizeTenantInsertPayload(insertRow, EDU_TENANT_DOMAIN);
  const data = await insertRowAdaptive(tenantClient, 'tenant', payload, 'provision-main-tenant');

  return {
    tenantId: data?.id ? String(data.id) : null,
    slug: provisioningSubdomain,
    created: true,
  };
}

function extractPlainPasswordFromRegistration(row: Record<string, unknown>): string | null {
  const candidates = [row.password_plain, row.plain_password, row.registration_password, row.password];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (!value) continue;
    if (value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')) continue;
    if (value.length < 6) continue;
    return value;
  }

  return null;
}

function buildTenantPortalUrl(kodeTenant: string): string {
  const slug = kodeTenant.trim().toLowerCase();
  return `https://${slug}.${EDU_TENANT_DOMAIN}`;
}

async function provisionTenantAuthUser(input: {
  tab: TenantProductDbTab;
  email: string;
  password?: string | null;
  redirectTo?: string;
  metadata?: Record<string, unknown>;
}): Promise<TenantAuthProvisionResult & { message: string }> {
  const admin = getTenantClient(input.tab);
  const normalizedEmail = input.email.trim().toLowerCase();
  const plainPassword =
    typeof input.password === 'string' &&
    input.password.trim() &&
    !input.password.trim().startsWith('$2')
      ? input.password.trim()
      : null;

  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.warn('[BE] listUsers:', listError.message);
  }

  const existing = existingUsers?.users?.find(
    (user: { id: string; email?: string | null }) =>
      user.email?.toLowerCase() === normalizedEmail
  );

  if (existing?.id) {
    return {
      userId: existing.id,
      created: false,
      magicLinkSent: false,
      message: 'Akun auth sudah ada di tenant.',
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: plainPassword || undefined,
    email_confirm: true,
    user_metadata: input.metadata || {},
  });

  if (createError || !created.user?.id) {
    throw new Error(createError?.message || 'Gagal membuat akun auth tenant.');
  }

  let magicLinkSent = false;

  if (!plainPassword) {
    const { error: resetError } = await admin.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: input.redirectTo,
    });
    if (resetError) {
      console.warn('[BE] resetPasswordForEmail:', resetError.message);
    } else {
      magicLinkSent = true;
    }
  }

  return {
    userId: created.user.id,
    created: true,
    magicLinkSent,
    message: plainPassword
      ? 'Akun auth tenant dibuat dengan password pendaftaran.'
      : magicLinkSent
        ? 'Akun auth tenant dibuat — email reset password dikirim.'
        : 'Akun auth tenant dibuat — minta pengguna reset password manual.',
  };
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
  const email = resolveRegistrationEmail(row);

  return stripUndefinedPayloadFields({
    id: authUserId,
    is_approved: true,
    status: 'verified',
    approved: true,
    full_name: String(row.full_name || row.admin_name || '').trim(),
    admin_name: String(row.admin_name || row.full_name || '').trim(),
    email,
    admin_email: email,
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

function formatStepError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function provisionTenantRegistration(
  tab: TenantProductDbTab,
  registrationRow: Record<string, unknown>
): Promise<TenantRegistrationProvisionResult> {
  const tenantClient = getTenantClient(tab);
  const cleanSlug = normalizeTenantSubdomain(deriveSlugFromRegistration(registrationRow));
  const provisioningSubdomain = buildProvisioningSubdomain(cleanSlug, tab);

  console.log('[BE] Provisioning start:', {
    tab,
    cleanSlug,
    slug: provisioningSubdomain,
    email: registrationRow.email,
    npsn: registrationRow.npsn,
  });

  let tenant: ProvisionResult;
  try {
    tenant = await provisionMainTenant(tab, registrationRow);
    console.log('[BE] Langkah 1/3 OK — tenant:', tenant);
  } catch (error) {
    console.error('[BE] Langkah 1/3 gagal:', error);
    throw new Error(`[tenant] ${formatStepError(error)}`);
  }

  const email = resolveRegistrationEmail(registrationRow);
  const plainPassword = extractPlainPasswordFromRegistration(registrationRow);
  const portalUrl = buildTenantPortalUrl(provisioningSubdomain);
  const redirectTo = `${portalUrl.replace(/\/$/, '')}/reset-password`;

  let authResult: TenantAuthProvisionResult & { message: string };
  try {
    console.log('[BE] Langkah 2/3 — buat auth user, email:', email);
    authResult = await provisionTenantAuthUser({
      tab,
      email,
      password: plainPassword,
      redirectTo,
      metadata: {
        tenant_subdomain: provisioningSubdomain,
        product_app: toProductApp(tab),
        business_name: String(
          registrationRow.business_name || registrationRow.school_name || ''
        ).trim(),
      },
    });
    console.log('[BE] Langkah 2/3 OK — auth:', {
      userId: authResult.userId,
      created: authResult.created,
      magicLinkSent: authResult.magicLinkSent,
    });
  } catch (error) {
    console.error('[BE] Langkah 2/3 gagal:', error);
    throw new Error(`[auth] ${formatStepError(error)}`);
  }

  const registrationPayload = buildTenantRegistrationInsertRow(
    tab,
    registrationRow,
    authResult.userId,
    tenant.tenantId,
    provisioningSubdomain
  );

  try {
    console.log('[BE] Langkah 3/3 — insert registrations, tenant_id:', tenant.tenantId);
    await insertRowAdaptive(
      tenantClient,
      'registrations',
      registrationPayload,
      'provision-tenant-registration'
    );
    console.log('[BE] Langkah 3/3 OK — registrations inserted');
  } catch (error) {
    console.error('[BE] Langkah 3/3 gagal:', error);
    throw new Error(`[registrations] ${formatStepError(error)}`);
  }

  return {
    tenant,
    auth: {
      userId: authResult.userId,
      created: authResult.created,
      magicLinkSent: authResult.magicLinkSent,
      message: authResult.message,
    },
    registrationId: authResult.userId,
  };
}

function jsonResponse(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

async function handleProvisionTenantRegistration(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { ok: false, detail: 'Method not allowed' });
  }

  const rawBody = req.body ?? {};
  console.log('[BE] Raw request body:', rawBody);

  const { tab, registrationRow } = rawBody as {
    tab?: string;
    registrationRow?: Record<string, unknown>;
  };

  console.log('[BE] ENV CHECK', {
    tab: tab || 'unknown',
    siputUrl: Boolean(process.env.SIPUT_SUPABASE_URL),
    siputKey: Boolean(process.env.SIPUT_SERVICE_ROLE_KEY),
    lmsUrl: Boolean(process.env.LMS_SUPABASE_URL),
    lmsKey: Boolean(process.env.LMS_SERVICE_ROLE_KEY),
  });

  if (tab !== 'lms' && tab !== 'siput') {
    return jsonResponse(res, 400, { ok: false, detail: 'tab harus lms atau siput' });
  }

  if (!registrationRow || typeof registrationRow !== 'object') {
    return jsonResponse(res, 400, { ok: false, detail: 'registrationRow wajib' });
  }

  const result = await provisionTenantRegistration(tab, registrationRow);

  console.log('[BE] Provisioning success', {
    tab,
    tenantId: result.tenant.tenantId,
    slug: result.tenant.slug,
    registrationId: result.registrationId,
  });

  return jsonResponse(res, 201, { ok: true, data: result });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleProvisionTenantRegistration(req, res);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[BE] provision-tenant-registration error:', detail, error);
    return jsonResponse(res, 500, { ok: false, detail });
  }
}
