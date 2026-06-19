/**
 * Parser hostname multi-tenant Rasyatech.
 * Mendukung:
 *   - pkbm-armilla.rsch.my.id / pkbmarmilla.rsch.my.id  → LMS
 *   - kb-ceria.rsch.my.id / kbceria.rsch.my.id           → SIPUT PAUD
 *   - tkarmillanusa.rsch.my.id                           → SIPUT (compact tanpa strip)
 *   - rasyatech.rsch.my.id                               → landing utama (bukan tenant)
 */

export type TenantProductPillar = 'lms' | 'siput' | 'kuliner';

/** Rute internal per produk SaaS (5 pilar). */
export type SaasProductRoute = 'lms' | 'siput' | 'scanbite' | 'resto' | 'instafood';

export type ParsedTenantHost = {
  /** Slug lengkap dari hostname (mis. pkbm-armilla, tkarmillanusa). */
  tenantSlug: string;
  /** Slug bersih tanpa awalan kelembagaan — untuk lookup/display legacy. */
  cleanTenantSlug: string;
  /** Slug route SPA (normalisasi DB, mis. tkarmillanusa). */
  routeTenantSlug: string;
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

type InstitutionalEntry = {
  hyphen: string;
  compact: string;
  pillar: 'lms' | 'siput';
};

/** Urutan: awalan terpanjang dulu agar pkbm tidak tertangkap sebagai pk. */
const INSTITUTIONAL_ENTRIES: InstitutionalEntry[] = [
  { hyphen: 'pkbm-', compact: 'pkbm', pillar: 'lms' },
  { hyphen: 'skb-', compact: 'skb', pillar: 'lms' },
  { hyphen: 'tk-', compact: 'tk', pillar: 'siput' },
  { hyphen: 'kb-', compact: 'kb', pillar: 'siput' },
  { hyphen: 'sps-', compact: 'sps', pillar: 'siput' },
  { hyphen: 'tpa-', compact: 'tpa', pillar: 'siput' },
  { hyphen: 'paud-', compact: 'paud', pillar: 'siput' },
];

/** Awalan kelembagaan Indonesia — LMS Kesetaraan (PKBM / SKB). */
export const LMS_INSTITUTIONAL_MARKERS = ['pkbm-', 'skb-'] as const;

/** Awalan kelembagaan Indonesia — SIPUT PAUD (TK, KB, SPS, TPA, PAUD). */
export const SIPUT_INSTITUTIONAL_MARKERS = ['tk-', 'kb-', 'sps-', 'tpa-', 'paud-'] as const;

/** Normalisasi slug hostname → format DB (huruf kecil, tanpa strip). */
export function normalizeHostnameSubdomainSlug(slug: string): string {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 32);
}

type DetectedInstitutional = {
  pillar: 'lms' | 'siput';
  hyphenMarker: string;
  compactMarker: string;
};

function detectInstitutionalPrefix(slug: string): DetectedInstitutional | null {
  const raw = slug.trim().toLowerCase();
  const compact = normalizeHostnameSubdomainSlug(slug);
  if (!raw && !compact) return null;

  for (const entry of INSTITUTIONAL_ENTRIES) {
    if (raw.startsWith(entry.hyphen)) {
      return {
        pillar: entry.pillar,
        hyphenMarker: entry.hyphen,
        compactMarker: entry.compact,
      };
    }
    if (compact.startsWith(entry.compact) && compact.length > entry.compact.length) {
      return {
        pillar: entry.pillar,
        hyphenMarker: entry.hyphen,
        compactMarker: entry.compact,
      };
    }
  }

  return null;
}

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
  const read = (key: string, fallback: string): string => {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return String(process.env[key]).trim();
    }
    if (typeof import.meta !== 'undefined') {
      const value = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
      if (value?.trim()) return value.trim();
    }
    return fallback;
  };

  const edu = read('VITE_TENANT_DOMAIN', 'rsch.my.id');
  const kuliner = read('VITE_TENANT_DOMAIN_KULINER', 'rsch.web.id');
  const apex = read('VITE_APEX_DOMAIN', 'rasyatech.com');
  return [...new Set([edu, kuliner, apex].map((d) => String(d).toLowerCase().replace(/^\.+/, '')))];
}

