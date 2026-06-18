-- Kolom npsn & tabel_count pada registrations (Main + jalankan juga di DB Kuliner jika terpisah)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'npsn'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN npsn TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'tabel_count'
  ) THEN
    ALTER TABLE public.registrations ADD COLUMN tabel_count INTEGER;
  END IF;
END $$;

COMMENT ON COLUMN public.registrations.npsn IS 'NPSN / kode instansi (LMS, SIPUT); null untuk produk kuliner';
COMMENT ON COLUMN public.registrations.tabel_count IS 'Jumlah meja/outlet (Scanbite, Resto, Instafood); null untuk produk sekolah';
