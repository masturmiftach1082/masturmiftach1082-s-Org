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
  nsm: "111233080014",
  npsn: "60711928",
  alamat: "Jl. Lapangan Desa Soborejo, Kec. Pringsurat",
  kecamatan: "Pringsurat",
  kabupaten: "Temanggung",
  provinsi: "Jawa Tengah",
  kodePos: "56272",
  telepon: "(0293) 710291 / 0813-2891-4452",
  email: "mimaarif.alihsan.soborejo@gmail.com",
  website: "mimaarifsoborejo.sch.id",
  kepalaMadrasah: "H. Mastur Miftach, M.Pd.I",
  nipKepalaMadrasah: "19780512 200501 1 003",
  operatorMadrasah: "Siti Aminah, S.Pd.",
  nipOperatorMadrasah: "19850314 201101 2 018",
  kodeMadrasah: "Mis.11.23.14.14",
  formatPenomoranSK: "XXX Tahun YYYY",
  logoUrl: "/src/assets/images/madrasah_logo_1794281106438.jpg",
  kopSuratFormat: "LEMBAGA PENDIDIKAN MA'ARIF NU KABUPATEN TEMANGGUNG\nMI MA'ARIF AL IHSAN SOBOREJO\nTERAKREDITASI A",
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
    serviceAccountEmail: "sipas-drive-sync@mimaarif-soborejo.iam.gserviceaccount.com",
    isConnected: true,
  },
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

export const initialUsers: UserProfile[] = [
  {
    id: 'user-1',
    name: 'H. Mastur Miftach, M.Pd.I',
    email: 'masturmiftach@gmail.com',
    role: 'kepala_madrasah',
    nip: '19780512 200501 1 003',
    jabatan: 'Kepala Madrasah',
    isActive: true,
  },
  {
    id: 'user-2',
    name: 'Siti Aminah, S.Pd.',
    email: 'aminah.tu@mimaarifsoborejo.sch.id',
    role: 'operator',
    nip: '19850314 201101 2 018',
    jabatan: 'Operator Madrasah / Pengadministrasi Persuratan',
    isActive: true,
  },
  {
    id: 'user-3',
    name: 'Ahmad Fauzi, S.Kom.',
    email: 'admin@mimaarifsoborejo.sch.id',
    role: 'admin',
    jabatan: 'Administrator IT SIPAS',
    isActive: true,
  },
  {
    id: 'user-4',
    name: 'Nurul Hidayah, S.Pd.I',
    email: 'nurul.guru@mimaarifsoborejo.sch.id',
    role: 'guru',
    jabatan: 'Waka Kurikulum & Guru Kelas VI',
    isActive: true,
  },
];

// Clean empty tables ready for production use with Supabase
export const initialSuratMasuk: SuratMasuk[] = [];
export const initialSuratKeluar: SuratKeluar[] = [];
export const initialSuratKeputusan: SuratKeputusan[] = [];
export const initialArsipDigital: ArsipDigital[] = [];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'log-init',
    userId: 'user-2',
    userName: 'Siti Aminah, S.Pd.',
    action: 'Koneksi Supabase',
    entityType: 'Pengaturan',
    details: 'Sistem SIPAS MI Ma\'arif Al Ihsan Soborejo terhubung ke Supabase (emdjxbjhrlqsficqyors.supabase.co). Data bersih siap digunakan.',
    timestamp: new Date().toISOString(),
  },
];
