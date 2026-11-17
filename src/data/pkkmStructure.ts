import { PkkmKomponenId } from '../types';

export interface PkkmSubItem {
  id: string; // '1', '2', '3'
  kode: string; // '1)', '2)', '3)'
  label: string;
}

export interface PkkmSubMenu {
  id: string; // 'a', 'b', 'c', ...
  kode: string; // 'a.', 'b.', ...
  tabLabel: string; // concise label for single-line tab navigation
  fullTitle: string; // exact full criterion title
  subItems?: PkkmSubItem[];
}

export interface PkkmKomponen {
  id: PkkmKomponenId;
  tabId: string; // 'pkkm-manajerial', etc.
  nomor: number;
  sidebarLabel: string;
  title: string;
  subtitle: string;
  subMenus: PkkmSubMenu[];
}

export const PKKM_COMPONENTS: PkkmKomponen[] = [
  {
    id: 'manajerial',
    tabId: 'pkkm-manajerial',
    nomor: 1,
    sidebarLabel: '1. Komponen Manajerial',
    title: 'Komponen Manajerial',
    subtitle: 'Dokumen perencanaan, kurikulum satuan pendidikan, rapor pendidikan, RKAS/RKAM, dan buku induk madrasah.',
    subMenus: [
      {
        id: 'a',
        kode: 'a.',
        tabLabel: 'a. Dokumen KSP / KTSP',
        fullTitle: 'Kepala Sekolah menyusun dokumen Kurikulum Satuan Pendidikan (KSP/KTSP)',
      },
      {
        id: 'b',
        kode: 'b.',
        tabLabel: 'b. Rapor Pendidikan',
        fullTitle: 'Rapor Pendidikan Madrasah',
      },
      {
        id: 'c',
        kode: 'c.',
        tabLabel: 'c. Analisis Rapor Pendidikan',
        fullTitle: 'Kepala Sekolah Menyusun Analisis Rapor Pendidikan',
      },
      {
        id: 'd',
        kode: 'd.',
        tabLabel: 'd. RKT',
        fullTitle: 'Kepala Sekolah Menyusun RKT (Rencana Kerja Tahunan)',
      },
      {
        id: 'e',
        kode: 'e.',
        tabLabel: 'e. RKAS / RKAM',
        fullTitle: 'Kepala Sekolah Menyusun RKAS / RKAM',
      },
      {
        id: 'f',
        kode: 'f.',
        tabLabel: 'f. Perencanaan Program',
        fullTitle: 'Kepala Sekolah Menyusun Perencanaan Program Satuan Pendidikan',
      },
      {
        id: 'g',
        kode: 'g.',
        tabLabel: 'g. Buku Induk Madrasah',
        fullTitle: 'Buku Induk Madrasah',
      },
    ],
  },
  {
    id: 'kewirausahaan',
    tabId: 'pkkm-kewirausahaan',
    nomor: 2,
    sidebarLabel: '2. Komponen Kewirausahaan',
    title: 'Komponen Kewirausahaan',
    subtitle: 'Pengelolaan SIM madrasah serta perencanaan, pelaksanaan, dan evaluasi program pengembangan kewirausahaan.',
    subMenus: [
      {
        id: 'a',
        kode: 'a.',
        tabLabel: 'a. Pengelolaan SIM',
        fullTitle: 'Kepala Sekolah Mengelola Sistem Informasi Manajemen (SIM)',
      },
      {
        id: 'b',
        kode: 'b.',
        tabLabel: 'b. Program Kewirausahaan',
        fullTitle: 'Kepala Sekolah Menyusun Program Kewirausahaan',
      },
      {
        id: 'c',
        kode: 'c.',
        tabLabel: 'c. Pengembangan Kewirausahaan',
        fullTitle: 'Kepala Sekolah Melaksanakan Pengembangan Kewirausahaan',
      },
      {
        id: 'd',
        kode: 'd.',
        tabLabel: 'd. Evaluasi Kewirausahaan',
        fullTitle: 'Kepala Sekolah Melaksanakan Evaluasi Program Pengembangan Kewirausahaan',
      },
    ],
  },
  {
    id: 'supervisi',
    tabId: 'pkkm-supervisi',
    nomor: 3,
    sidebarLabel: '3. Supervisi Akademik & Tendik',
    title: 'Komponen Supervisi Akademik & Tendik',
    subtitle: 'Penyusunan program, pelaksanaan, evaluasi, dan tindak lanjut supervisi guru serta tenaga kependidikan.',
    subMenus: [
      {
        id: 'a',
        kode: 'a.',
        tabLabel: 'a. Program Supervisi',
        fullTitle: 'Kepala Sekolah Menyusun Program Supervisi Guru dan Tenaga Kependidikan',
      },
      {
        id: 'b',
        kode: 'b.',
        tabLabel: 'b. Pelaksanaan Supervisi',
        fullTitle: 'Kepala Sekolah Melaksanakan Supervisi Guru dan Tenaga Kependidikan',
      },
      {
        id: 'c',
        kode: 'c.',
        tabLabel: 'c. Evaluasi Supervisi',
        fullTitle: 'Kepala Sekolah Melaksanakan Evaluasi Program Supervisi Guru dan Tendik',
      },
      {
        id: 'd',
        kode: 'd.',
        tabLabel: 'd. Tindak Lanjut Supervisi',
        fullTitle: 'Kepala Sekolah Melaksanakan Tindak Lanjut Supervisi Guru dan Tendik',
      },
    ],
  },
  {
    id: 'kepemimpinan',
    tabId: 'pkkm-kepemimpinan',
    nomor: 4,
    sidebarLabel: '4. Kepemimpinan Pembelajaran',
    title: 'Komponen Kepemimpinan Pembelajaran / Pendampingan Tupoksi Guru',
    subtitle: 'Pendampingan perencanaan, pelaksanaan, evaluasi pembelajaran, pembimbingan siswa, dan tugas tambahan guru/tendik.',
    subMenus: [
      {
        id: 'a',
        kode: 'a.',
        tabLabel: 'a. Merencanakan Pembelajaran',
        fullTitle: 'Merencanakan Pembelajaran',
        subItems: [
          {
            id: '1',
            kode: '1)',
            label: 'Analisa CP-TP-ATP & Program Kokurikuler (P5/PPRA)',
          },
          {
            id: '2',
            kode: '2)',
            label: 'Modul Ajar / RPP',
          },
        ],
      },
      {
        id: 'b',
        kode: 'b.',
        tabLabel: 'b. Melaksanakan Pembelajaran',
        fullTitle: 'Melaksanakan Pembelajaran',
        subItems: [
          {
            id: '1',
            kode: '1)',
            label: 'SK KBM (Pembagian Tugas Mengajar)',
          },
          {
            id: '2',
            kode: '2)',
            label: 'Daftar Kelas / Jurnal Pembelajaran / Presensi',
          },
        ],
      },
      {
        id: 'c',
        kode: 'c.',
        tabLabel: 'c. Mengevaluasi Hasil Pembelajaran',
        fullTitle: 'Mengevaluasi Hasil Pembelajaran',
        subItems: [
          {
            id: '1',
            kode: '1)',
            label: 'Daftar Nilai Guru',
          },
          {
            id: '2',
            kode: '2)',
            label: 'Analisis Nilai / Hasil Belajar',
          },
          {
            id: '3',
            kode: '3)',
            label: 'Remedial dan Pengayaan',
          },
        ],
      },
      {
        id: 'd',
        kode: 'd.',
        tabLabel: 'd. Membimbing Siswa',
        fullTitle: 'Membimbing Siswa',
        subItems: [
          {
            id: '1',
            kode: '1)',
            label: 'Buku Bimbingan Konseling / Catatan Pelanggaran & Prestasi',
          },
          {
            id: '2',
            kode: '2)',
            label: 'Dokumentasi Kegiatan Pembimbingan (Foto, Laporan, Notulen)',
          },
        ],
      },
      {
        id: 'e',
        kode: 'e.',
        tabLabel: 'e. Tugas Tambahan Guru & Tendik',
        fullTitle: 'Melaksanakan Tugas Tambahan Guru & Tendik',
        subItems: [
          {
            id: '1',
            kode: '1)',
            label: 'Surat Tugas / SK Tugas Tambahan',
          },
          {
            id: '2',
            kode: '2)',
            label: 'Laporan Kegiatan Tugas Tambahan',
          },
        ],
      },
    ],
  },
];

export function getPkkmKomponenByTab(tabId: string): PkkmKomponen | undefined {
  return PKKM_COMPONENTS.find((k) => k.tabId === tabId);
}

export function getPkkmKomponenById(komponenId: PkkmKomponenId): PkkmKomponen {
  return PKKM_COMPONENTS.find((k) => k.id === komponenId) || PKKM_COMPONENTS[0];
}
