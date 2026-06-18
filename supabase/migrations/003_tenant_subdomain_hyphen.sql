-- Sanitasi provisioning: subdomain huruf kecil + angka saja (tanpa strip)
-- Jalankan di SQL Editor DB produk LMS / SIPUT (dan master jika tenant ada di sana)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_subdomain_format'
      AND conrelid = 'public.tenant'::regclass
  ) THEN
    ALTER TABLE public.tenant DROP CONSTRAINT tenant_subdomain_format;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_master_subdomain_format'
      AND conrelid = 'public.tenant'::regclass
  ) THEN
    ALTER TABLE public.tenant DROP CONSTRAINT tenant_master_subdomain_format;
  END IF;
END $$;

ALTER TABLE public.tenant
  ADD CONSTRAINT tenant_subdomain_format
  CHECK (subdomain ~ '^[a-z0-9]{3,32}$');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'subdomain_host'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN subdomain_host TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.tenant.subdomain IS 'Slug unik tenant; huruf kecil, angka, dan strip (-), 3–48 karakter';
COMMENT ON COLUMN public.tenant.subdomain_host IS 'Hostname penuh tenant, mis. pkbm-armilla.rsch.my.id';
