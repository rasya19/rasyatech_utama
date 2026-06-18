/** Opsi produk utama formulir pendaftaran SaaS — 5 pilar setara. */
export type SaasProductType = 'lms' | 'siput' | 'scanbite' | 'resto' | 'instafood';

export type SaasProductApp = 'LMS' | 'SIPUT' | 'SCANBITE' | 'RESTO' | 'INSTAFOOD';

export const SAAS_PRODUCT_OPTIONS: ReadonlyArray<{
  value: SaasProductType;
  label: string;
  productApp: SaasProductApp;
}> = [
  { value: 'lms', label: 'LMS (Kesetaraan / PKBM)', productApp: 'LMS' },
  { value: 'siput', label: 'SIPUT (PAUD)', productApp: 'SIPUT' },
  { value: 'scanbite', label: 'SCANBITE (Kuliner)', productApp: 'SCANBITE' },
  { value: 'resto', label: 'RESTO', productApp: 'RESTO' },
  { value: 'instafood', label: 'INSTAFOOD', productApp: 'INSTAFOOD' },
] as const;

export const SAAS_PRODUCT_TYPES: SaasProductType[] = SAAS_PRODUCT_OPTIONS.map((o) => o.value);

export function normalizeProductParam(param: string | null): SaasProductType {
  if (!param) return 'lms';
  const lower = param.trim().toLowerCase();
  if (lower === 'restoran_asli' || lower === 'restoran') return 'resto';
  if (lower === 'instafood' || lower === 'instafoto') return 'instafood';
  if (SAAS_PRODUCT_TYPES.includes(lower as SaasProductType)) {
    return lower as SaasProductType;
  }
  return 'lms';
}

export function toProductApp(type: SaasProductType): SaasProductApp {
  return (
    SAAS_PRODUCT_OPTIONS.find((o) => o.value === type)?.productApp ??
    (type.toUpperCase() as SaasProductApp)
  );
}

export function isMainDbProduct(type: SaasProductType): boolean {
  return type === 'lms' || type === 'siput';
}

export function isKulinerDbProduct(type: SaasProductType): boolean {
  return type === 'scanbite' || type === 'resto' || type === 'instafood';
}

/** LMS wajib pilih paket; produk lain otomatis free. */
export function resolvePackageTierForProduct(
  type: SaasProductType,
  selectedPackage: string,
  defaultLmsTier = 'basic'
): string {
  if (type === 'lms') {
    return selectedPackage.trim() || defaultLmsTier;
  }
  return 'free';
}

export function getProductRedirectDomain(type: SaasProductType): string {
  return isKulinerDbProduct(type) ? 'rsch.web.id' : 'rsch.my.id';
}
