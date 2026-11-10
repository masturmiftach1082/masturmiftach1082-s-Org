export type UserRole = 'admin' | 'operator' | 'kepala_madrasah' | 'guru';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  nip?: string;
  jabatan: string;
  avatar?: string;
  isActive: boolean;
}

export type SifatSurat = 'Biasa' | 'Penting' | 'Rahasia' | 'Segera' | 'Sangat Segera';

export type StatusSuratMasuk = 
  | 'Baru Diterima' 
  | 'Didisposisikan' 
  | 'Ditindaklanjuti' 
  | 'Selesai' 
  | 'Diarsipkan';

export type StatusSuratKeluar = 
  | 'Konsep' 
  | 'Disetujui' 
  | 'Telah Dikirim' 
  | 'Diarsipkan';

export type StatusSK = 'Berlaku' | 'Direvisi' | 'Dicabut' | 'Diarsipkan';

export interface GoogleDriveMetadata {
  fileId: string;
  folderId?: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // e.g. application/pdf, image/jpeg
  driveUrl: string;
  downloadUrl?: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  textContent?: string; // summary of content for quick preview
}

export interface Disposisi {
  id: string;
  suratMasukId: string;
  tanggalDisposisi: string;
  sifat: 'Biasa' | 'Penting' | 'Segera' | 'Sangat Segera' | 'Rahasia';
  batasWaktu?: string;
  tujuanDisposisi: string[]; // e.g. ["Waka Kurikulum", "Guru Kelas"]
  instruksi: string[]; // e.g. ["Untuk diketahui", "Tindak lanjuti", "Hadiri/Wakili", "Siapkan bahan"]
  catatanKepala: string;
  diberikanOleh: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai';
}

export interface SuratMasuk {
  id: string;
  nomorAgenda: string; // e.g. "001", "002"
  tahunAgenda: number; // e.g. 2026
  nomorSuratPengirim: string;
  tanggalSurat: string;
  tanggalDiterima: string;
  pengirim: string;
  perihal: string;
  ringkasan: string;
  kategori: string;
  sifat: SifatSurat;
  tujuanInternal: string;
  status: StatusSuratMasuk;
  catatan?: string;
  fileDoc?: GoogleDriveMetadata;
  disposisi?: Disposisi;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SuratKeluar {
  id: string;
  nomorUrut: number; // 1, 2, 3 ...
  nomorSuratLengkap: string; // e.g. "001/Mis.11.23.14.14/PP.00/01/2026"
  tahunSurat: number; // 2026
  bulanSurat: string; // "01", "02"
  kodeKlasifikasi: string; // "PP.00", "KS.01.1", etc.
  tanggalSurat: string;
  tujuanSurat: string; // Lembaga / Instansi tujuan
  namaPenerima?: string;
  jabatanPenerima?: string;
  alamatPenerima?: string;
  perihal: string;
  ringkasan: string;
  kategori: string;
  sifat: SifatSurat;
  status: StatusSuratKeluar;
  catatan?: string;
  fileDoc?: GoogleDriveMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SuratKeputusan {
  id: string;
  nomorSK: string; // e.g. "012/Mis.11.23.14.14/SK/07/2026"
  nomorUrut: number;
  tahun: number;
  judul: string;
  tentang: string;
  tanggalSK: string;
  tahunPelajaran: string; // e.g. "2026/2027"
  penandatangan: string; // e.g. "H. Mastur Miftach, M.Pd.I"
  jabatanPenandatangan: string;
  status: StatusSK;
  ringkasan: string;
  fileDoc?: GoogleDriveMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ArsipDigital {
  id: string;
  kodeArsip: string;
  judulArsip: string;
  kategori: string;
  tahun: number;
  nomorDokumenTerait?: string;
  deskripsi: string;
  tags: string[];
  fileDoc: GoogleDriveMetadata;
  lokasiFisik?: string; // Box / Lemari / Rak
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface KlasifikasiSurat {
  kode: string;
  nama: string;
  deskripsi: string;
}

export interface MadrasahSettings {
  namaMadrasah: string;
  namaAplikasi: string;
  nsm: string;
  npsn: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  kepalaMadrasah: string;
  nipKepalaMadrasah: string;
  operatorMadrasah: string;
  nipOperatorMadrasah: string;
  kodeMadrasah: string; // "Mis.11.23.14.14"
  formatPenomoranSK: string; // "XXX Tahun YYYY"
  logoUrl: string;
  kopSuratFormat: string;
  supabaseConfig: {
    url: string;
    anonKey: string;
    isConnected: boolean;
  };
  googleDriveConfig: {
    folderIdSuratMasuk: string;
    folderIdSuratKeluar: string;
    folderIdSK: string;
    folderIdArsip: string;
    serviceAccountEmail: string;
    isConnected: boolean;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'Surat Masuk' | 'Surat Keluar' | 'Surat Keputusan' | 'Arsip Digital' | 'Pengaturan' | 'Auth';
  entityId?: string;
  details: string;
  timestamp: string;
}
