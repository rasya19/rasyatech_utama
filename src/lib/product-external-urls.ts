import type { SaasProductApp, SaasProductType } from './saas-product-options';
import { getSaasProductPortalUrl } from './saas-products';

export type ExternalProductKey = 'siput' | 'lms';

function readEnv(key: string, fallback: string): string {
  if (typeof import.meta !== 'undefined') {
    const value = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
    if (value?.trim()) return value.trim();
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]).trim();
  }
  return fallback;
}

function getProductAppBaseUrl(product: ExternalProductKey): string {
  if (product === 'siput') {
    return readEnv('VITE_SIPUT_APP_URL', getSaasProductPortalUrl('siput'));
  }
  return readEnv('VITE_LMS_APP_URL', getSaasProductPortalUrl('lms'));
}

function getProductLoginPath(product: ExternalProductKey): string {
  if (product === 'siput') {
    return readEnv('VITE_SIPUT_TENANT_LOGIN_PATH', '/login');
  }
  return readEnv('VITE_LMS_TENANT_LOGIN_PATH', '/login');
}

/**
 * URL login aplikasi produk asli (SIPUT / LMS) dengan konteks tenant.
 * Contoh: https://siput.rsch.my.id/login?tenant=tkarmillanusa&subdomain=tkarmillanusa
 */
export function buildExternalProductTenantLoginUrl(
  product: ExternalProductKey,
  tenantSubdomain: string
): string {
  const base = getProductAppBaseUrl(product).replace(/\/$/, '');
  const path = getProductLoginPath(product).replace(/^\/?/, '/');
  const slug = tenantSubdomain.trim().toLowerCase();

  const url = new URL(`${base}${path}`);
  const tenantParam = readEnv('VITE_TENANT_QUERY_PARAM', 'tenant');
  url.searchParams.set(tenantParam, slug);
  url.searchParams.set('subdomain', slug);
  url.searchParams.set('kode_tenant', slug);
  return url.toString();
}

export function shouldUseExternalProductApp(
  product: SaasProductApp | SaasProductType | string
): product is ExternalProductKey {
  const key = String(product).toLowerCase();
  return key === 'siput' || key === 'lms';
}

export function resolveExternalProductFromPillar(
  pillar: string
): ExternalProductKey | null {
  if (pillar === 'siput') return 'siput';
  if (pillar === 'lms') return 'lms';
  return null;
}

/** Untuk edge middleware (tanpa import.meta). */
export function buildExternalProductTenantLoginUrlEdge(
  product: ExternalProductKey,
  tenantSubdomain: string
): string {
  const siputBase =
    process.env.VITE_SIPUT_APP_URL ||
    process.env.SIPUT_APP_URL ||
    'https://siput.rsch.my.id';
  const lmsBase =
    process.env.VITE_LMS_APP_URL || process.env.LMS_APP_URL || 'https://lms.rsch.my.id';
  const base = (product === 'siput' ? siputBase : lmsBase).replace(/\/$/, '');
  const path =
    product === 'siput'
      ? process.env.VITE_SIPUT_TENANT_LOGIN_PATH || '/login'
      : process.env.VITE_LMS_TENANT_LOGIN_PATH || '/login';
  const slug = tenantSubdomain.trim().toLowerCase();
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  const tenantParam = process.env.VITE_TENANT_QUERY_PARAM || 'tenant';
  url.searchParams.set(tenantParam, slug);
  url.searchParams.set('subdomain', slug);
  url.searchParams.set('kode_tenant', slug);
  return url.toString();
}
