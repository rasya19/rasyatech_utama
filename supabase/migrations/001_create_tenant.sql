-- Gerbang Pendaftaran Rasyatech — tabel master tenant (5 pilar SaaS)
-- Jalankan di Supabase SQL Editor sebelum menggunakan form /daftar

CREATE TABLE IF NOT EXISTS public.tenant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name TEXT NOT NULL,
  product_app TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  subdomain_host TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  whatsapp TEXT,
  npsn TEXT DEFAULT '-',
  package_tier TEXT DEFAULT 'standard',
  meta_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'active')),
  registration_id UUID,
  source TEXT DEFAULT 'gerbang_pendaftaran',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_subdomain_unique UNIQUE (subdomain),
  CONSTRAINT tenant_subdomain_format CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$')
);

CREATE INDEX IF NOT EXISTS idx_tenant_product_app ON public.tenant (product_app);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON public.tenant (status);
CREATE INDEX IF NOT EXISTS idx_tenant_admin_email ON public.tenant (admin_email);

-- Kolom tambahan di registrations (legacy) — abaikan error jika kolom sudah ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'product_app'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN product_app TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN tenant_id UUID REFERENCES public.tenant(id);
  END IF;
END $$;

ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;

-- Anon boleh insert pendaftaran baru (form publik)
DROP POLICY IF EXISTS "tenant_anon_insert" ON public.tenant;
CREATE POLICY "tenant_anon_insert"
  ON public.tenant FOR INSERT TO anon
  WITH CHECK (status = 'pending');

-- Anon boleh baca subdomain sendiri (opsional, untuk preview)
DROP POLICY IF EXISTS "tenant_anon_select_pending" ON public.tenant;
CREATE POLICY "tenant_anon_select_pending"
  ON public.tenant FOR SELECT TO anon
  USING (status = 'pending');

COMMENT ON TABLE public.tenant IS 'Master tenant Gerbang Pendaftaran Rasyatech — SIPUT, LMS Armilla, ScanBite, dll.';
COMMENT ON COLUMN public.tenant.subdomain IS 'Slug unik per tenant, contoh: armillanusa → armillanusa.rsch.my.id';
COMMENT ON COLUMN public.tenant.product_app IS 'Pilihan aplikasi: lms, armilla, siput, scanbite, restoran_asli, Instafood';
