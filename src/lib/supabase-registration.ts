/**
 * Gerbang Pendaftaran Rasyatech — entry point integrasi Supabase.
 * Import dari sini untuk form, API, dan admin panel.
 */
export {
  SAAS_PRODUCTS,
  TENANT_SUBDOMAIN_DOMAIN,
  getSaasProduct,
  getSaasProductLabel,
  getSaasProductPortalUrl,
  normalizeProductForRegistrations,
  isSchoolProduct,
  isCulinaryProduct,
  type SaasProduct,
  type SaasProductId,
} from './saas-products';

export {
  generateSubdomainFromTenantName,
  validateSubdomain,
  formatTenantUrl,
  formatTenantHost,
  checkSubdomainAvailability,
  type SubdomainAvailability,
} from './subdomain-utils';

export {
  submitTenantRegistration,
  notifyRegistrationWebhook,
  type TenantRegistrationFormData,
  type TenantRegistrationResponse,
} from './tenant-registration';

export {
  registerTenant,
  checkSubdomainAvailable,
  type TenantRegistrationPayload,
  type TenantRegistrationResult,
} from './register-tenant-core';
