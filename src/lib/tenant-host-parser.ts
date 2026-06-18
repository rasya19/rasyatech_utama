/**
 * Parser hostname multi-tenant Rasyatech.
 * Mendukung:
 *   - pkbm-armilla.rsch.my.id          → LMS Kesetaraan (awalan PKBM)
 *   - kb-ceria.rsch.my.id              → SIPUT PAUD (awalan KB)
 *   - sps-amanah.rsch.my.id            → SIPUT PAUD (awalan SPS)
 *   - rasyatech.rsch.my.id             → landing utama (bukan tenant)
 */

export type TenantProductPillar = 'lms' | 'siput' | 'kuliner';

/** Rute internal per produk SaaS (5 pilar). */
export type SaasProductRoute = 'lms' | 'siput' | 'scanbite' | 'resto' | 'instafood';

export type ParsedTenantHost = {
  /** Slug lengkap dari hostname (mis. pkbm-armilla, tk-armillanusa). */
  tenantSlug: string;
  /** Slug bersih tanpa awalan kelembagaan (mis. armilla, armillanusa) — untuk lookup DB. */
  cleanTenantSlug: string;
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

const PRODUCT_ROUTE_MAP: Record<string, SaasProductRoute> = {
  lms: 'lms',
  armilla: 'lms',
  kesetaraan: 'lms',
  siput: 'siput',
  scanbite: 'scanbite',
  restoran_asli: 'resto',
  restoran: 'resto',
  resto: 'resto',
  instafoto: 'instafood',
  instafood: 'instafood',
};

export function productAppToRoute(product: string | null | undefined): SaasProductRoute {
  if (!product) return 'lms';
  const key = product.trim().toLowerCase();
  if (PRODUCT_ROUTE_MAP[key]) return PRODUCT_ROUTE_MAP[key];
  const upper = product.trim().toUpperCase();
  if (upper === 'LMS') return 'lms';
  if (upper === 'SIPUT') return 'siput';
  if (upper === 'SCANBITE') return 'scanbite';
  if (upper === 'RESTO') return 'resto';
  if (upper === 'INSTAFOOD') return 'instafood';
  return 'lms';
}

export function routeToInternalPrefix(route: SaasProductRoute): string {
  return `/_${route}`;
}

export function getTenantBaseDomains(): string[] {
  const edu =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TENANT_DOMAIN) ||
    (typeof process !== 'undefined' && process.env?.VITE_TENANT_DOMAIN) ||
    'rsch.my.id';
  const kuliner =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_TENANT_DOMAIN_KULINER) ||
    (typeof process !== 'undefined' && process.env?.VITE_TENANT_DOMAIN_KULINER) ||
    'rsch.web.id';
  const apex =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APEX_DOMAIN) ||
    (typeof process !== 'undefined' && process.env?.VITE_APEX_DOMAIN) ||
    'rasyatech.com';
  return [...new Set([edu, kuliner, apex].map((d) => String(d).toLowerCase().replace(/^\.+/, '')))];
}

/** Awalan kelembagaan Indonesia — LMS Kesetaraan (PKBM / SKB). */
export const LMS_INSTITUTIONAL_MARKERS = ['pkbm-', 'skb-'] as const;

/** Awalan kelembagaan Indonesia — SIPUT PAUD (TK, KB, SPS, TPA, PAUD). */
export const SIPUT_INSTITUTIONAL_MARKERS = ['tk-', 'kb-', 'sps-', 'tpa-', 'paud-'] as const;

export function slugMatchesInstitutionalMarker(
  slug: string,
  markers: readonly string[]
): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  return markers.some((marker) => normalized.startsWith(marker));
}

/** Infer pillar dari slug subdomain (pkbm-*, kb-*, sps-*, dll.). */
export function inferPillarFromInstitutionalSlug(slug: string): TenantProductPillar | null {
  if (slugMatchesInstitutionalMarker(slug, LMS_INSTITUTIONAL_MARKERS)) return 'lms';
  if (slugMatchesInstitutionalMarker(slug, SIPUT_INSTITUTIONAL_MARKERS)) return 'siput';
  return null;
}

