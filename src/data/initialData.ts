import {
  MadrasahSettings,
  SuratMasuk,
  SuratKeluar,
  SuratKeputusan,
  ArsipDigital,
  UserProfile,
  KlasifikasiSurat,
  ActivityLog,
} from '../types';

export const initialMadrasahSettings: MadrasahSettings = {
  namaMadrasah: "MI Ma'arif Al Ihsan Soborejo",
  namaAplikasi: "SIPAS",
  nsm: "111233230053",
  npsn: "60713037",
  alamat: "Dusun Nglarangan 002/003, Desa Soborejo, Kec. Pringsurat",
  kecamatan: "Pringsurat",
  kabupaten: "Temanggung",
  provinsi: "Jawa Tengah",
  kodePos: "56272",
  telepon: "(0293) 710291 / 0813-2891-4452",
  email: "alihsansoborejo@gmail.com",
  website: "mimaarifsoborejo.sch.id",
  kepalaMadrasah: "MUIN, S.Pd.I.",
  nipKepalaMadrasah: "-",
  operatorMadrasah: "MUH MASTUR, S.Pd.I.",
  nipOperatorMadrasah: "-",
  kodeMadrasah: "Mis.11.23.14.14",
  formatPenomoranSK: "XXX Tahun YYYY",
  logoUrl: "https://i.ibb.co.com/prnMkxBh/Logo-MI-Al-Ihsan.png",
  kopSuratFormat: "LEMBAGA PENDIDIKAN MA'ARIF NU KABUPATEN TEMANGGUNG\nMI MA'ARIF AL IHSAN SOBOREJO\nTERAKREDITASI A",
  kopSurat: {
    baris1Instansi: "Lembaga Pendidikan Ma'arif NU Kabupaten Temanggung",
    baris2Judul: "MI Ma'arif Al Ihsan Soborejo",
    baris3Status: 'STATUS: TERAKREDITASI "A" (UNGGUL) · NSM: 111233230053 · NPSN: 60713037',
    baris4Alamat: "Alamat: Dusun Nglarangan 002/003, Desa Soborejo, Kec. Pringsurat, Kab. Temanggung 56272",
    baris5Kontak: "Telp: (0293) 710291 / 0813-2891-4452 · Email: alihsansoborejo@gmail.com · Website: mimaarifsoborejo.sch.id",
    baris6Tambahan: "",
    tampilkanLogo: true,
    posisiLogo: 'left',
    logoKananUrl: '',
    ukuranLogo: 'md',
    perataanTeks: 'center',
    warnaJudul: 'emerald',
    gayaGarisBawah: 'double',
    warnaGarisBawah: 'slate',
  },
  supabaseConfig: {
    url: "https://emdjxbjhrlqsficqyors.supabase.co",
    anonKey: "sb_publishable_j01ZRuz0bWZhX0g_hpaeCQ_1mbIPdjY",
    isConnected: true,
  },
  googleDriveConfig: {
    folderIdSuratMasuk: "1-GDRIVE-INCOMING-SOBOREJO-2026",
    folderIdSuratKeluar: "1-GDRIVE-OUTGOING-SOBOREJO-2026",
    folderIdSK: "1-GDRIVE-SK-SOBOREJO-2026",
    folderIdArsip: "1-GDRIVE-ARCHIVE-SOBOREJO-2026",
    serviceAccountEmail: "masturmiftach@gmail.com",
    isConnected: true,
    driveFolderUrl: "https://drive.google.com/drive/folders/1sipas_mimaarif_alihsan_soborejo_2026",
    urlSuratMasuk: "https://drive.google.com/drive/folders/1sipas_surat_masuk_soborejo",
    urlSuratKeluar: "https://drive.google.com/drive/folders/1sipas_surat_keluar_soborejo",
    urlSK: "https://drive.google.com/drive/folders/1sipas_sk_soborejo",
    urlArsip: "https://drive.google.com/drive/folders/1sipas_arsip_digital_soborejo",
    activeMode: "folder-link",
  },
  adminPassword: "Nglarangan123#",
  izinkanNomorManual: true,
};

export const initialKlasifikasiSurat: KlasifikasiSurat[] = [
  { kode: 'PP.00', nama: 'Kurikulum & Pembelajaran', deskripsi: 'Penyusunan jadwal, kalender pendidikan, pembelajaran, evaluasi, ujian madrasah' },
  { kode: 'PP.01', nama: 'Kesiswaan & Ekstrakurikuler', deskripsi: 'Penerimaan peserta didik baru, mutasi siswa, beasiswa, pramuka' },
  { kode: 'KS.01.1', nama: 'Kepegawaian & Ketenagaan', deskripsi: 'Pengangkatan guru, mutasi, pembagian tugas, kenaikan pangkat, cuti' },
  { kode: 'HM.00', nama: 'Hubungan Masyarakat', deskripsi: 'Kerjasama instansi, komite madrasah, kunjungan tamu, publikasi' },
  { kode: 'KU.00', nama: 'Keuangan & BOS', deskripsi: 'Pengelolaan dana BOS, SPJ keuangan, permohonan dana, audit' },
  { kode: 'PR.00', nama: 'Perencanaan Madrasah', deskripsi: 'Rencana kerja madrasah (RKM/RKAM), evaluasi diri madrasah (EDM)' },
  { kode: 'BA.00', nama: 'Bantuan & Sarpras', deskripsi: 'Bantuan operasional, hibah sarana prasarana, inventarisasi gedung' },
  { kode: 'OT.00', nama: 'Organisasi & Tata Laksana', deskripsi: 'Struktur organisasi, pedoman kerja, SOP madrasah' },
];

// Single Administrator Account for SIPAS
export const singleAdministrator: UserProfile = {
  id: 'admin-1',
  name: 'Administrator SIPAS',
  email: 'admin@mimaarifsoborejo.sch.id',
  role: 'admin',
  jabatan: 'Administrator Sistem SIPAS',
  isActive: true,
};

// Default Read-Only Viewer Profile for visitors
export const guestViewerProfile: UserProfile = {
  id: 'viewer-guest',
  name: 'Mode Tamu',
  email: 'tamu@mimaarifsoborejo.sch.id',
  role: 'viewer',
  jabatan: 'Mode Hanya Lihat (Read-Only)',
  isActive: true,
};

export const initialUsers: UserProfile[] = [singleAdministrator];

// Clean empty tables ready for production use with Supabase
export const initialSuratMasuk: SuratMasuk[] = [];
export const initialSuratKeluar: SuratKeluar[] = [];
export const initialSuratKeputusan: SuratKeputusan[] = [];
export const initialArsipDigital: ArsipDigital[] = [];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'log-init',
    userId: 'admin-1',
    userName: 'Administrator SIPAS',
    action: 'Koneksi Supabase',
    entityType: 'Pengaturan',
    details: 'Sistem SIPAS MI Ma\'arif Al Ihsan Soborejo terhubung ke Supabase (emdjxbjhrlqsficqyors.supabase.co). Data bersih siap digunakan.',
    timestamp: new Date().toISOString(),
  },
];
