/**
 * Parser hostname multi-tenant Rasyatech.
 * Mendukung:
 *   - pkbm-armilla.rsch.my.id          → LMS Kesetaraan (awalan PKBM)
 *   - kb-ceria.rsch.my.id              → SIPUT PAUD (awalan KB)
 *   - sps-amanah.rsch.my.id            → SIPUT PAUD (awalan SPS)
 *   - rasyatech.rsch.my.id             → landing utama (bukan tenant)
 */

export type TenantProductPillar = 'lms' | 'siput' | 'kuliner';

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
  return markers.some((marker) => normalized.startsWith(marker) || normalized.includes(marker));
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
    if (PORTAL_SLUGS.has(slug)) return true;
    if (PRODUCT_SEGMENTS.has(slug)) return true;
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
        cleanTenantSlug: stripInstitutionalPrefixFromSlug(legacySlug),
        productHint: null,
        pillar: inferPillarFromInstitutionalSlug(legacySlug) ?? 'lms',
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

  const cleanTenantSlug = stripInstitutionalPrefixFromSlug(tenantSlug);

  const pillar =
    productHint != null
      ? inferPillarFromProduct(productHint)
      : inferPillarFromInstitutionalSlug(tenantSlug) ?? 'lms';

  console.log('[tenant-host-parser] tenant detected:', {
    hostname: h,
    tenantSlug,
    cleanTenantSlug,
    productHint,
    pillar,
  });

  return { tenantSlug, cleanTenantSlug, productHint, pillar, hostname: h };
}

/** Path internal SPA untuk rewrite / redirect tenant. */
export function buildTenantRoutePath(
  parsed: ParsedTenantHost,
  productFromDb?: string | null
): string {
  const product = parsed.productHint || productFromDb || null;
  const pillar = product
    ? inferPillarFromProduct(product)
    : inferPillarFromInstitutionalSlug(parsed.tenantSlug) ?? parsed.pillar;

  const slug = parsed.cleanTenantSlug || parsed.tenantSlug;

  if (pillar === 'siput') return `/_siput/${slug}`;
  if (pillar === 'kuliner') return `/kuliner/${slug}`;
  return `/_lms/${slug}`;
}

export function getSubdomainFromHostname(hostname: string): string | null {
  const parsed = parseTenantHostname(hostname);
  return parsed?.cleanTenantSlug ?? parsed?.tenantSlug ?? null;
}
