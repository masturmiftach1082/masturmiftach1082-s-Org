-- SKEMA DATABASE SIPAS MI MA'ARIF AL IHSAN SOBOREJO
-- Jalankan di menu SQL Editor pada Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/emdjxbjhrlqsficqyors/sql
-- Catatan: Skrip ini aman dijalankan ulang (idempotent) pada database yang sudah ada.

-- 1. Tabel Surat Masuk
CREATE TABLE IF NOT EXISTS surat_masuk (
  id TEXT PRIMARY KEY,
  nomor_agenda TEXT NOT NULL,
  tahun_agenda INTEGER NOT NULL,
  nomor_surat_pengirim TEXT NOT NULL,
  tanggal_surat DATE NOT NULL,
  tanggal_diterima DATE NOT NULL,
  pengirim TEXT NOT NULL,
  perihal TEXT NOT NULL,
  ringkasan TEXT,
  kategori TEXT NOT NULL,
  sifat TEXT NOT NULL,
  tujuan_internal TEXT,
  status TEXT NOT NULL,
  catatan TEXT,
  file_doc JSONB,
  disposisi JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Index pencarian dan keunikan nomor agenda per tahun
CREATE UNIQUE INDEX IF NOT EXISTS idx_surat_masuk_agenda_tahun ON surat_masuk(nomor_agenda, tahun_agenda);

-- 2. Tabel Surat Keluar
CREATE TABLE IF NOT EXISTS surat_keluar (
  id TEXT PRIMARY KEY,
  nomor_urut INTEGER NOT NULL,
  nomor_surat_lengkap TEXT NOT NULL UNIQUE,
  tahun_surat INTEGER NOT NULL,
  bulan_surat TEXT NOT NULL,
  kode_klasifikasi TEXT NOT NULL,
  tanggal_surat DATE NOT NULL,
  tujuan_surat TEXT NOT NULL,
  nama_penerima TEXT,
  jabatan_penerima TEXT,
  alamat_penerima TEXT,
  perihal TEXT NOT NULL,
  ringkasan TEXT,
  kategori TEXT NOT NULL,
  sifat TEXT NOT NULL,
  status TEXT NOT NULL,
  catatan TEXT,
  file_doc JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Index nomor urut surat keluar per tahun
CREATE UNIQUE INDEX IF NOT EXISTS idx_surat_keluar_urut_tahun ON surat_keluar(nomor_urut, tahun_surat);

-- 3. Tabel Surat Keputusan (SK)
CREATE TABLE IF NOT EXISTS surat_keputusan (
  id TEXT PRIMARY KEY,
  nomor_sk TEXT NOT NULL UNIQUE,
  nomor_urut INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  judul TEXT NOT NULL,
  tentang TEXT NOT NULL,
  tanggal_sk DATE NOT NULL,
  tahun_pelajaran TEXT,
  penandatangan TEXT NOT NULL,
  jabatan_penandatangan TEXT NOT NULL,
  status TEXT NOT NULL,
  ringkasan TEXT,
  file_doc JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 4. Tabel Arsip Digital
CREATE TABLE IF NOT EXISTS arsip_digital (
  id TEXT PRIMARY KEY,
  kode_arsip TEXT NOT NULL UNIQUE,
  judul_arsip TEXT NOT NULL,
  kategori TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  nomor_dokumen_terkait TEXT,
  deskripsi TEXT,
  tags TEXT[],
  file_doc JSONB NOT NULL,
  lokasi_fisik TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 5. Tabel Dokumen PKKM (Penilaian Kinerja Kepala Madrasah)
CREATE TABLE IF NOT EXISTS pkkm_dokumen (
  id TEXT PRIMARY KEY,
  komponen_id TEXT NOT NULL,
  sub_menu_id TEXT NOT NULL,
  sub_item_id TEXT,
  kode_dokumen TEXT NOT NULL,
  judul_dokumen TEXT NOT NULL,
  tahun_ajaran TEXT,
  tahun INTEGER NOT NULL,
  tanggal_dokumen DATE,
  penanggung_jawab TEXT,
  status_verifikasi TEXT NOT NULL DEFAULT 'Lengkap',
  keterangan TEXT,
  file_doc JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_pkkm_dokumen_komponen ON pkkm_dokumen(komponen_id, sub_menu_id);
CREATE INDEX IF NOT EXISTS idx_pkkm_dokumen_kode ON pkkm_dokumen(kode_dokumen);

-- 6. Tabel Pengaturan Madrasah (termasuk konfigurasi Kop Surat)
CREATE TABLE IF NOT EXISTS pengaturan_madrasah (
  id TEXT PRIMARY KEY DEFAULT 'default_setting',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Log Aktivitas
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) dengan kebijakan publik untuk REST API
ALTER TABLE surat_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_keputusan ENABLE ROW LEVEL SECURITY;
ALTER TABLE arsip_digital ENABLE ROW LEVEL SECURITY;
ALTER TABLE pkkm_dokumen ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan_madrasah ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON surat_masuk;
CREATE POLICY "Allow public read-write for SIPAS" ON surat_masuk FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON surat_keluar;
CREATE POLICY "Allow public read-write for SIPAS" ON surat_keluar FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON surat_keputusan;
CREATE POLICY "Allow public read-write for SIPAS" ON surat_keputusan FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON arsip_digital;
CREATE POLICY "Allow public read-write for SIPAS" ON arsip_digital FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON pkkm_dokumen;
CREATE POLICY "Allow public read-write for SIPAS" ON pkkm_dokumen FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON pengaturan_madrasah;
CREATE POLICY "Allow public read-write for SIPAS" ON pengaturan_madrasah FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON activity_logs;
CREATE POLICY "Allow public read-write for SIPAS" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 8. Aktifkan Supabase Realtime untuk sinkronisasi instan multi-perangkat (Websocket Push)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE surat_masuk;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE surat_keluar;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE surat_keputusan;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE arsip_digital;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pkkm_dokumen;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pengaturan_madrasah;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
