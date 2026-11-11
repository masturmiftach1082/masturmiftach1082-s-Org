import { SuratKeluar, MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo, formatFileSize } from '../../utils/formatters';
import MadrasahKop from '../common/MadrasahKop';
import {
  X,
  Printer,
  FileText,
  Edit,
  Trash2,
  ExternalLink,
  Building,
  Calendar,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface SuratKeluarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  surat: SuratKeluar | null;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onEdit: (surat: SuratKeluar) => void;
  onDelete: (id: string) => void;
  onViewDocument: (surat: SuratKeluar) => void;
}

export default function SuratKeluarDetailModal({
  isOpen,
  onClose,
  surat,
  settings,
  currentUser,
  onEdit,
  onDelete,
  onViewDocument,
}: SuratKeluarDetailModalProps) {
  if (!isOpen || !surat) return null;

  const canManage = currentUser.role === 'admin';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (No print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs bg-amber-400/20 text-amber-300 px-3 py-1 rounded-md border border-amber-400/40">
              URUT #{String(surat.nomorUrut).padStart(3, '0')}
            </span>
            <div>
              <h3 className="text-base font-semibold leading-tight line-clamp-1 text-white">
                {surat.nomorSuratLengkap}
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Surat Keluar · Tujuan: {surat.tujuanSurat}
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
          {/* Quick Action & Status Bar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 block mb-0.5">Status Pengiriman</span>
                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded">
                  {surat.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Sifat</span>
                <span className="font-semibold text-slate-800">{surat.sifat}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Klasifikasi</span>
                <span className="font-mono font-bold text-emerald-900">{surat.kodeKlasifikasi}</span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Lembar Ekspedisi / Surat
            </button>
          </div>

          {/* Official Printable Sheet (visible in modal and in print) */}
          <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-xl text-xs space-y-4 shadow-xs">
            <MadrasahKop settings={settings} subTitle="LEMBAR PENGESAHAN PENOMORAN SURAT KELUAR" />

            {/* Official Letterhead Data Table */}
            <table className="w-full border-collapse border border-slate-900 mb-4 text-xs">
              <tbody>
                <tr>
                  <td className="w-40 p-2 border border-slate-900 font-semibold bg-slate-50">Nomor Surat Lengkap</td>
                  <td className="p-2 border border-slate-900 font-mono font-bold text-emerald-900 text-sm" colSpan={3}>
                    {surat.nomorSuratLengkap}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Nomor Urut Buku</td>
                  <td className="p-2 border border-slate-900 font-mono font-bold">
                    {String(surat.nomorUrut).padStart(3, '0')} / {surat.tahunSurat}
                  </td>
                  <td className="w-32 p-2 border border-slate-900 font-semibold bg-slate-50">Kode Klasifikasi</td>
                  <td className="w-40 p-2 border border-slate-900 font-mono font-medium">{surat.kodeKlasifikasi} ({surat.kategori})</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Tanggal Surat</td>
                  <td className="p-2 border border-slate-900">{formatDateIndo(surat.tanggalSurat)}</td>
                  <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Sifat Surat</td>
                  <td className="p-2 border border-slate-900">{surat.sifat}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Tujuan / Penerima</td>
                  <td className="p-2 border border-slate-900 font-semibold" colSpan={3}>
                    {surat.tujuanSurat}
                    {surat.namaPenerima && ` (U.p. ${surat.namaPenerima}${surat.jabatanPenerima ? ` - ${surat.jabatanPenerima}` : ''})`}
                    {surat.alamatPenerima && <span className="block font-normal text-slate-600 mt-0.5">{surat.alamatPenerima}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-900 font-semibold bg-slate-50 align-top">Perihal</td>
                  <td className="p-2 border border-slate-900 font-medium" colSpan={3}>
                    {surat.perihal}
                    {surat.ringkasan && (
                      <p className="mt-1 text-[11px] text-slate-600 font-normal italic">
                        Ringkasan: {surat.ringkasan}
                      </p>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Ekspedisi / Catatan</td>
                  <td className="p-2 border border-slate-900 italic" colSpan={3}>
                    {surat.catatan || 'Surat resmi tercatat dalam basis data SIPAS MI Ma\'arif Al Ihsan Soborejo.'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature Box */}
            <div className="flex justify-between items-end pt-4">
              <div className="text-left text-[11px] text-slate-600 space-y-1">
                <p>Dicatat oleh: <strong>{surat.createdBy}</strong></p>
                <p>Status: <strong>{surat.status}</strong></p>
                <p className="font-mono text-[10px] text-slate-400 mt-2">SIPAS MI Ma'arif Al Ihsan Soborejo</p>
              </div>

              <div className="text-center text-xs">
                <p>Soborejo, {formatDateIndo(surat.tanggalSurat)}</p>
                <p className="font-bold mt-0.5">Kepala Madrasah,</p>
                <div className="h-14" />
                <p className="font-bold underline text-sm">{settings.kepalaMadrasah}</p>
                <p className="text-[11px] text-slate-700">NIP. {settings.nipKepalaMadrasah}</p>
              </div>
            </div>
          </div>

          {/* Google Drive Document Card (No print) */}
          <div className="no-print p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" /> Dokumen Surat Google Drive
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
                Belum ada pindaian surat yang diunggah ke Google Drive.
              </p>
            )}
          </div>
        </div>

        {/* Footer (No print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => {
                  if (confirm(`Yakin ingin menghapus Surat Keluar nomor ${surat.nomorSuratLengkap}? Nomor urut #${surat.nomorUrut} tidak akan dipakai ulang.`)) {
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