/** Nilai `product_app` di tabel tenant master dari awalan kelembagaan. */
export function inferProductAppFromInstitutionalSlug(slug: string): 'lms' | 'siput' | null {
  const pillar = inferPillarFromInstitutionalSlug(slug);
  if (pillar === 'lms') return 'lms';
  if (pillar === 'siput') return 'siput';
  return null;
}

/** Hapus awalan kelembagaan dari slug subdomain untuk lookup database. */
export function stripInstitutionalPrefixFromSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  const markers = [...LMS_INSTITUTIONAL_MARKERS, ...SIPUT_INSTITUTIONAL_MARKERS] as const;

  for (const marker of markers) {
    if (normalized.startsWith(marker)) {
      const stripped = normalized.slice(marker.length).replace(/^-+/, '');
      return stripped || normalized;
    }
  }

  return normalized;
}

/** Bangun subdomain penuh dengan awalan kelembagaan untuk DNS (mis. pkbm-armilla-nusa). */
export function buildInstitutionalSubdomain(
  cleanSlug: string,
  pillar: 'lms' | 'siput'
): string {
  const base = cleanSlug.trim().toLowerCase().replace(/^-+/, '');
  if (!base) return cleanSlug;

  if (pillar === 'lms') {
    if (slugMatchesInstitutionalMarker(base, LMS_INSTITUTIONAL_MARKERS)) return base;
    return `pkbm-${base}`;
  }

  if (slugMatchesInstitutionalMarker(base, SIPUT_INSTITUTIONAL_MARKERS)) return base;
  return `kb-${base}`;
}

export function isDevPreviewHostname(hostname: string): boolean {
  const h = hostname.split(':')[0].toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.endsWith('.vercel.app') ||
    h.endsWith('.run.app') ||
    h.includes('asia-southeast1.run.app')
  );
}

export function extractHostnameSubdomainSlug(hostname: string): string | null {
  const h = hostname.split(':')[0].toLowerCase();

  if (isDevPreviewHostname(h)) {
    return null;
  }

  for (const base of getTenantBaseDomains()) {
    const parts = h.split('.');
    const baseParts = base.split('.');
    if (parts.slice(-baseParts.length).join('.') !== base) continue;

    const prefix = parts.slice(0, parts.length - baseParts.length);
    if (prefix.length === 0) continue;

    if (prefix.length === 1) {
      const slug = prefix[0];
      if (PORTAL_SLUGS.has(slug) || PRODUCT_SEGMENTS.has(slug)) continue;
      return slug;
    }

    if (prefix.length >= 2 && PRODUCT_SEGMENTS.has(prefix[1])) {
      return prefix[0];
    }
  }

  return null;
}

export function hostnameHasTenantSubdomain(hostname: string): boolean {
  if (isDevPreviewHostname(hostname) || isApexLandingHostname(hostname)) {
    return false;
  }
  return extractHostnameSubdomainSlug(hostname) != null;
}

export function extractProductHintFromHostname(hostname: string): string | null {
  const h = hostname.split(':')[0].toLowerCase();
  for (const base of getTenantBaseDomains()) {
    const parts = h.split('.');
    const baseParts = base.split('.');
    if (parts.slice(-baseParts.length).join('.') !== base) continue;
    const prefix = parts.slice(0, parts.length - baseParts.length);
    if (prefix.length >= 2 && PRODUCT_SEGMENTS.has(prefix[1])) {
      return prefix[1];
    }
  }
  return null;
}

export type MiddlewareRewriteResult = {
  targetPath: string;
  hostnameSubdomain: string;
  cleanTenantSlug: string;
  productRoute: SaasProductRoute;
};

function buildRewriteForRoute(
  route: SaasProductRoute,
  hostnameSubdomain: string,
  pathname: string
): MiddlewareRewriteResult {
  const cleanTenantSlug = stripInstitutionalPrefixFromSlug(hostnameSubdomain);
  const prefix = routeToInternalPrefix(route);
  const suffix = pathname === '/' || pathname === '' ? '' : pathname;
  const targetPath =
    pathname === '/' || pathname === '' ? `${prefix}/${cleanTenantSlug}` : `${prefix}/${cleanTenantSlug}${suffix}`;

  return {
    targetPath,
    hostnameSubdomain,
    cleanTenantSlug,
    productRoute: route,
  };
}

