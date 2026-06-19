-- Selaraskan tabel tenant di DB produk SIPUT/LMS (legacy) dengan payload provisioning Rasyatech.
-- Jalankan di Supabase project SIPUT (dan LMS jika skema berbeda).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'admin_email'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN admin_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'admin_name'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN admin_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'tenant_name'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN tenant_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'subdomain_host'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN subdomain_host TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'package_tier'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN package_tier TEXT DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN source TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tenant ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Backfill dari kolom legacy jika ada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'email'
  ) THEN
    UPDATE public.tenant
    SET admin_email = COALESCE(admin_email, email)
    WHERE admin_email IS NULL AND email IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant' AND column_name = 'school_name'
  ) THEN
    UPDATE public.tenant
    SET tenant_name = COALESCE(tenant_name, school_name)
    WHERE tenant_name IS NULL AND school_name IS NOT NULL;
  END IF;
END $$;
