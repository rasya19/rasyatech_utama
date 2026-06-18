/**
 * Parser hostname multi-tenant Rasyatech.
 * Mendukung:
 *   - tkarmillanusa.rsch.my.id          → tenant klasik
 *   - tkarmillanusa.siput.rsch.my.id    → tenant + produk di hostname
 *   - scanbite-warung.rsch.my.id        → tenant kuliner
 */

export type TenantProductPillar = 'lms' | 'siput' | 'kuliner';

export type ParsedTenantHost = {
  tenantSlug: string;
  /** Segmen produk di hostname, jika ada (siput, lms, scanbite, …) */
  productHint: string | null;
  pillar: TenantProductPillar;
  hostname: string;
};

const PORTAL_SLUGS = new Set([
  'www',
  'rasyatech',
  'api',
  'mail',
  'admin',
  'master',
  'daftar',
  'app',
]);

const PRODUCT_SEGMENTS = new Set([
  'siput',
  'lms',
  'armilla',
  'kesetaraan',
  'scanbite',
  'restoran_asli',
  'restoran',
  'resto',
  'instafoto',
  'instafood',
]);

const KULINER_SEGMENTS = new Set([
  'scanbite',
  'restoran_asli',
  'restoran',
  'resto',
  'instafoto',
  'instafood',
]);

export function getTenantBaseDomain(): string {
  const fromEnv =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TENANT_DOMAIN) ||
    (typeof process !== 'undefined' && process.env?.VITE_TENANT_DOMAIN);
  return String(fromEnv || 'rsch.my.id')
    .toLowerCase()
    .replace(/^\.+/, '');
}

/** Host utama (landing / master-admin) — bukan subdomain tenant. */
export function isMainDomainHostname(hostname: string): boolean {
  const h = hostname.split(':')[0].toLowerCase();

  if (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.endsWith('.vercel.app') ||
    h.endsWith('.run.app') ||
    h.includes('asia-southeast1.run.app')
  ) {
    return true;
  }

  const base = getTenantBaseDomain();
  const parts = h.split('.');
  const baseParts = base.split('.');

  if (parts.length < baseParts.length) return true;

  const suffix = parts.slice(-baseParts.length).join('.');
  if (suffix !== base) {
    // Domain lain (mis. rasyatech.com) — anggap main jika < 3 bagian
    return parts.length < 3 || parts[0] === 'rasyatech' || parts[0] === 'www';
  }

  const prefix = parts.slice(0, parts.length - baseParts.length);
  if (prefix.length === 0) return true;

  if (prefix.length === 1) {
    const slug = prefix[0];
    if (PORTAL_SLUGS.has(slug) || PRODUCT_SEGMENTS.has(slug)) return true;
    return false;
  }

  // tenant.produk.rsch.my.id → tenant (bukan main)
  if (prefix.length >= 2 && PRODUCT_SEGMENTS.has(prefix[1])) {
    return false;
  }

  return prefix[0] === 'rasyatech' || prefix[0] === 'www';
}

export function inferPillarFromProduct(product: string | null): TenantProductPillar {
  if (!product) return 'lms';
  const p = product.toLowerCase();
  if (p === 'siput') return 'siput';
  if (KULINER_SEGMENTS.has(p)) return 'kuliner';
  return 'lms';
}

export function parseTenantHostname(hostname: string): ParsedTenantHost | null {
  const h = hostname.split(':')[0].toLowerCase();

  if (isMainDomainHostname(h)) {
    console.log('[tenant-host-parser] main domain — skip tenant parse:', h);
    return null;
  }

  const base = getTenantBaseDomain();
  const parts = h.split('.');
  const baseParts = base.split('.');

  if (parts.slice(-baseParts.length).join('.') !== base) {
    const legacySlug = parts[0];
    if (legacySlug && !PORTAL_SLUGS.has(legacySlug)) {
      console.log('[tenant-host-parser] legacy host (non-base domain):', h, '→', legacySlug);
      return {
        tenantSlug: legacySlug,
        productHint: null,
        pillar: 'lms',
        hostname: h,
      };
    }
    return null;
  }

  const prefix = parts.slice(0, parts.length - baseParts.length);
  if (prefix.length === 0 || prefix.length === 1 && PRODUCT_SEGMENTS.has(prefix[0])) {
    return null;
  }

  let tenantSlug: string;
  let productHint: string | null = null;

  if (prefix.length === 1) {
    tenantSlug = prefix[0];
  } else {
    tenantSlug = prefix[0];
    const maybeProduct = prefix[1];
    if (PRODUCT_SEGMENTS.has(maybeProduct)) {
      productHint = maybeProduct;
    }
  }

  if (!tenantSlug || PORTAL_SLUGS.has(tenantSlug)) return null;

  const pillar = inferPillarFromProduct(productHint);

  console.log('[tenant-host-parser] tenant detected:', {
    hostname: h,
    tenantSlug,
    productHint,
    pillar,
  });

  return { tenantSlug, productHint, pillar, hostname: h };
}

/** Path internal SPA untuk rewrite / redirect tenant. */
export function buildTenantRoutePath(
  parsed: ParsedTenantHost,
  productFromDb?: string | null
): string {
  const product = parsed.productHint || productFromDb || null;
  const pillar = product ? inferPillarFromProduct(product) : parsed.pillar;

  if (pillar === 'siput') return `/siput/${parsed.tenantSlug}`;
  if (pillar === 'kuliner') return `/kuliner/${parsed.tenantSlug}`;
  return `/lms/${parsed.tenantSlug}`;
}

export function getSubdomainFromHostname(hostname: string): string | null {
  return parseTenantHostname(hostname)?.tenantSlug ?? null;
}
