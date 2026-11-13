import { useState, useMemo } from 'react';
import { SuratKeputusan, MadrasahSettings, UserProfile } from '../../types';
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
  Award,
  Paperclip,
  Lock,
} from 'lucide-react';

interface SuratKeputusanListProps {
  skList: SuratKeputusan[];
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onAddNew: () => void;
  onEdit: (sk: SuratKeputusan) => void;
  onDelete: (id: string) => void;
  onViewDocument: (sk: SuratKeputusan) => void;
  onEditBerkas?: (sk: SuratKeputusan) => void;
  onOpenLoginModal?: () => void;
}

export default function SuratKeputusanList({
  skList,
  settings,
  currentUser,
  onAddNew,
  onEdit,
  onDelete,
  onViewDocument,
  onEditBerkas,
  onOpenLoginModal,
}: SuratKeputusanListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const canManage = currentUser.role === 'admin';

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(skList.map((s) => s.tahun)));
    if (!years.includes(2026)) years.push(2026);
    return years.sort((a, b) => b - a);
  }, [skList]);

  const filteredList = useMemo(() => {
    return skList.filter((sk) => {
      const matchSearch =
        sk.nomorSK.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sk.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sk.tentang.toLowerCase().includes(searchTerm.toLowerCase());

      const matchYear = selectedYear === 'ALL' || sk.tahun.toString() === selectedYear;
      const matchStatus = selectedStatus === 'ALL' || sk.status === selectedStatus;

      return matchSearch && matchYear && matchStatus;
    });
  }, [skList, searchTerm, selectedYear, selectedStatus]);

  const handleExportCSV = () => {
    const headers = [
      'Nomor Urut',
      'Nomor SK',
      'Tahun',
      'Tanggal Penetapan',
      'Tahun Pelajaran',
      'Judul SK',
      'Tentang / Pokok Ketetapan',
      'Penandatangan',
      'Status',
      'File Google Drive ID',
    ];

    const rows = filteredList.map((sk) => [
      sk.nomorUrut,
      sk.nomorSK,
      sk.tahun,
      sk.tanggalSK,
      sk.tahunPelajaran,
      sk.judul,
      sk.tentang,
      sk.penandatangan,
      sk.status,
      sk.fileDoc ? sk.fileDoc.fileId : '-',
    ]);

    exportToCSV(`Daftar_Surat_Keputusan_${settings.namaMadrasah.replace(/\s+/g, '_')}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Surat Keputusan (SK) Madrasah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registrasi Surat Keputusan resmi Kepala Madrasah, panitia kegiatan, pembagian tugas, dan regulasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              <Plus className="w-4 h-4" /> Tetapkan SK Baru
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
              <strong>Mode Hanya Lihat:</strong> Masuk sebagai Administrator untuk menetapkan SK baru, mengedit data SK, atau mengganti berkas PDF SK.
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor SK, judul, atau pokok ketetapan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr.toString()}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="Berlaku">Berlaku (Aktif)</option>
            <option value="Direvisi">Direvisi</option>
            <option value="Dicabut">Dicabut</option>
            <option value="Diarsipkan">Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs border-t-2 border-t-amber-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#023126] border-b border-amber-500/30 text-amber-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-16 text-center text-amber-300">Urut</th>
                <th className="py-3 px-4 w-52 text-amber-200">Nomor SK & Tanggal</th>
                <th className="py-3 px-4 text-amber-200">Judul & Tentang</th>
                <th className="py-3 px-4 w-32 text-amber-200">Tahun Pelajaran</th>
                <th className="py-3 px-4 w-28 text-amber-200">Status</th>
                <th className="py-3 px-4 w-20 text-center text-amber-200">Berkas</th>
                <th className="py-3 px-4 w-48 text-right text-amber-200">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((sk) => (
                  <tr key={sk.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-900">
                      {String(sk.nomorUrut).padStart(3, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-emerald-900">{sk.nomorSK}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{formatDateIndo(sk.tanggalSK)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 line-clamp-1">{sk.judul}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{sk.tentang}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      TP {sk.tahunPelajaran}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {sk.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sk.fileDoc ? (
                        <button
                          onClick={() => (onEditBerkas ? onEditBerkas(sk) : onViewDocument(sk))}
                          title={`Dokumen: ${sk.fileDoc.fileName} - Klik untuk kelola / edit berkas`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-amber-100 hover:text-amber-950 hover:border-amber-300 transition-colors cursor-pointer group/file"
                        >
                          <HardDrive className="w-3 h-3 text-emerald-700 group-hover/file:text-amber-800" />
                          <span>Ada</span>
                        </button>
                      ) : canManage && onEditBerkas ? (
                        <button
                          onClick={() => onEditBerkas(sk)}
                          title="Lampirkan berkas SK"
                          className="text-[10px] font-medium text-slate-400 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          + Berkas
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sk.fileDoc && (
                          <button
                            onClick={() => onViewDocument(sk)}
                            title="Pratinjau Dokumen"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canManage && (
                          <>
                            <button
                              onClick={() => onEdit(sk)}
                              title="Edit Data & Berkas SK"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-3 h-3 text-emerald-700" /> Edit
                            </button>
                            {onEditBerkas && (
                              <button
                                onClick={() => onEditBerkas(sk)}
                                title="Edit / Ganti Berkas SK (Koreksi salah unggah)"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-colors cursor-pointer"
                              >
                                <Paperclip className="w-3 h-3" /> Berkas
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Hapus ${sk.nomorSK}?`)) {
                                  onDelete(sk.id);
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
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada Surat Keputusan</p>
                    <p className="text-xs text-slate-400 mt-1">Belum ada SK yang tercatat pada kriteria ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