/**
 * Tentukan path rewrite internal untuk hostname tenant (dipakai edge middleware & client fallback).
 */
export function resolveMiddlewareRewriteTarget(
  hostname: string,
  pathname: string,
  productOverride?: SaasProductRoute | null
): MiddlewareRewriteResult | null {
  if (isApexLandingHostname(hostname)) {
    return null;
  }

  const hostnameSubdomain = extractHostnameSubdomainSlug(hostname);
  if (!hostnameSubdomain) return null;

  if (productOverride) {
    return buildRewriteForRoute(productOverride, hostnameSubdomain, pathname);
  }

  if (slugMatchesInstitutionalMarker(hostnameSubdomain, LMS_INSTITUTIONAL_MARKERS)) {
    return buildRewriteForRoute('lms', hostnameSubdomain, pathname);
  }

  if (slugMatchesInstitutionalMarker(hostnameSubdomain, SIPUT_INSTITUTIONAL_MARKERS)) {
    return buildRewriteForRoute('siput', hostnameSubdomain, pathname);
  }

  const productHint = extractProductHintFromHostname(hostname);
  if (productHint) {
    return buildRewriteForRoute(productAppToRoute(productHint), hostnameSubdomain, pathname);
  }

  return null;
}

/** Apex domain tanpa subdomain — landing utama (sangat ketat). */
export function isApexLandingHostname(hostname: string): boolean {
  const h = hostname.split(':')[0].toLowerCase();
  return getTenantBaseDomains().some((base) => h === base || h === `www.${base}`);
}

export function getTenantBaseDomain(): string {
  return getTenantBaseDomains()[0];
}

/** Host dev / landing apex — BUKAN subdomain tenant. */
export function isMainDomainHostname(hostname: string): boolean {
  if (isDevPreviewHostname(hostname)) return true;
  return isApexLandingHostname(hostname);
}

/** Hostname punya subdomain tenant yang bisa di-route (heuristik + DB di middleware). */
export function isTenantHostname(hostname: string): boolean {
  if (isMainDomainHostname(hostname)) return false;
  return parseTenantHostname(hostname) != null;
}

/** Subdomain terdeteksi di hostname produksi tapi produk/tenant tidak dikenali. */
export function isUnresolvedTenantHostname(hostname: string): boolean {
  return hostnameHasTenantSubdomain(hostname) && parseTenantHostname(hostname) == null;
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

  if (isApexLandingHostname(h) || isDevPreviewHostname(h)) {
    return null;
  }

  const hostnameSubdomain = extractHostnameSubdomainSlug(h);
  if (!hostnameSubdomain) return null;

  const productHint = extractProductHintFromHostname(h);
  const cleanTenantSlug = stripInstitutionalPrefixFromSlug(hostnameSubdomain);

  let route: SaasProductRoute | null = null;
  if (productHint) {
    route = productAppToRoute(productHint);
  } else if (slugMatchesInstitutionalMarker(hostnameSubdomain, SIPUT_INSTITUTIONAL_MARKERS)) {
    route = 'siput';
  } else if (slugMatchesInstitutionalMarker(hostnameSubdomain, LMS_INSTITUTIONAL_MARKERS)) {
    route = 'lms';
  }

  if (!route) return null;

  const pillar: TenantProductPillar =
    route === 'siput' ? 'siput' : route === 'lms' ? 'lms' : 'kuliner';

  return {
    tenantSlug: hostnameSubdomain,
    cleanTenantSlug,
    productHint,
    pillar,
    hostname: h,
  };
}

/** Path internal SPA untuk rewrite / redirect tenant. */
export function buildTenantRoutePath(
  parsed: ParsedTenantHost,
  productFromDb?: string | null
): string | null {
  const product = productFromDb || parsed.productHint || null;
  if (!product) return null;

  const route = productAppToRoute(product);
  const slug = parsed.cleanTenantSlug || parsed.tenantSlug;
  return `${routeToInternalPrefix(route)}/${slug}`;
}

export function getSubdomainFromHostname(hostname: string): string | null {
  const parsed = parseTenantHostname(hostname);
  return parsed?.cleanTenantSlug ?? parsed?.tenantSlug ?? null;
}
