/** Edge-only — jangan import modul client (saas-products, import.meta.env). */

export type ExternalProductKey = 'siput' | 'lms';

function readProcessEnv(key: string, fallback = ''): string {
  const value = process.env[key];
  return value?.trim() ? value.trim() : fallback;
}

/**
 * URL login aplikasi produk asli (SIPUT / LMS) dengan konteks tenant.
 * Contoh: https://siput.rsch.my.id/login?tenant=tkarmillanusa
 */
export function buildExternalProductTenantLoginUrlEdge(
  product: ExternalProductKey,
  tenantSubdomain: string
): string {
  const siputBase =
    readProcessEnv('VITE_SIPUT_APP_URL') ||
    readProcessEnv('SIPUT_APP_URL') ||
    'https://siput.rsch.my.id';
  const lmsBase =
    readProcessEnv('VITE_LMS_APP_URL') ||
    readProcessEnv('LMS_APP_URL') ||
    'https://lms.rsch.my.id';
  const base = (product === 'siput' ? siputBase : lmsBase).replace(/\/$/, '');
  const path =
    product === 'siput'
      ? readProcessEnv('VITE_SIPUT_TENANT_LOGIN_PATH', '/login')
      : readProcessEnv('VITE_LMS_TENANT_LOGIN_PATH', '/login');
  const slug = tenantSubdomain.trim().toLowerCase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  const tenantParam = readProcessEnv('VITE_TENANT_QUERY_PARAM', 'tenant');
  url.searchParams.set(tenantParam, slug);
  url.searchParams.set('subdomain', slug);
  url.searchParams.set('kode_tenant', slug);
  return url.toString();
}