export function slugMatchesInstitutionalMarker(
  slug: string,
  markers: readonly string[]
): boolean {
  const detected = detectInstitutionalPrefix(slug);
  if (!detected) return false;
  const pillarMarkers =
    detected.pillar === 'lms' ? LMS_INSTITUTIONAL_MARKERS : SIPUT_INSTITUTIONAL_MARKERS;
  if (markers !== LMS_INSTITUTIONAL_MARKERS && markers !== SIPUT_INSTITUTIONAL_MARKERS) {
    return markers.some((marker) => {
      const raw = slug.trim().toLowerCase();
      const compact = normalizeHostnameSubdomainSlug(slug);
      const compactMarker = marker.replace(/-$/, '');
      return raw.startsWith(marker) || compact.startsWith(compactMarker);
    });
  }
  return pillarMarkers === markers;
}

/** Infer pillar dari slug subdomain (pkbm-*, kb-*, tkarmillanusa, dll.). */
export function inferPillarFromInstitutionalSlug(slug: string): TenantProductPillar | null {
  return detectInstitutionalPrefix(slug)?.pillar ?? null;
}

/** Nilai `product_app` di tabel tenant master dari awalan kelembagaan. */
export function inferProductAppFromInstitutionalSlug(slug: string): 'lms' | 'siput' | null {
  return detectInstitutionalPrefix(slug)?.pillar ?? null;
}

/** Hapus awalan kelembagaan dari slug subdomain untuk lookup database legacy. */
export function stripInstitutionalPrefixFromSlug(slug: string): string {
  const raw = slug.trim().toLowerCase();
  const compact = normalizeHostnameSubdomainSlug(slug);
  const detected = detectInstitutionalPrefix(slug);

  if (detected) {
    if (raw.startsWith(detected.hyphenMarker)) {
      const stripped = raw.slice(detected.hyphenMarker.length).replace(/^-+/, '');
      return stripped || compact;
    }
    if (compact.startsWith(detected.compactMarker)) {
      const stripped = compact.slice(detected.compactMarker.length);
      return stripped || compact;
    }
  }

  return compact || raw;
}

/** Slug untuk path internal SPA — selaras kolom `subdomain` di DB (compact). */
export function routeTenantSlugFromHostnameSubdomain(slug: string): string {
  return normalizeHostnameSubdomainSlug(slug) || slug.trim().toLowerCase();
}

