-- ============================================================
-- RASYATECH MASTER HUB – SUPABASE SQL SCHEMA
-- Central Registration Gate + 5 SaaS Product Pillars
-- Run this entire file in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. MASTER REGISTRATION TABLE  (rasyatech.rsch.my.id)
-- Single entry point for all 5 products
-- ============================================================

CREATE TABLE IF NOT EXISTS registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT,
  admin_name        TEXT,
  admin_email       TEXT,
  email             TEXT,
  whatsapp          TEXT,
  school_name       TEXT,
  business_name     TEXT,
  npsn              TEXT,
  address           TEXT,
  subdomain         TEXT UNIQUE,
  product_type      TEXT CHECK (product_type IN ('lms','siput','scanbite','instafood','resto')),
  product_name      TEXT,           -- legacy / friendly label
  package           TEXT DEFAULT 'silver',
  paket_langganan   TEXT DEFAULT 'silver',
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','verified','suspended')),
  is_approved       BOOLEAN DEFAULT FALSE,
  auth_uid          UUID,           -- Supabase auth.users.id after provisioning
  meta_data         JSONB DEFAULT '{}'::JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_registrations_updated ON registrations;
CREATE TRIGGER trg_registrations_updated
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 2. ARMILLA LMS  –  PKBM / Pendidikan Kesetaraan
-- ============================================================

