import type { SaasProductApp, SaasProductType } from './saas-product-options';
import {
  buildExternalProductTenantLoginUrl,
  shouldUseExternalProductApp,
} from './product-external-urls';
import {
  stripInstitutionalPrefixFromSlug,
  type SaasProductRoute,
  productAppToRoute,
  routeToInternalPrefix,
} from './tenant-host-parser';

const EDU_DOMAIN =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TENANT_DOMAIN) ||
  (typeof process !== 'undefined' && process.env?.VITE_TENANT_DOMAIN) ||
  'rsch.my.id';

const KULINER_DOMAIN =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TENANT_DOMAIN_KULINER) ||
  (typeof process !== 'undefined' && process.env?.VITE_TENANT_DOMAIN_KULINER) ||
  'rsch.web.id';

const APEX_DOMAIN =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APEX_DOMAIN) ||
  (typeof process !== 'undefined' && process.env?.VITE_APEX_DOMAIN) ||
  'rasyatech.com';

export function getEduTenantDomain(): string {
  return String(EDU_DOMAIN).toLowerCase().replace(/^\.+/, '');
}

export function getKulinerTenantDomain(): string {
  return String(KULINER_DOMAIN).toLowerCase().replace(/^\.+/, '');
}

export function getApexMarketingDomain(): string {
  return String(APEX_DOMAIN).toLowerCase().replace(/^\.+/, '');
}

export function resolveTenantHostnameDomain(product: SaasProductApp | string): string {
  const upper = String(product).toUpperCase();
  if (upper === 'SCANBITE' || upper === 'RESTO' || upper === 'INSTAFOOD') {
    return getKulinerTenantDomain();
  }
  return getEduTenantDomain();
}

/** URL login portal tenant — untuk SIPUT/LMS arahkan ke aplikasi produk asli. */
export function buildTenantLoginUrl(
  kodeTenant: string,
  product: SaasProductApp | SaasProductType | string
): string {
  const productKey = String(product).toUpperCase();
  if (shouldUseExternalProductApp(productKey.toLowerCase())) {
    return buildExternalProductTenantLoginUrl(
      productKey.toLowerCase() as 'siput' | 'lms',
      kodeTenant
    );
  }
  return buildTenantPortalUrl(kodeTenant, product);
}

/** URL portal tenant publik, mis. https://pkbm-armilla.rsch.my.id */
export function buildTenantPortalUrl(
  kodeTenant: string,
  product: SaasProductApp | SaasProductType | string
): string {
  const slug = kodeTenant.trim().toLowerCase();
  const productKey = String(product).toUpperCase();
  const domain = resolveTenantHostnameDomain(productKey);
  return `https://${slug}.${domain}`;
}

/** Path internal SPA untuk produk + slug bersih. */
export function buildTenantInternalPath(
  product: SaasProductApp | SaasProductType | string,
  kodeTenant: string
): string {
  const route = productAppToRoute(String(product).toUpperCase());
  const clean = stripInstitutionalPrefixFromSlug(kodeTenant);
  return `${routeToInternalPrefix(route)}/${clean}`;
}

export function buildTenantApprovalMessage(params: {
  fullName: string;
  businessName: string;
  product: string;
  kodeTenant: string;
  email?: string;
}): { portalUrl: string; whatsappText: string; emailText: string } {
  const productApp = String(params.product).toUpperCase();
  const portalUrl = buildTenantLoginUrl(params.kodeTenant, productApp);
  const internalPath = buildTenantInternalPath(productApp, params.kodeTenant);

  const whatsappText =
    `Halo ${params.fullName}, pendaftaran *${params.businessName}* di Rasyatech telah *DISETUJUI*.\n\n` +
    `Produk: ${productApp}\n` +
    `Portal tenant Anda:\n${portalUrl}\n\n` +
    `Silakan buka link di atas untuk mengakses sistem. Jangan gunakan domain utama rasyatech.com.\n\n` +
    `Tim Rasyatech`;

  const emailText =
    `Halo ${params.fullName},\n\n` +
    `Pendaftaran ${params.businessName} untuk layanan ${productApp} telah disetujui.\n\n` +
    `URL Portal Tenant: ${portalUrl}\n` +
    `Jalur aplikasi: ${internalPath}\n` +
    (params.email ? `Email terdaftar: ${params.email}\n` : '') +
    `\nSalam,\nRasyatech Support`;

  return { portalUrl, whatsappText, emailText };
}
