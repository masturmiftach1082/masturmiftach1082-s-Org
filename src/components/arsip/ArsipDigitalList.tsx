import { useState, useMemo } from 'react';
import { ArsipDigital, MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo, formatFileSize, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  Download,
  Trash2,
  HardDrive,
  Archive,
  ExternalLink,
  Tag,
  MapPin,
} from 'lucide-react';

interface ArsipDigitalListProps {
  arsipList: ArsipDigital[];
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onAddNew: () => void;
  onDelete: (id: string) => void;
  onViewDocument: (arsip: ArsipDigital) => void;
}

export default function ArsipDigitalList({
  arsipList,
  settings,
  currentUser,
  onAddNew,
  onDelete,
  onViewDocument,
}: ArsipDigitalListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');

  const canManage = currentUser.role === 'admin' || currentUser.role === 'operator';

  const categories = useMemo(() => {
    return Array.from(new Set(arsipList.map((a) => a.kategori)));
  }, [arsipList]);

  const filteredList = useMemo(() => {
    return arsipList.filter((a) => {
      const matchSearch =
        a.judulArsip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.kodeArsip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchKategori = selectedKategori === 'ALL' || a.kategori === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [arsipList, searchTerm, selectedKategori]);

  const handleExportCSV = () => {
    const headers = [
      'Kode Arsip',
      'Judul Arsip',
      'Kategori',
      'Tahun',
      'Nomor Dokumen Terkait',
      'Ukuran File',
      'Tipe File',
      'Lokasi Fisik Rak',
      'Google Drive ID',
      'Diupload Oleh',
    ];

    const rows = filteredList.map((a) => [
      a.kodeArsip,
      a.judulArsip,
      a.kategori,
      a.tahun,
      a.nomorDokumenTerait || '-',
      formatFileSize(a.fileDoc.fileSize),
      a.fileDoc.fileType,
      a.lokasiFisik || '-',
      a.fileDoc.fileId,
      a.createdBy,
    ]);

    exportToCSV(`Katalog_Arsip_Digital_${settings.namaMadrasah.replace(/\s+/g, '_')}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Arsip Digital Madrasah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Repositori penyimpanan dokumen digital terpusat pada Google Drive MI Ma'arif Al Ihsan Soborejo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Ekspor Katalog
          </button>
          {canManage && (
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Unggah Arsip Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul arsip, tag (misal: KOM, BOS, Kurikulum), kode arsip..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div>
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="ALL">Semua Kategori Arsip</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-36">Kode Arsip</th>
                <th className="py-3 px-4">Judul Dokumen & Deskripsi</th>
                <th className="py-3 px-4 w-40">Kategori</th>
                <th className="py-3 px-4 w-28">Ukuran File</th>
                <th className="py-3 px-4 w-40">Lokasi Fisik / Rak</th>
                <th className="py-3 px-4 w-32 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((arsip) => (
                  <tr key={arsip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-emerald-900">{arsip.kodeArsip}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Tahun {arsip.tahun}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{arsip.judulArsip}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{arsip.deskripsi}</p>
                      {arsip.tags && arsip.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-slate-500">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {arsip.tags.map((tag, idx) => (
                            <span key={idx}>#{tag} </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{arsip.kategori}</span>
                      {arsip.nomorDokumenTerait && (
                        <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                          {arsip.nomorDokumenTerait}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {formatFileSize(arsip.fileDoc.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400" /> {arsip.lokasiFisik || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewDocument(arsip)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                        >
                          Pratinjau
                        </button>
                        <a
                          href={arsip.fileDoc.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Buka di Google Drive"
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {canManage && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus arsip "${arsip.judulArsip}"?`)) {
                                onDelete(arsip.id);
                              }
                            }}
                            title="Hapus"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada arsip digital</p>
                    <p className="text-xs text-slate-400 mt-1">Belum ada dokumen yang sesuai dengan pencarian.</p>
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
