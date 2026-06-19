import { normalizeTenantSubdomain } from './tenant-insert-utils';

export type ProvisionResult = {
  tenantId: string | null;
  slug: string;
  created: boolean;
  skipped?: boolean;
};

/** Normalisasi slug/subdomain dari baris registrations. */
export function deriveSlugFromRegistration(row: Record<string, unknown>): string {
  const explicit = String(row.kode_tenant || row.subdomain || row.slug || '')
    .trim()
    .toLowerCase();
  if (explicit && explicit !== '-') {
    return normalizeTenantSubdomain(explicit);
  }

  const name = String(
    row.business_name ||
      row.school_name ||
      row.tenant_name ||
      row.full_name ||
      row.admin_name ||
      ''
  );
  return normalizeTenantSubdomain(name);
}