/** Bangun subdomain penuh dengan awalan kelembagaan untuk DNS (mis. pkbm-armilla-nusa). */
export function buildInstitutionalSubdomain(
  cleanSlug: string,
  pillar: 'lms' | 'siput'
): string {
  const base = cleanSlug.trim().toLowerCase().replace(/^-+/, '');
  if (!base) return cleanSlug;

  if (pillar === 'lms') {
    if (detectInstitutionalPrefix(base)) return base;
    return `pkbm-${base}`;
  }

  if (detectInstitutionalPrefix(base)) return base;
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
  const routeTenantSlug = routeTenantSlugFromHostnameSubdomain(hostnameSubdomain);
  const prefix = routeToInternalPrefix(route);
  const suffix = pathname === '/' || pathname === '' ? '' : pathname;
  const targetPath =
    pathname === '/' || pathname === ''
      ? `${prefix}/${routeTenantSlug}`
      : `${prefix}/${routeTenantSlug}${suffix}`;

  return {
    targetPath,
    hostnameSubdomain,
    cleanTenantSlug: routeTenantSlug,
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

  const institutional = detectInstitutionalPrefix(hostnameSubdomain);
  if (institutional?.pillar === 'lms') {
    return buildRewriteForRoute('lms', hostnameSubdomain, pathname);
  }
  if (institutional?.pillar === 'siput') {
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

/**
 * Host portal utama Rasyatech (landing + master admin).
 * Termasuk apex (rsch.my.id) dan subdomain portal (rasyatech.rsch.my.id).
 */
export function isRasyatechPortalHostname(hostname: string): boolean {
  if (isMainDomainHostname(hostname)) return true;

  const h = hostname.split(':')[0].toLowerCase();
  for (const base of getTenantBaseDomains()) {
    const parts = h.split('.');
    const baseParts = base.split('.');
    if (parts.slice(-baseParts.length).join('.') !== base) continue;

    const prefix = parts.slice(0, parts.length - baseParts.length);
    if (prefix.length === 1 && PORTAL_SLUGS.has(prefix[0])) {
      return true;
    }
  }

  return false;
}

/** Path yang hanya untuk master admin Rasyatech — jangan rewrite ke tenant. */
export function isMasterAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/master-admin' ||
    pathname.startsWith('/master-admin/')
  );
}

/** Hostname punya subdomain tenant yang bisa di-route (heuristik + DB di middleware). */
export function isTenantHostname(hostname: string): boolean {
  if (isMainDomainHostname(hostname)) return false;
  if (parseTenantHostname(hostname) != null) return true;
  return hostnameHasTenantSubdomain(hostname);
}

/** Subdomain terdeteksi di hostname produksi tapi produk/tenant tidak dikenali. */
export function isUnresolvedTenantHostname(hostname: string): boolean {
  if (isMainDomainHostname(hostname)) return false;
  if (parseTenantHostname(hostname) != null) return false;
  return hostnameHasTenantSubdomain(hostname);
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
  const institutional = detectInstitutionalPrefix(hostnameSubdomain);
  const routeTenantSlug = routeTenantSlugFromHostnameSubdomain(hostnameSubdomain);
  const cleanTenantSlug = stripInstitutionalPrefixFromSlug(hostnameSubdomain);

  let route: SaasProductRoute | null = null;
  if (productHint) {
    route = productAppToRoute(productHint);
  } else if (institutional?.pillar === 'siput') {
    route = 'siput';
  } else if (institutional?.pillar === 'lms') {
    route = 'lms';
  }

  if (!route) return null;

  const pillar: TenantProductPillar =
    route === 'siput' ? 'siput' : route === 'lms' ? 'lms' : 'kuliner';

  return {
    tenantSlug: hostnameSubdomain,
    cleanTenantSlug,
    routeTenantSlug,
    productHint,
    pillar,
    hostname: h,
  };
}

function resolveProductForRoute(
  parsed: ParsedTenantHost,
  productFromDb?: string | null
): string | null {
  if (productFromDb) return productFromDb;
  if (parsed.productHint) return parsed.productHint;
  const fromSlug = inferProductAppFromInstitutionalSlug(parsed.tenantSlug);
  if (fromSlug) return fromSlug;
  if (parsed.pillar === 'siput') return 'siput';
  if (parsed.pillar === 'lms') return 'lms';
  if (parsed.pillar === 'kuliner') return 'scanbite';
  return null;
}

/** Path internal SPA untuk rewrite / redirect tenant. */
export function buildTenantRoutePath(
  parsed: ParsedTenantHost,
  productFromDb?: string | null
): string | null {
  const product = resolveProductForRoute(parsed, productFromDb);
  if (!product) return null;

  const route = productAppToRoute(product);
  const slug = parsed.routeTenantSlug || routeTenantSlugFromHostnameSubdomain(parsed.tenantSlug);
  return `${routeToInternalPrefix(route)}/${slug}`;
}

export function getSubdomainFromHostname(hostname: string): string | null {
  const parsed = parseTenantHostname(hostname);
  if (parsed) {
    return parsed.routeTenantSlug || parsed.cleanTenantSlug || parsed.tenantSlug;
  }
  const slug = extractHostnameSubdomainSlug(hostname);
  return slug ? routeTenantSlugFromHostnameSubdomain(slug) : null;
}

const INTERNAL_TENANT_PATH_PREFIXES = [
  '/_lms/',
  '/_siput/',
  '/_scanbite/',
  '/_resto/',
  '/_instafood/',
  '/lms/',
  '/siput/',
  '/kuliner/',
] as const;

export function isInternalTenantPath(pathname: string): boolean {
  return INTERNAL_TENANT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Pilar produk untuk TenantProductRoute dari hasil parse hostname. */
export function resolveTenantProductPillarFromParsed(
  parsed: ParsedTenantHost
): SaasProductRoute | 'kuliner' {
  if (parsed.productHint) {
    return productAppToRoute(parsed.productHint);
  }
  if (parsed.pillar === 'siput') return 'siput';
  if (parsed.pillar === 'lms') return 'lms';
  return 'scanbite';
}

export function shouldSkipLandingSplash(hostname: string, pathname: string): boolean {
  if (isTenantHostname(hostname)) return true;
  return isInternalTenantPath(pathname);
}
