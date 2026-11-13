import { useState, useMemo } from 'react';
import { SuratMasuk, MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  Download,
  Printer,
  FileSignature,
  Eye,
  Edit,
  Trash2,
  HardDrive,
  FileText,
  Filter,
  Paperclip,
  RefreshCw,
} from 'lucide-react';

interface SuratMasukListProps {
  suratList: SuratMasuk[];
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onAddNew: () => void;
  onEdit: (surat: SuratMasuk) => void;
  onDelete: (id: string) => void;
  onViewDetail: (surat: SuratMasuk) => void;
  onOpenDisposisi: (surat: SuratMasuk) => void;
  onPrintDisposisi: (surat: SuratMasuk) => void;
  onPrintAgendaBook: () => void;
  onEditBerkas?: (surat: SuratMasuk) => void;
  onOpenLoginModal?: () => void;
}

export default function SuratMasukList({
  suratList,
  settings,
  currentUser,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
  onOpenDisposisi,
  onPrintDisposisi,
  onPrintAgendaBook,
  onEditBerkas,
  onOpenLoginModal,
}: SuratMasukListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSifat, setSelectedSifat] = useState<string>('ALL');

  const canManage = currentUser.role === 'admin';
  const canDisposisi = currentUser.role === 'admin';

  // Available years from dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(suratList.map((s) => s.tahunAgenda)));
    if (!years.includes(2026)) years.push(2026);
    return years.sort((a, b) => b - a);
  }, [suratList]);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return suratList.filter((s) => {
      const matchSearch =
        s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nomorSuratPengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nomorAgenda.includes(searchTerm);

      const matchYear = selectedYear === 'ALL' || s.tahunAgenda.toString() === selectedYear;
      const matchKategori = selectedKategori === 'ALL' || s.kategori === selectedKategori;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      const matchSifat = selectedSifat === 'ALL' || s.sifat === selectedSifat;

      return matchSearch && matchYear && matchKategori && matchStatus && matchSifat;
    });
  }, [suratList, searchTerm, selectedYear, selectedKategori, selectedStatus, selectedSifat]);

  const handleExportCSV = () => {
    const headers = [
      'No. Agenda',
      'Tahun',
      'Nomor Surat Pengirim',
      'Tanggal Surat',
      'Tanggal Diterima',
      'Pengirim',
      'Perihal',
      'Kategori',
      'Sifat',
      'Tujuan Internal',
      'Status',
      'Disposisi Kepada',
      'Instruksi Kepala',
      'File Google Drive ID',
    ];

    const rows = filteredList.map((s) => [
      s.nomorAgenda,
      s.tahunAgenda,
      s.nomorSuratPengirim,
      s.tanggalSurat,
      s.tanggalDiterima,
      s.pengirim,
      s.perihal,
      s.kategori,
      s.sifat,
      s.tujuanInternal,
      s.status,
      s.disposisi ? s.disposisi.tujuanDisposisi.join('; ') : '-',
      s.disposisi ? s.disposisi.catatanKepala : '-',
      s.fileDoc ? s.fileDoc.fileId : '-',
    ]);

    exportToCSV(`Buku_Agenda_Surat_Masuk_${settings.namaMadrasah.replace(/\s+/g, '_')}_${selectedYear}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {canManage ? 'Pengelolaan Surat Masuk' : 'Daftar Surat Masuk'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {canManage
              ? `Buku register agenda surat masuk ${settings.namaMadrasah} dengan penomoran otomatis & manual.`
              : `Buku agenda dan daftar surat masuk ${settings.namaMadrasah}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrintAgendaBook}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Agenda
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Ekspor CSV
          </button>
          {canManage && (
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-xs border border-amber-400/80 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-950" /> Tambah Surat Masuk
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor agenda, perihal, pengirim, atau nomor surat..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        {/* Year Filter */}
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr.toString()}>
                Tahun Agenda {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="Baru Diterima">Baru Diterima</option>
            <option value="Didisposisikan">Didisposisikan</option>
            <option value="Ditindaklanjuti">Ditindaklanjuti</option>
            <option value="Selesai">Selesai</option>
            <option value="Diarsipkan">Diarsipkan</option>
          </select>
        </div>

        {/* Sifat Filter */}
        <div>
          <select
            value={selectedSifat}
            onChange={(e) => setSelectedSifat(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Sifat</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Segera">Segera</option>
            <option value="Sangat Segera">Sangat Segera</option>
            <option value="Rahasia">Rahasia</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 border-t-2 border-t-amber-500 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#023126] border-b border-amber-500/30 text-amber-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-20 text-center">No. Agenda</th>
                <th className="py-3 px-4 w-32">Tgl. Diterima</th>
                <th className="py-3 px-4">Pengirim & No. Surat</th>
                <th className="py-3 px-4">Perihal & Kategori</th>
                <th className="py-3 px-4 w-28">Status & Sifat</th>
                <th className="py-3 px-4 w-24 text-center">Disposisi</th>
                <th className="py-3 px-4 w-20 text-center">Arsip</th>
                <th className="py-3 px-4 w-48 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((surat) => (
                  <tr
                    key={surat.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onViewDetail(surat)}
                  >
                    {/* No Agenda */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-900 tabular-nums">
                      #{surat.nomorAgenda}
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{formatDateIndo(surat.tanggalDiterima)}</p>
                      <p className="text-[11px] text-slate-500">Surat: {formatDateIndo(surat.tanggalSurat)}</p>
                    </td>

                    {/* Pengirim & No Surat */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 line-clamp-1">{surat.pengirim}</p>
                      <p className="font-mono text-[11px] text-slate-500 truncate max-w-xs">
                        {surat.nomorSuratPengirim}
                      </p>
                    </td>

                    {/* Perihal & Kategori */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 line-clamp-2">{surat.perihal}</p>
                      <span className="text-[11px] text-emerald-800/80">{surat.kategori}</span>
                    </td>

                    {/* Status & Sifat */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                        {surat.status}
                      </span>
                      <p className="text-[11px] text-slate-500">{surat.sifat}</p>
                    </td>

                    {/* Disposisi */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {surat.disposisi ? (
                        <button
                          onClick={() => onPrintDisposisi(surat)}
                          title="Lihat Lembar Disposisi"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <FileSignature className="w-3.5 h-3.5" /> Ada
                        </button>
                      ) : canDisposisi ? (
                        <button
                          onClick={() => onOpenDisposisi(surat)}
                          className="text-[11px] text-slate-500 hover:text-emerald-700 hover:underline"
                        >
                          + Disposisi
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* Google Drive Doc */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {surat.fileDoc ? (
                        <button
                          type="button"
                          onClick={() => (onEditBerkas ? onEditBerkas(surat) : onViewDetail(surat))}
                          title={`Dokumen: ${surat.fileDoc.fileName} - Klik untuk buka / edit berkas`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-amber-100 hover:text-amber-950 hover:border-amber-300 transition-colors cursor-pointer group/file"
                        >
                          <HardDrive className="w-3 h-3 text-emerald-700 group-hover/file:text-amber-800" />
                          <span>Ada</span>
                        </button>
                      ) : canManage && onEditBerkas ? (
                        <button
                          type="button"
                          onClick={() => onEditBerkas(surat)}
                          title="Lampirkan berkas dokumen digital"
                          className="text-[10px] font-medium text-slate-400 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          + Berkas
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewDetail(surat)}
                          title="Lihat Detail"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => onEdit(surat)}
                              title="Edit Data Surat & Lampiran"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-3 h-3 text-emerald-700" /> Edit
                            </button>
                            {onEditBerkas && (
                              <button
                                onClick={() => onEditBerkas(surat)}
                                title="Edit / Ganti Berkas Lampiran (Koreksi salah unggah)"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-colors cursor-pointer"
                              >
                                <Paperclip className="w-3 h-3" /> Berkas
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Hapus Surat Masuk Agenda #${surat.nomorAgenda}? Nomor agenda tidak akan dipakai ulang.`)) {
                                  onDelete(surat.id);
                                }
                              }}
                              title="Hapus"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data surat masuk</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'Tidak ada surat yang sesuai dengan kata kunci pencarian.'
                        : 'Belum ada surat masuk yang tercatat pada kriteria filter ini.'}
                    </p>
                    {canManage && !searchTerm && (
                      <button
                        onClick={onAddNew}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg border border-amber-400 shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-950" /> Tambah Surat Pertama
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredList.length}</strong> dari total {suratList.length} surat masuk
          </span>
          <span className="font-mono text-[11px]">
            Tahun Administrasi: {selectedYear === 'ALL' ? 'Semua' : selectedYear}
          </span>
        </div>
      </div>
    </div>
  );
}
