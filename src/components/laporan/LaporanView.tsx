import { useState, useMemo, useEffect } from 'react';
import { SuratMasuk, SuratKeluar, SuratKeputusan, MadrasahSettings } from '../../types';
import { formatDateIndo, formatDateTimeIndo, exportToCSV, exportToExcel } from '../../utils/formatters';
import MadrasahKop from '../common/MadrasahKop';
import ExportMenuButton from '../common/ExportMenuButton';
import {
  Printer,
  BookOpen,
  Send,
  Award,
  BarChart3,
  Filter,
  RectangleVertical,
  RectangleHorizontal,
} from 'lucide-react';

interface LaporanViewProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  skList: SuratKeputusan[];
  settings: MadrasahSettings;
}

type LaporanType = 'agenda_masuk' | 'agenda_keluar' | 'daftar_sk' | 'rekap_tahunan';
type PrintOrientation = 'portrait' | 'landscape';

export default function LaporanView({
  suratMasukList,
  suratKeluarList,
  skList,
  settings,
}: LaporanViewProps) {
  const [selectedType, setSelectedType] = useState<LaporanType>('agenda_masuk');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait');

  // Dynamically apply @page print orientation for Laporan / Buku Agenda
  useEffect(() => {
    const styleId = 'laporan-print-orientation';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: A4 ${orientation}; margin: ${
      orientation === 'landscape' ? '1.2cm 1.5cm' : '1.5cm'
    }; } }`;

    return () => {
      styleEl?.remove();
    };
  }, [orientation]);

  // Filtered surat masuk for report
  const filteredMasuk = useMemo(() => {
    return suratMasukList.filter((s) => {
      const matchYear = selectedYear === 'ALL' || s.tahunAgenda.toString() === selectedYear;
      const matchStart = !startDate || s.tanggalDiterima >= startDate;
      const matchEnd = !endDate || s.tanggalDiterima <= endDate;
      return matchYear && matchStart && matchEnd;
    });
  }, [suratMasukList, selectedYear, startDate, endDate]);

  // Filtered surat keluar for report
  const filteredKeluar = useMemo(() => {
    return suratKeluarList.filter((s) => {
      const matchYear = selectedYear === 'ALL' || s.tahunSurat.toString() === selectedYear;
      const matchStart = !startDate || s.tanggalSurat >= startDate;
      const matchEnd = !endDate || s.tanggalSurat <= endDate;
      return matchYear && matchStart && matchEnd;
    });
  }, [suratKeluarList, selectedYear, startDate, endDate]);

  // Filtered SK
  const filteredSK = useMemo(() => {
    return skList.filter((sk) => {
      const matchYear = selectedYear === 'ALL' || sk.tahun.toString() === selectedYear;
      const matchStart = !startDate || sk.tanggalSK >= startDate;
      const matchEnd = !endDate || sk.tanggalSK <= endDate;
      return matchYear && matchStart && matchEnd;
    });
  }, [skList, selectedYear, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const getReportExportData = () => {
    const periodSummary = [
      `Tahun: ${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear}`,
      startDate ? `Dari: ${formatDateIndo(startDate)}` : '',
      endDate ? `Sampai: ${formatDateIndo(endDate)}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    if (selectedType === 'agenda_masuk') {
      const headers = [
        'No. Agenda',
        'Tahun',
        'Tanggal Diterima',
        'Tanggal Surat',
        'Nomor Surat Asal',
        'Pengirim',
        'Perihal',
        'Ringkasan',
        'Sifat',
        'Status',
        'Disposisi Kepada',
        'Instruksi Kepala',
        'Catatan Disposisi',
        'Tautan Google Drive',
      ];
      const rows = filteredMasuk.map((s) => [
        s.nomorAgenda,
        s.tahunAgenda,
        s.tanggalDiterima,
        s.tanggalSurat,
        s.nomorSuratPengirim,
        s.pengirim,
        s.perihal,
        s.ringkasan || '-',
        s.sifat,
        s.status,
        s.disposisi ? s.disposisi.tujuanDisposisi.join('; ') : '-',
        s.disposisi ? s.disposisi.instruksi.join('; ') : '-',
        s.disposisi ? s.disposisi.catatanKepala || '-' : '-',
        s.fileDoc ? s.fileDoc.driveUrl || s.fileDoc.fileId : '-',
      ]);
      return {
        filename: `Buku_Agenda_Surat_Masuk_${selectedYear}`,
        sheetName: 'Agenda Surat Masuk',
        title: `BUKU AGENDA SURAT MASUK - ${settings.namaMadrasah.toUpperCase()}`,
        headers,
        rows,
        periodSummary: `${periodSummary} · Total: ${rows.length} berkas`,
      };
    }

    if (selectedType === 'agenda_keluar') {
      const headers = [
        'No. Urut',
        'Nomor Surat Lengkap',
        'Tanggal Surat',
        'Tujuan Surat',
        'Nama Penerima',
        'Perihal',
        'Ringkasan',
        'Klasifikasi',
        'Sifat',
        'Status',
        'Dicatat Oleh',
        'Tautan Google Drive',
      ];
      const rows = filteredKeluar.map((s) => [
        String(s.nomorUrut).padStart(3, '0'),
        s.nomorSuratLengkap,
        s.tanggalSurat,
        s.tujuanSurat,
        s.namaPenerima || '-',
        s.perihal,
        s.ringkasan || '-',
        s.kodeKlasifikasi,
        s.sifat,
        s.status,
        s.createdBy || '-',
        s.fileDoc ? s.fileDoc.driveUrl || s.fileDoc.fileId : '-',
      ]);
      return {
        filename: `Buku_Agenda_Surat_Keluar_${selectedYear}`,
        sheetName: 'Agenda Surat Keluar',
        title: `BUKU AGENDA SURAT KELUAR - ${settings.namaMadrasah.toUpperCase()}`,
        headers,
        rows,
        periodSummary: `${periodSummary} · Total: ${rows.length} surat`,
      };
    }

    if (selectedType === 'daftar_sk') {
      const headers = [
        'No. Urut',
        'Nomor SK',
        'Tanggal SK',
        'Tahun Pelajaran',
        'Judul SK',
        'Pokok Penetapan',
        'Penandatangan',
        'Status',
        'Tautan Google Drive',
      ];
      const rows = filteredSK.map((sk) => [
        String(sk.nomorUrut).padStart(3, '0'),
        sk.nomorSK,
        sk.tanggalSK,
        sk.tahunPelajaran,
        sk.judul,
        sk.tentang,
        sk.penandatangan,
        sk.status,
        sk.fileDoc ? sk.fileDoc.driveUrl || sk.fileDoc.fileId : '-',
      ]);
      return {
        filename: `Daftar_SK_Madrasah_${selectedYear}`,
        sheetName: 'Daftar SK',
        title: `BUKU DAFTAR SURAT KEPUTUSAN (SK) - ${settings.namaMadrasah.toUpperCase()}`,
        headers,
        rows,
        periodSummary: `${periodSummary} · Total: ${rows.length} SK`,
      };
    }

    // rekap_tahunan
    const headers = ['Kategori Administrasi', 'Sesuai Filter Periode', 'Total Keseluruhan', 'Keterangan'];
    const rows: (string | number)[][] = [
      [
        'Surat Masuk',
        filteredMasuk.length,
        suratMasukList.length,
        'Berkas surat dinas diterima',
      ],
      [
        'Surat Masuk Terdisposisi',
        filteredMasuk.filter((s) => Boolean(s.disposisi)).length,
        suratMasukList.filter((s) => Boolean(s.disposisi)).length,
        'Sudah mendapat lembar disposisi pimpinan',
      ],
      [
        'Surat Keluar',
        filteredKeluar.length,
        suratKeluarList.length,
        'Surat resmi diterbitkan madrasah',
      ],
      [
        'Surat Keputusan (SK)',
        filteredSK.length,
        skList.length,
        'SK penetapan Kepala Madrasah',
      ],
    ];
    return {
      filename: `Rekapitulasi_Administrasi_${selectedYear}`,
      sheetName: 'Rekapitulasi',
      title: `REKAPITULASI ADMINISTRASI PERSURATAN - ${settings.namaMadrasah.toUpperCase()}`,
      headers,
      rows,
      periodSummary,
    };
  };

  const currentRecordCount =
    selectedType === 'agenda_masuk'
      ? filteredMasuk.length
      : selectedType === 'agenda_keluar'
      ? filteredKeluar.length
      : selectedType === 'daftar_sk'
      ? filteredSK.length
      : 4;

  const handleExportCSV = () => {
    const { filename, headers, rows } = getReportExportData();
    exportToCSV(filename, headers, rows);
  };

  const handleExportExcel = () => {
    const { filename, sheetName, title, headers, rows, periodSummary } = getReportExportData();
    exportToExcel({
      filename,
      sheetName,
      title,
      subtitle: `${settings.alamat} · NSM: ${settings.nsm} · NPSN: ${settings.npsn}`,
      metaLines: [
        `Periode Laporan: ${periodSummary}`,
        `Diekspor pada: ${formatDateTimeIndo(new Date().toISOString())}`,
      ],
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Laporan & Buku Agenda Administrasi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cetak buku register resmi dan ekspor data administrasi persuratan madrasah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Orientation Selector */}
            <div
              className="inline-flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm"
              role="group"
              aria-label="Orientasi Cetak"
            >
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                title="Cetak Tegak (Portrait)"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-[#023126] text-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <RectangleVertical className="w-3.5 h-3.5" />
                <span>Portrait</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                title="Cetak Mendatar (Landscape)"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-[#023126] text-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <RectangleHorizontal className="w-3.5 h-3.5" />
                <span>Landscape</span>
              </button>
            </div>

            <ExportMenuButton
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              recordCount={currentRecordCount}
            />
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Lembar Laporan
            </button>
          </div>
        </div>

        {/* Report Switcher Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setSelectedType('agenda_masuk')}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              selectedType === 'agenda_masuk'
                ? 'bg-gradient-to-r from-[#023126] to-[#034436] border-amber-400 text-amber-200 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${selectedType === 'agenda_masuk' ? 'text-amber-300' : 'text-emerald-700'}`} />
            <div>
              <p className="text-xs">Buku Agenda Surat Masuk</p>
              <span className={`text-[10px] font-normal ${selectedType === 'agenda_masuk' ? 'text-amber-300/80' : 'text-slate-400'}`}>
                {filteredMasuk.length} Berkas
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('agenda_keluar')}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              selectedType === 'agenda_keluar'
                ? 'bg-gradient-to-r from-[#023126] to-[#034436] border-amber-400 text-amber-200 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Send className={`w-4 h-4 shrink-0 ${selectedType === 'agenda_keluar' ? 'text-amber-300' : 'text-emerald-700'}`} />
            <div>
              <p className="text-xs">Buku Agenda Surat Keluar</p>
              <span className={`text-[10px] font-normal ${selectedType === 'agenda_keluar' ? 'text-amber-300/80' : 'text-slate-400'}`}>
                {filteredKeluar.length} Surat
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('daftar_sk')}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              selectedType === 'daftar_sk'
                ? 'bg-gradient-to-r from-[#023126] to-[#034436] border-amber-400 text-amber-200 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Award className={`w-4 h-4 shrink-0 ${selectedType === 'daftar_sk' ? 'text-amber-300' : 'text-emerald-700'}`} />
            <div>
              <p className="text-xs">Daftar Surat Keputusan</p>
              <span className={`text-[10px] font-normal ${selectedType === 'daftar_sk' ? 'text-amber-300/80' : 'text-slate-400'}`}>{filteredSK.length} SK</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedType('rekap_tahunan')}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              selectedType === 'rekap_tahunan'
                ? 'bg-gradient-to-r from-[#023126] to-[#034436] border-amber-400 text-amber-200 font-semibold shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className={`w-4 h-4 shrink-0 ${selectedType === 'rekap_tahunan' ? 'text-amber-300' : 'text-emerald-700'}`} />
            <div>
              <p className="text-xs">Rekapitulasi Administrasi</p>
              <span className={`text-[10px] font-normal ${selectedType === 'rekap_tahunan' ? 'text-amber-300/80' : 'text-slate-400'}`}>Statistik Tahunan</span>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Filter Periode:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded bg-white"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">Dari Tanggal:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">Sampai Tanggal:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded"
            />
          </div>

          {(startDate || endDate || selectedYear !== '2026') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedYear('2026');
              }}
              className="text-emerald-700 hover:underline text-xs"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div
        className={`p-8 md:p-12 bg-white border border-slate-200 rounded-xl shadow-xs text-xs text-slate-900 min-h-[750px] mx-auto transition-all duration-200 print:w-full print:max-w-none print:border-0 print:shadow-none print:rounded-none print:p-0 ${
          orientation === 'portrait' ? 'max-w-[820px]' : 'w-full'
        }`}
      >
        <div className="no-print mb-3 flex items-center justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {orientation === 'portrait' ? (
              <RectangleVertical className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <RectangleHorizontal className="w-3.5 h-3.5 text-emerald-700" />
            )}
            Pratinjau Kertas: A4 {orientation === 'portrait' ? 'Portrait (Tegak)' : 'Landscape (Mendatar)'}
          </span>
        </div>
        {/* Official Kop Madrasah */}
        <MadrasahKop
          settings={settings}
          subTitle={
            selectedType === 'agenda_masuk'
              ? `BUKU AGENDA SURAT MASUK TAHUN ${selectedYear === 'ALL' ? '2026' : selectedYear}`
              : selectedType === 'agenda_keluar'
              ? `BUKU AGENDA SURAT KELUAR TAHUN ${selectedYear === 'ALL' ? '2026' : selectedYear}`
              : selectedType === 'daftar_sk'
              ? `BUKU DAFTAR SURAT KEPUTUSAN (SK) MADRASAH`
              : `REKAPITULASI LAPORAN PERSURATAN TAHUN ${selectedYear}`
          }
        />

        {/* 1. Buku Agenda Surat Masuk */}
        {selectedType === 'agenda_masuk' && (
          <div className="space-y-4">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead className="bg-slate-100 border border-slate-900 text-center font-bold text-[11px]">
                <tr>
                  <th className="p-2 border border-slate-900 w-14">No. Agenda</th>
                  <th className="p-2 border border-slate-900 w-24">Tgl. Diterima</th>
                  <th className="p-2 border border-slate-900 w-44">Nomor & Tgl. Surat</th>
                  <th className="p-2 border border-slate-900">Asal Pengirim</th>
                  <th className="p-2 border border-slate-900">Perihal / Isi Ringkas</th>
                  <th className="p-2 border border-slate-900 w-36">Diteruskan Kepada</th>
                  <th className="p-2 border border-slate-900 w-24">Ket. Sifat</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasuk.length > 0 ? (
                  filteredMasuk.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 border border-slate-900 text-center font-mono font-bold">
                        {s.nomorAgenda}
                      </td>
                      <td className="p-2 border border-slate-900 text-center">
                        {formatDateIndo(s.tanggalDiterima)}
                      </td>
                      <td className="p-2 border border-slate-900">
                        <span className="font-mono block">{s.nomorSuratPengirim}</span>
                        <span className="text-[10px] text-slate-600 block">{formatDateIndo(s.tanggalSurat)}</span>
                      </td>
                      <td className="p-2 border border-slate-900 font-medium">{s.pengirim}</td>
                      <td className="p-2 border border-slate-900">
                        <p className="font-semibold">{s.perihal}</p>
                        {s.ringkasan && <p className="text-[10px] text-slate-600 mt-0.5">{s.ringkasan}</p>}
                      </td>
                      <td className="p-2 border border-slate-900 text-[11px]">
                        {s.disposisi ? s.disposisi.tujuanDisposisi.join(', ') : '-'}
                      </td>
                      <td className="p-2 border border-slate-900 text-center text-[11px]">{s.sifat}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      Tidak ada data surat masuk pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Buku Agenda Surat Keluar */}
        {selectedType === 'agenda_keluar' && (
          <div className="space-y-4">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead className="bg-slate-100 border border-slate-900 text-center font-bold text-[11px]">
                <tr>
                  <th className="p-2 border border-slate-900 w-12">No. Urut</th>
                  <th className="p-2 border border-slate-900 w-52">Nomor Surat Lengkap</th>
                  <th className="p-2 border border-slate-900 w-24">Tanggal</th>
                  <th className="p-2 border border-slate-900">Alamat / Instansi Tujuan</th>
                  <th className="p-2 border border-slate-900">Perihal</th>
                  <th className="p-2 border border-slate-900 w-20 text-center">Kode</th>
                  <th className="p-2 border border-slate-900 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeluar.length > 0 ? (
                  filteredKeluar.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 border border-slate-900 text-center font-mono font-bold">
                        {String(s.nomorUrut).padStart(3, '0')}
                      </td>
                      <td className="p-2 border border-slate-900 font-mono font-semibold text-emerald-950">
                        {s.nomorSuratLengkap}
                      </td>
                      <td className="p-2 border border-slate-900 text-center">
                        {formatDateIndo(s.tanggalSurat)}
                      </td>
                      <td className="p-2 border border-slate-900">
                        <span className="font-semibold block">{s.tujuanSurat}</span>
                        {s.namaPenerima && (
                          <span className="text-[10px] text-slate-600 block">U.p. {s.namaPenerima}</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-900">
                        <p className="font-medium">{s.perihal}</p>
                      </td>
                      <td className="p-2 border border-slate-900 text-center font-mono">{s.kodeKlasifikasi}</td>
                      <td className="p-2 border border-slate-900 text-center">{s.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      Tidak ada data surat keluar pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Daftar SK */}
        {selectedType === 'daftar_sk' && (
          <div className="space-y-4">
            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead className="bg-slate-100 border border-slate-900 text-center font-bold text-[11px]">
                <tr>
                  <th className="p-2 border border-slate-900 w-12">No.</th>
                  <th className="p-2 border border-slate-900 w-48">Nomor SK & Tanggal</th>
                  <th className="p-2 border border-slate-900">Judul Keputusan & Pokok Penetapan</th>
                  <th className="p-2 border border-slate-900 w-28 text-center">Tahun Pelajaran</th>
                  <th className="p-2 border border-slate-900 w-36">Penandatangan</th>
                  <th className="p-2 border border-slate-900 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSK.length > 0 ? (
                  filteredSK.map((sk) => (
                    <tr key={sk.id}>
                      <td className="p-2 border border-slate-900 text-center font-mono font-bold">
                        {String(sk.nomorUrut).padStart(3, '0')}
                      </td>
                      <td className="p-2 border border-slate-900">
                        <span className="font-mono font-semibold block">{sk.nomorSK}</span>
                        <span className="text-[10px] text-slate-600 block">{formatDateIndo(sk.tanggalSK)}</span>
                      </td>
                      <td className="p-2 border border-slate-900">
                        <p className="font-semibold">{sk.judul}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{sk.tentang}</p>
                      </td>
                      <td className="p-2 border border-slate-900 text-center font-medium">TP {sk.tahunPelajaran}</td>
                      <td className="p-2 border border-slate-900">{sk.penandatangan}</td>
                      <td className="p-2 border border-slate-900 text-center">{sk.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                      Tidak ada Surat Keputusan pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Rekapitulasi Tahunan */}
        {selectedType === 'rekap_tahunan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-900">
              <div className="p-3 text-center border-r border-slate-300">
                <span className="text-slate-600 text-xs block">Total Surat Masuk</span>
                <span className="font-mono text-2xl font-bold text-emerald-900">{suratMasukList.length}</span>
              </div>
              <div className="p-3 text-center border-r border-slate-300">
                <span className="text-slate-600 text-xs block">Total Surat Keluar</span>
                <span className="font-mono text-2xl font-bold text-emerald-900">{suratKeluarList.length}</span>
              </div>
              <div className="p-3 text-center border-r border-slate-300">
                <span className="text-slate-600 text-xs block">Surat Keputusan (SK)</span>
                <span className="font-mono text-2xl font-bold text-emerald-900">{skList.length}</span>
              </div>
              <div className="p-3 text-center">
                <span className="text-slate-600 text-xs block">Disposisi Diberikan</span>
                <span className="font-mono text-2xl font-bold text-emerald-900">
                  {suratMasukList.filter((s) => Boolean(s.disposisi)).length}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed italic">
              Rekapitulasi ini menunjukkan seluruh volume surat dinas masuk dan keluar yang tercatat secara sah di buku agenda administrasi MI Ma'arif Al Ihsan Soborejo untuk memenuhi standar akreditasi dan tata kelola madrasah unggul.
            </p>
          </div>
        )}

        {/* Signature Block (Standard Indonesian Madrasah Format) */}
        <div className="flex justify-between items-start pt-8 mt-6 gap-6">
          <div className="text-left text-xs text-slate-800 space-y-0.5">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Madrasah,</p>
            <div className="h-16" />
            <p className="font-bold underline text-sm text-slate-900">{settings.kepalaMadrasah}</p>
            <p className="text-[11px] text-slate-700">NIP. {settings.nipKepalaMadrasah || '-'}</p>
          </div>

          <div className="text-center text-xs text-slate-800 space-y-0.5 min-w-[200px]">
            <p>Soborejo, {formatDateIndo(new Date().toISOString().split('T')[0])}</p>
            <p className="font-bold">Operator Madrasah,</p>
            <div className="h-16" />
            <p className="font-bold underline text-sm text-slate-900">{settings.operatorMadrasah || '-'}</p>
            <p className="text-[11px] text-slate-700">
              {settings.nipOperatorMadrasah && settings.nipOperatorMadrasah !== '-'
                ? `NIP/NUPTK. ${settings.nipOperatorMadrasah}`
                : 'NIP/NUPTK. -'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