CREATE TABLE IF NOT EXISTS lms_schools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID REFERENCES registrations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  npsn             TEXT,
  address          TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  logo_url         TEXT,
  subdomain        TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_students (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID REFERENCES lms_schools(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  nisn           TEXT,
  grade_level    TEXT,          -- 'Paket A' | 'Paket B' | 'Paket C'
  gender         TEXT CHECK (gender IN ('L','P')),
  dob            DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES lms_schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  nip         TEXT,
  subject     TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID REFERENCES lms_schools(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  grade_level  TEXT,
  teacher_id   UUID REFERENCES lms_teachers(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES lms_students(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  period      TEXT NOT NULL,   -- 'Semester 1 2025/2026'
  score       NUMERIC(5,2),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES lms_students(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES lms_courses(id),
  date        DATE NOT NULL,
  status      TEXT CHECK (status IN ('hadir','sakit','izin','alpha')) DEFAULT 'hadir',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. SIPUT  –  PAUD / TK / E-Rapor
-- ============================================================

CREATE TABLE IF NOT EXISTS siput_schools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID REFERENCES registrations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  npsn             TEXT,
  address          TEXT,
  kecamatan        TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  subdomain        TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siput_students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID REFERENCES siput_schools(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  nik          TEXT,
  dob          DATE,
  gender       TEXT CHECK (gender IN ('L','P')),
  parent_name  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siput_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES siput_students(id) ON DELETE CASCADE,
  period      TEXT NOT NULL,
  aspect      TEXT NOT NULL,   -- 'Nilai Agama & Moral' | 'Fisik Motorik' | etc.
  score       TEXT CHECK (score IN ('BSB','BSH','MB','BB')) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS siput_raport (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES siput_students(id) ON DELETE CASCADE,
  period        TEXT NOT NULL,
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  signed_by     TEXT,
  pdf_url       TEXT
);


-- ============================================================
-- 4. SCANBITE  –  Smart Restaurant & Song Request
-- ============================================================

CREATE TABLE IF NOT EXISTS scanbite_outlets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID REFERENCES registrations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  address          TEXT,
  contact_phone    TEXT,
  table_count      INTEGER DEFAULT 0,
  subdomain        TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scanbite_tables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id    UUID REFERENCES scanbite_outlets(id) ON DELETE CASCADE,
  number       TEXT NOT NULL,
  capacity     INTEGER DEFAULT 4,
  qr_code_url  TEXT,
  status       TEXT CHECK (status IN ('available','occupied','reserved')) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS scanbite_menus (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id     UUID REFERENCES scanbite_outlets(id) ON DELETE CASCADE,
  category      TEXT,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2) NOT NULL,
  image_url     TEXT,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scanbite_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id   UUID REFERENCES scanbite_outlets(id) ON DELETE CASCADE,
  table_id    UUID REFERENCES scanbite_tables(id),
  items       JSONB NOT NULL DEFAULT '[]'::JSONB,
  total       NUMERIC(12,2) DEFAULT 0,
  status      TEXT CHECK (status IN ('pending','preparing','served','paid')) DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scanbite_song_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id       UUID REFERENCES scanbite_outlets(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES scanbite_tables(id),
  song_title      TEXT NOT NULL,
  artist          TEXT,
  requester_name  TEXT,
  status          TEXT CHECK (status IN ('queued','playing','done')) DEFAULT 'queued',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. INSTAFOOD  –  Pre-Order Katering Rumahan
-- ============================================================

CREATE TABLE IF NOT EXISTS instafood_sellers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID REFERENCES registrations(id) ON DELETE CASCADE,
  brand_name       TEXT NOT NULL,
  owner_name       TEXT,
  address          TEXT,
  contact_phone    TEXT,
  subdomain        TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instafood_menus (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID REFERENCES instafood_sellers(id) ON DELETE CASCADE,
  category      TEXT,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2) NOT NULL,
  min_order     INTEGER DEFAULT 1,
  lead_days     INTEGER DEFAULT 1,
  image_url     TEXT,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instafood_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        UUID REFERENCES instafood_sellers(id) ON DELETE CASCADE,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT,
  delivery_address TEXT,
  items            JSONB NOT NULL DEFAULT '[]'::JSONB,
  total            NUMERIC(12,2) DEFAULT 0,
  delivery_date    DATE,
  status           TEXT CHECK (status IN ('pending','confirmed','preparing','delivered','cancelled')) DEFAULT 'pending',
  payment_status   TEXT CHECK (payment_status IN ('unpaid','dp_paid','paid')) DEFAULT 'unpaid',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 6. RESTO  –  Hybrid POS Premium
-- ============================================================

CREATE TABLE IF NOT EXISTS resto_outlets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID REFERENCES registrations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  address          TEXT,
  contact_phone    TEXT,
  table_count      INTEGER DEFAULT 0,
  subdomain        TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resto_menus (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id     UUID REFERENCES resto_outlets(id) ON DELETE CASCADE,
  category      TEXT,
  name          TEXT NOT NULL,
  price         NUMERIC(12,2) NOT NULL,
  hpp           NUMERIC(12,2) DEFAULT 0,
  image_url     TEXT,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resto_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id       UUID REFERENCES resto_outlets(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('dine_in','takeaway','delivery','online')) DEFAULT 'dine_in',
  table_number    TEXT,
  customer_name   TEXT,
  items           JSONB NOT NULL DEFAULT '[]'::JSONB,
  subtotal        NUMERIC(12,2) DEFAULT 0,
  tax             NUMERIC(12,2) DEFAULT 0,
  discount        NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  status          TEXT CHECK (status IN ('pending','preparing','served','completed','cancelled')) DEFAULT 'pending',
  payment_method  TEXT CHECK (payment_method IN ('cash','qris','transfer','card')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resto_inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id     UUID REFERENCES resto_outlets(id) ON DELETE CASCADE,
  item_name     TEXT NOT NULL,
  unit          TEXT DEFAULT 'pcs',
  stock         NUMERIC(10,2) DEFAULT 0,
  min_stock     NUMERIC(10,2) DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resto_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id   UUID REFERENCES resto_outlets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT CHECK (role IN ('owner','manager','cashier','kitchen','waiter')) DEFAULT 'cashier',
  pin         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resto_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id       UUID REFERENCES resto_outlets(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES resto_orders(id),
  cashier_id      UUID REFERENCES resto_staff(id),
  amount_paid     NUMERIC(12,2) NOT NULL,
  change_amount   NUMERIC(12,2) DEFAULT 0,
  payment_method  TEXT,
  receipt_no      TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. SETTINGS  (shared – used by landing page for config/payments)
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id    TEXT PRIMARY KEY,  -- 'config' | 'payments'
  data  JSONB DEFAULT '{}'::JSONB
);

-- Seed default config if not exists
INSERT INTO settings (id, data) VALUES
  ('config',   '{"whatsapp":"6281918226387","address":"Mekarwangi, Kuningan - Jawa Barat","heroTitle":"Transformasi Digital Masa Depan","heroSubtitle":"Solusi LMS, IT Service & Web Dev profesional."}'),
  ('payments', '{"bankBca":"1234567890","bankBcaName":"PT Rasyatech Digital","bankMandiri":"0987654321","bankMandiriName":"PT Rasyatech Digital","eWallet":"081918226387","eWalletName":"Admin Rasyatech"}')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. ROW LEVEL SECURITY  (enable on all tables)
-- ============================================================

ALTER TABLE registrations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_schools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_teachers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_grades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_attendance       ENABLE ROW LEVEL SECURITY;
ALTER TABLE siput_schools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE siput_students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE siput_assessments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE siput_raport         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanbite_outlets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanbite_tables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanbite_menus       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanbite_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanbite_song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE instafood_sellers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE instafood_menus      ENABLE ROW LEVEL SECURITY;
ALTER TABLE instafood_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE resto_outlets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE resto_menus          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resto_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resto_inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resto_staff          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resto_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings             ENABLE ROW LEVEL SECURITY;

-- Public read on settings and registrations (used by landing page)
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "registrations_public_insert" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "registrations_anon_read" ON registrations FOR SELECT USING (true);

-- Service role has full access (used by backend API endpoints)
-- (Service role bypasses RLS by default in Supabase — no policy needed)

-- ============================================================
-- END OF SCHEMA
-- To apply: Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================
