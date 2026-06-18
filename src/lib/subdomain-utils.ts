import { TENANT_SUBDOMAIN_DOMAIN } from './saas-products';

export {
  isMainDomainHostname,
  getSubdomainFromHostname,
  parseTenantHostname,
  buildTenantRoutePath,
  getTenantBaseDomain,
  inferPillarFromProduct,
  inferPillarFromInstitutionalSlug,
  inferProductAppFromInstitutionalSlug,
  stripInstitutionalPrefixFromSlug,
  buildInstitutionalSubdomain,
  resolveMiddlewareRewriteTarget,
  isApexLandingHostname,
  extractHostnameSubdomainSlug,
  slugMatchesInstitutionalMarker,
  LMS_INSTITUTIONAL_MARKERS,
  SIPUT_INSTITUTIONAL_MARKERS,
} from './tenant-host-parser';

const SUBDOMAIN_MIN_LENGTH = 3;
const SUBDOMAIN_MAX_LENGTH = 32;

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'master',
  'master-admin',
  'daftar',
  'login',
  'app',
  'mail',
  'dinas',
  'demo',
  'test',
  'staging',
]);

/**
 * Menghasilkan slug subdomain unik dari nama sekolah/tenant.
 * Hanya huruf kecil dan angka; tanpa spasi atau karakter khusus.
 */
export function generateSubdomainFromTenantName(tenantName: string): string {
  const slug = tenantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '')
    .slice(0, SUBDOMAIN_MAX_LENGTH);

  return slug.length >= SUBDOMAIN_MIN_LENGTH ? slug : '';
}

export function validateSubdomain(subdomain: string): string | null {
  const normalized = subdomain.trim().toLowerCase();

  if (!normalized) {
    return 'Subdomain wajib diisi.';
  }
  if (normalized.length < SUBDOMAIN_MIN_LENGTH) {
    return `Subdomain minimal ${SUBDOMAIN_MIN_LENGTH} karakter.`;
  }
  if (normalized.length > SUBDOMAIN_MAX_LENGTH) {
    return `Subdomain maksimal ${SUBDOMAIN_MAX_LENGTH} karakter.`;
  }
  if (!/^[a-z0-9]+$/.test(normalized)) {
    return 'Subdomain hanya boleh huruf kecil dan angka (tanpa spasi).';
  }
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return 'Subdomain ini tidak tersedia (nama sistem).';
  }
  return null;
}

export function formatTenantUrl(subdomain: string): string {
  const host = TENANT_SUBDOMAIN_DOMAIN.replace(/^\.+/, '');
  return `https://${subdomain}.${host}`;
}

export function formatTenantHost(subdomain: string): string {
  const host = TENANT_SUBDOMAIN_DOMAIN.replace(/^\.+/, '');
  return `${subdomain}.${host}`;
}

export type SubdomainAvailability = {
  available: boolean;
  subdomain: string;
  message?: string;
};

/** Cek ketersediaan subdomain via API server (tenant + registrations). */
export async function checkSubdomainAvailability(
  subdomain: string
): Promise<SubdomainAvailability> {
  const validationError = validateSubdomain(subdomain);
  if (validationError) {
    return { available: false, subdomain, message: validationError };
  }

  const params = new URLSearchParams({ subdomain: subdomain.trim().toLowerCase() });
  const response = await fetch(`/api/check-subdomain?${params.toString()}`);

  if (response.status === 404) {
    return { available: true, subdomain: subdomain.trim().toLowerCase() };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return {
      available: false,
      subdomain,
      message: body.error || 'Gagal memeriksa subdomain.',
    };
  }

  return {
    available: false,
    subdomain,
    message: 'Subdomain sudah digunakan tenant lain.',
  };
}
