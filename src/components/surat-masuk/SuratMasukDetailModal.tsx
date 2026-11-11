import { SuratMasuk, MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo, formatFileSize } from '../../utils/formatters';
import {
  X,
  Printer,
  FileText,
  FileSignature,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface SuratMasukDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  surat: SuratMasuk | null;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onEdit: (surat: SuratMasuk) => void;
  onDelete: (id: string) => void;
  onOpenDisposisi: (surat: SuratMasuk) => void;
  onPrintDisposisi: (surat: SuratMasuk) => void;
  onViewDocument: (surat: SuratMasuk) => void;
}

export default function SuratMasukDetailModal({
  isOpen,
  onClose,
  surat,
  settings,
  currentUser,
  onEdit,
  onDelete,
  onOpenDisposisi,
  onPrintDisposisi,
  onViewDocument,
}: SuratMasukDetailModalProps) {
  if (!isOpen || !surat) return null;

  const canManage = currentUser.role === 'admin';
  const canDisposisi = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm bg-amber-400/20 text-amber-300 px-3 py-1 rounded-md border border-amber-400/40">
              AGENDA #{surat.nomorAgenda} / {surat.tahunAgenda}
            </span>
            <div>
              <h3 className="text-base font-semibold leading-tight line-clamp-1 text-white">
                {surat.perihal}
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Surat Masuk · {surat.pengirim}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status & Sifat Quick Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 block mb-0.5">Status Surat</span>
                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded">
                  {surat.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Sifat</span>
                <span className="font-semibold text-slate-800">{surat.sifat}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Kategori</span>
                <span className="font-medium text-slate-700">{surat.kategori}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPrintDisposisi(surat)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Lembar Disposisi
              </button>
              {canDisposisi && (
                <button
                  onClick={() => onOpenDisposisi(surat)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
                >
                  <FileSignature className="w-3.5 h-3.5" /> Beri Disposisi
                </button>
              )}
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700" /> Data Pengirim & Tanggal
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 block">Nomor Surat Pengirim</span>
                  <span className="font-mono font-semibold text-slate-800">{surat.nomorSuratPengirim}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pengirim</span>
                  <span className="font-medium text-slate-800">{surat.pengirim}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block">Tanggal Surat</span>
                    <span className="font-medium text-slate-800">{formatDateIndo(surat.tanggalSurat)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Diterima</span>
                    <span className="font-medium text-slate-800">{formatDateIndo(surat.tanggalDiterima)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" /> Internal & Administrasi
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 block">Tujuan Internal</span>
                  <span className="font-medium text-slate-800">{surat.tujuanInternal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Didaftarkan Oleh</span>
                  <span className="font-medium text-slate-800">{surat.createdBy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Catatan Tambahan</span>
                  <span className="text-slate-700 italic">{surat.catatan || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan Isi */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-900 mb-1.5">Ringkasan / Isi Pokok Surat:</h4>
            <p className="text-slate-700 leading-relaxed">
              {surat.ringkasan || surat.perihal}
            </p>
          </div>

          {/* Disposisi Status Card */}
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-emerald-700" />
                Disposisi Kepala Madrasah
              </h4>
              {surat.disposisi ? (
                <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  Telah Didisposisikan
                </span>
              ) : (
                <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-medium">
                  Belum Ada Disposisi
                </span>
              )}
            </div>

            {surat.disposisi ? (
              <div className="space-y-2 pt-1 border-t border-emerald-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Diteruskan Kepada:</span>
                    <p className="font-medium text-slate-800">
                      {surat.disposisi.tujuanDisposisi.join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Sifat & Batas Waktu:</span>
                    <p className="font-medium text-slate-800">
                      {surat.disposisi.sifat}
                      {surat.disposisi.batasWaktu && ` · Batas: ${formatDateIndo(surat.disposisi.batasWaktu)}`}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Instruksi:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {surat.disposisi.instruksi.map((ins, i) => (
                      <span
                        key={i}
                        className="bg-white border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px]"
                      >
                        ✓ {ins}
                      </span>
                    ))}
                  </div>
                </div>

                {surat.disposisi.catatanKepala && (
                  <div className="p-2.5 bg-white rounded border border-emerald-200 mt-2">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Catatan Kepala Madrasah:</span>
                    <p className="italic text-slate-800 font-medium">"{surat.disposisi.catatanKepala}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-600 text-xs italic">
                Surat ini belum menerima disposisi dari Kepala Madrasah ({settings.kepalaMadrasah}). Klik tombol "Beri Disposisi" untuk menambahkan instruksi.
              </p>
            )}
          </div>

          {/* Google Drive Document Card */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" /> Dokumen Berkas Google Drive
              </h4>
              {surat.fileDoc && (
                <span className="text-[11px] font-mono text-slate-500">
                  {formatFileSize(surat.fileDoc.fileSize)}
                </span>
              )}
            </div>

            {surat.fileDoc ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                <div className="truncate">
                  <p className="font-semibold text-slate-800 truncate">{surat.fileDoc.fileName}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                    Google Drive ID: {surat.fileDoc.fileId}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onViewDocument(surat)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                  >
                    Pratinjau
                  </button>
                  <a
                    href={surat.fileDoc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka di Drive
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">
                Belum ada berkas dokumen digital yang dilampirkan ke surat ini.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => {
                  if (confirm(`Yakin ingin menghapus Surat Masuk Agenda #${surat.nomorAgenda}? Nomor agenda tidak akan dipakai ulang.`)) {
                    onDelete(surat.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Surat
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => {
                  onEdit(surat);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Ubah Data
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
