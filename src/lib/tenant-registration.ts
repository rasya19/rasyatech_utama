/**
 * Client-side service — Gerbang Pendaftaran Rasyatech.
 * Memanggil API server agar insert memakai service role (bypass RLS).
 */
import type { SaasProductId } from './saas-products';
import { validateSubdomain } from './subdomain-utils';

export interface TenantRegistrationFormData {
  tenant_name: string;
  product_app: SaasProductId;
  subdomain: string;
  admin_name: string;
  admin_email: string;
  whatsapp: string;
  npsn?: string;
  package_tier?: string;
  meta_data?: Record<string, string>;
}

export interface TenantRegistrationResponse {
  success: boolean;
  tenant_id?: string;
  registration_id?: string;
  subdomain: string;
  tenant_url: string;
  message: string;
}

export async function submitTenantRegistration(
  form: TenantRegistrationFormData
): Promise<TenantRegistrationResponse> {
  const subdomainError = validateSubdomain(form.subdomain);
  if (subdomainError) {
    throw new Error(subdomainError);
  }

  if (!form.tenant_name.trim()) {
    throw new Error('Nama Sekolah/Tenant wajib diisi.');
  }

  if (!form.product_app) {
    throw new Error('Pilihan aplikasi wajib dipilih.');
  }

  const response = await fetch('/api/register-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_name: form.tenant_name.trim(),
      product_app: form.product_app,
      subdomain: form.subdomain.trim().toLowerCase(),
      admin_name: form.admin_name.trim(),
      admin_email: form.admin_email.trim(),
      whatsapp: form.whatsapp.trim(),
      npsn: form.npsn?.trim() || '-',
      package_tier: form.package_tier || 'standard',
      meta_data: form.meta_data ?? {},
      source: 'form_pendaftaran_saas',
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'Gagal mengirim pendaftaran.');
  }

  return body as TenantRegistrationResponse;
}

/** Notifikasi opsional ke Pipedream (tidak memblokir submit utama). */
export async function notifyRegistrationWebhook(
  data: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('https://eokh2lzws2oigii.m.pipedream.net', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        source: 'gerbang_pendaftaran_rasyatech',
      }),
    });
  } catch {
    // Webhook opsional — abaikan kegagalan
  }
}
