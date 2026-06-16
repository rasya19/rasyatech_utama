/**
 * Katalog 5 pilar SaaS Rasyatech — Gerbang Pendaftaran (rasyatech_utama).
 * Dipakai form pendaftaran & integrasi Supabase tenant.
 */

export type SaasProductId =
  | 'lms'
  | 'armilla'
  | 'siput'
  | 'scanbite'
  | 'restoran_asli'
  | 'Instafood';

export interface SaasProduct {
  id: SaasProductId;
  label: string;
  shortName: string;
  description: string;
  portalUrl: string;
  /** Kategori tenant: sekolah vs bisnis kuliner */
  tenantType: 'sekolah' | 'kuliner';
  /** Kolom business_type di Supabase kuliner (jika berbeda dari id) */
  kulinerBusinessType?: string;
}

/** Lima pilar utama + alias Armilla untuk LMS PKBM */
export const SAAS_PRODUCTS: SaasProduct[] = [
  {
  id: 'lms',
  label: 'Rasya LMS Kesetaraan / PKBM',
  shortName: 'Rasya LMS',
  description: 'Learning Management System untuk PKBM, LKP, dan pendidikan non-formal.',
  portalUrl: 'https://lms.rsch.my.id',  // ✅ GANTI
  tenantType: 'sekolah',
},
{
  id: 'armilla',
  label: 'Rasya LMS Armilla Nusa',
  shortName: 'LMS Armilla',
  description: 'LMS khusus satuan pendidikan seperti PKBM Armilla Nusa.',
  portalUrl: 'https://lms.rsch.my.id',  // ✅ GANTI (sama dengan lms)
  tenantType: 'sekolah',
},
{
  id: 'siput',
  label: 'SIPUT — Sistem Informasi PAUD Terpadu',
  shortName: 'SIPUT',
  description: 'Manajemen data murid, guru, dan kelas untuk PAUD/TK.',
  portalUrl: 'https://siput.rsch.my.id',  // ✅ GANTI
  tenantType: 'sekolah',
  kulinerBusinessType: 'siput',
},
  {
    id: 'scanbite',
    label: 'ScanBite (Cafe & Barista)',
    shortName: 'ScanBite',
    description: 'Pemindaian menu makanan cerdas untuk efisiensi operasional cafe.',
    portalUrl: 'https://sb.rsch.web.id',
    tenantType: 'kuliner',
  },
  {
    id: 'restoran_asli',
    label: 'Restoran Asli (POS & Kasir)',
    shortName: 'Restoran Asli',
    description: 'Point of Sales dengan manajemen stok dan pelaporan komprehensif.',
    portalUrl: 'https://ra.rsch.web.id',
    tenantType: 'kuliner',
  },
  {
    id: 'Instafood',
    label: 'Instafood (E-Menu & Delivery)',
    shortName: 'Instafood',
    description: 'Manajemen menu digital dan integrasi kurir internal.',
    portalUrl: 'https://if.rsch.web.id',
    tenantType: 'kuliner',
  },
];

export const TENANT_SUBDOMAIN_DOMAIN =
  import.meta.env.VITE_TENANT_DOMAIN || 'rsch.my.id';

export function getSaasProduct(id: string): SaasProduct | undefined {
  return SAAS_PRODUCTS.find((p) => p.id === id);
}

export function getSaasProductLabel(id: string): string {
  return getSaasProduct(id)?.label ?? 'Layanan Rasyatech';
}

export function getSaasProductPortalUrl(id: string): string {
  return getSaasProduct(id)?.portalUrl ?? '/';
}

/** Normalisasi id produk (armilla → lms untuk registrations legacy) */
export function normalizeProductForRegistrations(id: SaasProductId): string {
  if (id === 'armilla') return 'lms';
  return id;
}

export function isSchoolProduct(id: string): boolean {
  const product = getSaasProduct(id);
  return product?.tenantType === 'sekolah';
}

export function isCulinaryProduct(id: string): boolean {
  const product = getSaasProduct(id);
  return product?.tenantType === 'kuliner';
}
