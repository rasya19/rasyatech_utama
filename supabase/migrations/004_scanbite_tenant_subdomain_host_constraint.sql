-- =============================================================================
-- SCANBITE / KULINER DB — constraint tenant pada subdomain_host saja
-- Jalankan di Supabase project Scanbite (bukan DB LMS/SIPUT)
--
-- Skema Scanbite: tabel tenant TIDAK punya kolom `subdomain`,
-- hanya `subdomain_host` (hostname penuh, mis. tokokopi.rsch.web.id)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_master_subdomain_format'
      AND conrelid = 'public.tenant'::regclass
  ) THEN
    ALTER TABLE public.tenant DROP CONSTRAINT tenant_master_subdomain_format;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_subdomain_format'
      AND conrelid = 'public.tenant'::regclass
  ) THEN
    ALTER TABLE public.tenant DROP CONSTRAINT tenant_subdomain_format;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_subdomain_host_format'
      AND conrelid = 'public.tenant'::regclass
  ) THEN
    ALTER TABLE public.tenant DROP CONSTRAINT tenant_subdomain_host_format;
  END IF;
END $$;

ALTER TABLE public.tenant
  ADD COLUMN IF NOT EXISTS subdomain_host TEXT;

COMMENT ON COLUMN public.tenant.subdomain_host IS
  'Hostname penuh tenant Scanbite/Kuliner, contoh: tokokopi.rsch.web.id';

-- Format FQDN: label.label... (huruf kecil, angka, strip per label, wajib ada titik)
ALTER TABLE public.tenant
  ADD CONSTRAINT tenant_subdomain_host_format
  CHECK (
    subdomain_host ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_subdomain_host_unique
  ON public.tenant (subdomain_host);
