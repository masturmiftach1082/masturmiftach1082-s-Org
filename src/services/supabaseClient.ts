import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration provided by the user
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://emdjxbjhrlqsficqyors.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
  'sb_publishable_j01ZRuz0bWZhX0g_hpaeCQ_1mbIPdjY';

export const SUPABASE_JWKS_URL =
  (import.meta.env.VITE_SUPABASE_JWKS_URL as string) ||
  'https://emdjxbjhrlqsficqyors.supabase.co/auth/v1/.well-known/jwks.json';

let client: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (err) {
  console.warn('Supabase initialization failed:', err);
}

export const supabase = client;

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: false, message: 'Klien Supabase belum diinisialisasi.' };
  }
  try {
    // Attempt lightweight ping
    const { error } = await supabase.from('surat_masuk').select('id').limit(1);
    if (error) {
      // Table might not exist yet in fresh Supabase project
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! (Tabel database belum dibuat, silakan jalankan SQL Schema).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Terhubung aktif dengan database Supabase PostgreSQL!' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Gagal menghubungi server Supabase.' };
  }
}

/**
 * SQL Schema migration DDL for user to run in Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- SKEMA DATABASE SIPAS MI MA'ARIF AL IHSAN SOBOREJO
-- Jalankan di menu SQL Editor pada Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/emdjxbjhrlqsficqyors/sql

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

-- 5. Tabel Pengaturan Madrasah
CREATE TABLE IF NOT EXISTS pengaturan_madrasah (
  id TEXT PRIMARY KEY DEFAULT 'default_setting',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Log Aktivitas
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

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON pengaturan_madrasah;
CREATE POLICY "Allow public read-write for SIPAS" ON pengaturan_madrasah FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for SIPAS" ON activity_logs;
CREATE POLICY "Allow public read-write for SIPAS" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
`;
