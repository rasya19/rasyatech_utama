import {
  extractHostnameSubdomainSlug,
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
};

function getSupabaseEdgeConfig(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

async function fetchTenantProductFromTable(
  baseUrl: string,
  key: string,
  tablePath: string,
  slug: string
): Promise<SaasProductRoute | null> {
  const encoded = encodeURIComponent(slug);
  const query = `or=(subdomain.eq.${encoded},kode_tenant.eq.${encoded})&select=product_app,product_type,subdomain,kode_tenant&limit=1`;
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

/** Lookup produk tenant dari Supabase (Main + Kuliner) berdasarkan kode_tenant / subdomain. */
export async function resolveTenantProductFromDatabase(
  hostnameSubdomain: string
): Promise<SaasProductRoute | null> {
  const config = getSupabaseEdgeConfig();
  if (!config) return null;

  const slugs = [
    hostnameSubdomain,
    stripInstitutionalPrefixFromSlug(hostnameSubdomain),
  ].filter((s, i, arr) => s && arr.indexOf(s) === i);

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

  const kulinerUrl = process.env.VITE_SUPABASE_URL_KULINER || '';
  const kulinerKey = process.env.VITE_SUPABASE_ANON_KEY_KULINER || '';
  if (kulinerUrl && kulinerKey) {
    for (const slug of slugs) {
      const fromKulinerTenant = await fetchTenantProductFromTable(
        kulinerUrl.replace(/\/$/, ''),
        kulinerKey,
        'tenant',
        slug
      );
      if (fromKulinerTenant) return fromKulinerTenant;

      const fromKulinerReg = await fetchTenantProductFromTable(
        kulinerUrl.replace(/\/$/, ''),
        kulinerKey,
        'registrations',
        slug
      );
      if (fromKulinerReg) return fromKulinerReg;
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

  const fromDb = await resolveTenantProductFromDatabase(hostnameSubdomain);
  if (fromDb) {
    return resolveMiddlewareRewriteTarget(hostname, pathname, fromDb);
  }

  return resolveMiddlewareRewriteTarget(hostname, pathname);
}
