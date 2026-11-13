import { useState, useMemo } from 'react';
import { SuratKeluar, MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  Trash2,
  HardDrive,
  Send,
  FileText,
  Paperclip,
  Lock,
} from 'lucide-react';

interface SuratKeluarListProps {
  suratList: SuratKeluar[];
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onAddNew: () => void;
  onEdit: (surat: SuratKeluar) => void;
  onDelete: (id: string) => void;
  onViewDetail: (surat: SuratKeluar) => void;
  onPrintAgendaBook: () => void;
  onEditBerkas?: (surat: SuratKeluar) => void;
  onOpenLoginModal?: () => void;
}

export default function SuratKeluarList({
  suratList,
  settings,
  currentUser,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetail,
  onPrintAgendaBook,
  onEditBerkas,
  onOpenLoginModal,
}: SuratKeluarListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState<string>('ALL');

  const canManage = currentUser.role === 'admin';

  // Available years from dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(suratList.map((s) => s.tahunSurat)));
    if (!years.includes(2026)) years.push(2026);
    return years.sort((a, b) => b - a);
  }, [suratList]);

  // Available classification codes from data
  const availableKlasifikasi = useMemo(() => {
    return Array.from(new Set(suratList.map((s) => s.kodeKlasifikasi)));
  }, [suratList]);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return suratList.filter((s) => {
      const matchSearch =
        s.nomorSuratLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tujuanSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.namaPenerima && s.namaPenerima.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(s.nomorUrut).includes(searchTerm);

      const matchYear = selectedYear === 'ALL' || s.tahunSurat.toString() === selectedYear;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      const matchKlasifikasi = selectedKlasifikasi === 'ALL' || s.kodeKlasifikasi === selectedKlasifikasi;

      return matchSearch && matchYear && matchStatus && matchKlasifikasi;
    });
  }, [suratList, searchTerm, selectedYear, selectedStatus, selectedKlasifikasi]);

  const handleExportCSV = () => {
    const headers = [
      'No. Urut',
      'Nomor Surat Lengkap',
      'Tanggal Surat',
      'Tujuan Surat',
      'Nama Penerima',
      'Jabatan Penerima',
      'Alamat Penerima',
      'Perihal',
      'Kode Klasifikasi',
      'Kategori',
      'Sifat',
      'Status',
      'Catatan Ekspedisi',
      'File Google Drive ID',
    ];

    const rows = filteredList.map((s) => [
      String(s.nomorUrut).padStart(3, '0'),
      s.nomorSuratLengkap,
      s.tanggalSurat,
      s.tujuanSurat,
      s.namaPenerima || '-',
      s.jabatanPenerima || '-',
      s.alamatPenerima || '-',
      s.perihal,
      s.kodeKlasifikasi,
      s.kategori,
      s.sifat,
      s.status,
      s.catatan || '-',
      s.fileDoc ? s.fileDoc.fileId : '-',
    ]);

    exportToCSV(`Buku_Agenda_Surat_Keluar_${settings.namaMadrasah.replace(/\s+/g, '_')}_${selectedYear}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pengelolaan Surat Keluar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penomoran otomatis resmi format: 0xx/Mis.11.23.14.14/Klasifikasi/Bulan/Tahun.
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Terbitkan Surat Keluar
            </button>
          )}
        </div>
      </div>

      {/* Mode Hanya Lihat Info Banner */}
      {!canManage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Mode Hanya Lihat:</strong> Masuk sebagai Administrator untuk menerbitkan, mengedit data surat keluar, atau mengganti berkas lampiran.
            </span>
          </div>
          {onOpenLoginModal && (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg border border-amber-400 shadow-2xs shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Masuk Admin untuk Edit
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor surat, tujuan, nama penerima, atau perihal..."
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
                Tahun Surat {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Klasifikasi Filter */}
        <div>
          <select
            value={selectedKlasifikasi}
            onChange={(e) => setSelectedKlasifikasi(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Klasifikasi</option>
            {availableKlasifikasi.map((klas) => (
              <option key={klas} value={klas}>
                {klas}
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
            <option value="Konsep">Konsep (Draft)</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Telah Dikirim">Telah Dikirim</option>
            <option value="Diarsipkan">Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs border-t-2 border-t-amber-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#023126] border-b border-amber-500/30 text-amber-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-16 text-center text-amber-300">No. Urut</th>
                <th className="py-3 px-4 text-amber-200">Nomor Surat Lengkap</th>
                <th className="py-3 px-4 w-32 text-amber-200">Tgl. Surat</th>
                <th className="py-3 px-4 text-amber-200">Tujuan / Penerima</th>
                <th className="py-3 px-4 text-amber-200">Perihal</th>
                <th className="py-3 px-4 w-28 text-amber-200">Status</th>
                <th className="py-3 px-4 w-20 text-center text-amber-200">Dokumen</th>
                <th className="py-3 px-4 w-48 text-right text-amber-200">Aksi</th>
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
                    {/* No Urut */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-900 tabular-nums">
                      {String(surat.nomorUrut).padStart(3, '0')}
                    </td>

                    {/* Nomor Surat Lengkap */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="text-emerald-900">{surat.nomorSuratLengkap}</span>
                      <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                        Klasifikasi: {surat.kodeKlasifikasi} ({surat.kategori})
                      </span>
                    </td>

                    {/* Tanggal Surat */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{formatDateIndo(surat.tanggalSurat)}</p>
                      <span className="text-[11px] text-slate-400">{surat.sifat}</span>
                    </td>

                    {/* Tujuan / Penerima */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 line-clamp-1">{surat.tujuanSurat}</p>
                      {surat.namaPenerima && (
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">
                          U.p. {surat.namaPenerima} {surat.jabatanPenerima ? `(${surat.jabatanPenerima})` : ''}
                        </p>
                      )}
                    </td>

                    {/* Perihal */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 line-clamp-2">{surat.perihal}</p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {surat.status}
                      </span>
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
                          title="Lihat Detail & Cetak"
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
                                if (confirm(`Hapus surat nomor ${surat.nomorSuratLengkap}? Nomor urut #${surat.nomorUrut} tidak akan dipakai kembali.`)) {
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
                    <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data surat keluar</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'Tidak ada surat keluar yang sesuai dengan pencarian.'
                        : 'Belum ada surat keluar yang diterbitkan pada filter ini.'}
                    </p>
                    {canManage && !searchTerm && (
                      <button
                        onClick={onAddNew}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Terbitkan Surat Pertama
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
            Menampilkan <strong className="text-slate-800">{filteredList.length}</strong> dari total {suratList.length} surat keluar
          </span>
          <span className="font-mono text-[11px]">
            Tahun Administrasi: {selectedYear === 'ALL' ? 'Semua' : selectedYear}
          </span>
        </div>
      </div>
    </div>
  );
}
