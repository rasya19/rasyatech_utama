import {
  extractHostnameSubdomainSlug,
  normalizeHostnameSubdomainSlug,
  productAppToRoute,
  resolveMiddlewareRewriteTarget,
  stripInstitutionalPrefixFromSlug,
  type SaasProductRoute,
} from './tenant-host-parser';

type TenantDbRow = {
  product_app?: string | null;
  product_type?: string | null;
  subdomain?: string | null;
  kode_tenant?: string | null;
  subdomain_host?: string | null;
};

type EdgeDbConfig = {
  url: string;
  key: string;
  label: string;
};

function getSupabaseEdgeConfig(): EdgeDbConfig | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key, label: 'main' };
}

function getProductEdgeConfigs(): EdgeDbConfig[] {
  const configs: EdgeDbConfig[] = [];
  const main = getSupabaseEdgeConfig();
  if (main) configs.push(main);

  const pairs: Array<[string, string, string]> = [
    ['VITE_SUPABASE_URL_LMS', 'VITE_SUPABASE_ANON_KEY_LMS', 'lms'],
    ['VITE_SUPABASE_URL_SIPUT', 'VITE_SUPABASE_ANON_KEY_SIPUT', 'siput'],
    ['VITE_SUPABASE_URL_KULINER', 'VITE_SUPABASE_ANON_KEY_KULINER', 'kuliner'],
    ['VITE_SUPABASE_URL_SCANBITE', 'VITE_SUPABASE_ANON_KEY_SCANBITE', 'scanbite'],
    ['VITE_SUPABASE_URL_RESTO', 'VITE_SUPABASE_ANON_KEY_RESTO', 'resto'],
    ['VITE_SUPABASE_URL_INSTAFOOD', 'VITE_SUPABASE_ANON_KEY_INSTAFOOD', 'instafood'],
  ];

  for (const [urlKey, keyKey, label] of pairs) {
    const url = process.env[urlKey] || '';
    const key = process.env[keyKey] || '';
    if (!url || !key) continue;
    const normalizedUrl = url.replace(/\/$/, '');
    if (configs.some((c) => c.url === normalizedUrl)) continue;
    configs.push({ url: normalizedUrl, key, label });
  }

  return configs;
}

async function fetchTenantProductFromTable(
  baseUrl: string,
  key: string,
  tablePath: string,
  slug: string
): Promise<SaasProductRoute | null> {
  const encoded = encodeURIComponent(slug);
  const query = `or=(subdomain.eq.${encoded},kode_tenant.eq.${encoded})&select=product_app,product_type,subdomain,kode_tenant,subdomain_host&limit=1`;
  const response = await fetch(`${baseUrl}/rest/v1/${tablePath}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as TenantDbRow[];
  const row = rows?.[0];
  if (!row) return null;

  const product = row.product_app || row.product_type;
  return product ? productAppToRoute(String(product)) : null;
}

async function fetchTenantProductBySubdomainHost(
  baseUrl: string,
  key: string,
  tablePath: string,
  hostname: string
): Promise<SaasProductRoute | null> {
  const host = hostname.split(':')[0].toLowerCase();
  const encoded = encodeURIComponent(host);
  const query = `subdomain_host=eq.${encoded}&select=product_app,product_type,subdomain,kode_tenant,subdomain_host&limit=1`;
  const response = await fetch(`${baseUrl}/rest/v1/${tablePath}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as TenantDbRow[];
  const row = rows?.[0];
  if (!row) return null;

  const product = row.product_app || row.product_type;
  return product ? productAppToRoute(String(product)) : null;
}

/** Lookup produk tenant dari Supabase (Main + produk + Kuliner) berdasarkan host / subdomain. */
export async function resolveTenantProductFromDatabase(
  hostnameSubdomain: string,
  fullHostname?: string
): Promise<SaasProductRoute | null> {
  const configs = getProductEdgeConfigs();
  if (configs.length === 0) return null;

  const slugs = [
    hostnameSubdomain,
    normalizeHostnameSubdomainSlug(hostnameSubdomain),
    stripInstitutionalPrefixFromSlug(hostnameSubdomain),
  ].filter((s, i, arr) => s && arr.indexOf(s) === i);

  const host = fullHostname?.split(':')[0].toLowerCase();

  for (const config of configs) {
    if (host) {
      const fromHostTenant = await fetchTenantProductBySubdomainHost(
        config.url,
        config.key,
        'tenant',
        host
      );
      if (fromHostTenant) return fromHostTenant;

      const fromHostReg = await fetchTenantProductBySubdomainHost(
        config.url,
        config.key,
        'registrations',
        host
      );
      if (fromHostReg) return fromHostReg;
    }

    for (const slug of slugs) {
      const fromTenant = await fetchTenantProductFromTable(
        config.url,
        config.key,
        'tenant',
        slug
      );
      if (fromTenant) return fromTenant;

      const fromReg = await fetchTenantProductFromTable(
        config.url,
        config.key,
        'registrations',
        slug
      );
      if (fromReg) return fromReg;
    }
  }

  return null;
}

export async function resolveMiddlewareRewriteWithDb(
  hostname: string,
  pathname: string
) {
  const hostnameSubdomain = extractHostnameSubdomainSlug(hostname);
  if (!hostnameSubdomain) return null;

  const fromDb = await resolveTenantProductFromDatabase(hostnameSubdomain, hostname);
  if (fromDb) {
    return resolveMiddlewareRewriteTarget(hostname, pathname, fromDb);
  }

  return resolveMiddlewareRewriteTarget(hostname, pathname);
}
