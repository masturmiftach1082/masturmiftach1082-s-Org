import { useState } from 'react';
import { GoogleDriveMetadata, MadrasahSettings } from '../../types';
import { formatFileSize, formatDateTimeIndo } from '../../utils/formatters';
import { ExternalLink, Download, FileText, CheckCircle2, ShieldCheck, X, HardDrive, RefreshCw, Edit } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileDoc?: GoogleDriveMetadata;
  title: string;
  nomorSurat?: string;
  settings: MadrasahSettings;
  canEdit?: boolean;
  onEditBerkas?: () => void;
  onEditData?: () => void;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  fileDoc,
  title,
  nomorSurat,
  settings,
  canEdit = false,
  onEditBerkas,
  onEditData,
}: DocumentViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !fileDoc) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fileDoc.driveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">
                Penampil Arsip Google Drive
              </h3>
              <p className="text-xs text-amber-200/80 truncate max-w-md">
                {fileDoc.fileName}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Penyimpanan Terhubung</span>
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Google Drive Cloud
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Ukuran & Format File</span>
              <span className="font-medium text-slate-800">
                {formatFileSize(fileDoc.fileSize)} · {fileDoc.fileType.toUpperCase().replace('APPLICATION/', '')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Waktu Diunggah</span>
              <span className="font-medium text-slate-800">
                {formatDateTimeIndo(fileDoc.uploadedAt)}
              </span>
            </div>
          </div>

          {/* Drive File ID Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-500">Google Drive ID:</span>
              <span className="font-mono text-slate-800 font-medium truncate">{fileDoc.fileId}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 font-medium bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shrink-0"
            >
              {copied ? 'Tersalin!' : 'Salin Tautan'}
            </button>
          </div>

          {/* Document Preview Canvas */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col items-center">
            {fileDoc.dataBase64 && fileDoc.fileType?.includes('image') ? (
              <div className="w-full text-center space-y-2">
                <img
                  src={fileDoc.dataBase64}
                  alt={fileDoc.fileName}
                  className="max-h-[500px] max-w-full object-contain rounded-lg border border-slate-300 shadow-sm mx-auto"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  {fileDoc.fileName} ({formatFileSize(fileDoc.fileSize)})
                </p>
              </div>
            ) : fileDoc.dataBase64 && fileDoc.fileType?.includes('pdf') ? (
              <div className="w-full space-y-2">
                <iframe
                  src={fileDoc.dataBase64}
                  className="w-full h-[500px] rounded-lg border border-slate-300 shadow-sm bg-white"
                  title={fileDoc.fileName}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Pratinjau Berkas PDF Asli</span>
                  <span>{formatFileSize(fileDoc.fileSize)}</span>
                </div>
              </div>
            ) : (
              /* Simulated Madrasah Document Summary Preview */
              <div className="w-full max-w-xl bg-white shadow-sm border border-slate-200 p-8 rounded-md text-slate-800 font-serif min-h-[320px] flex flex-col justify-between">
                <div>
                  {/* Header Kop */}
                  <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                    <p className="text-xs uppercase tracking-wider font-sans font-bold text-slate-600">
                      Lembaga Pendidikan Ma'arif NU Kab. Temanggung
                    </p>
                    <h4 className="text-sm uppercase font-sans font-extrabold text-emerald-900 tracking-wide mt-0.5">
                      {settings.namaMadrasah}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      {settings.alamat} · NSM: {settings.nsm} · NPSN: {settings.npsn}
                    </p>
                  </div>

                  {/* Surat Title / Summary */}
                  <div className="my-4 text-center font-sans">
                    <h5 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                      {nomorSurat || 'DOKUMEN ARSIP RESMI'}
                    </h5>
                    <p className="text-xs text-slate-600 mt-1 italic">
                      Perihal: {title}
                    </p>
                  </div>

                  <div className="text-xs leading-relaxed text-slate-700 font-sans bg-slate-50/70 p-4 rounded border border-slate-100 my-3">
                    <p className="font-semibold text-slate-800 mb-1">Ringkasan Dokumen:</p>
                    <p className="text-slate-600">
                      {fileDoc.textContent ||
                        'Dokumen fisik dan pindaian digital telah tersimpan dalam repositori dokumen madrasah. Seluruh hak cipta dan arsip berada dalam naungan MI Ma\'arif Al Ihsan Soborejo.'}
                    </p>
                  </div>
                </div>

                {/* Verified Stamp */}
                <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between font-sans text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Terverifikasi Google Drive Madrasah
                  </div>
                  <span>Soborejo, {new Date().getFullYear()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Folder: {fileDoc.folderId || '1-GDRIVE-ARCHIVE-SOBOREJO'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && onEditData && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditData();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-emerald-700" /> Edit Data Dokumen
              </button>
            )}
            {canEdit && onEditBerkas && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditBerkas();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-800" /> Ganti / Edit Berkas
              </button>
            )}
            {fileDoc.driveUrl && (
              <a
                href={fileDoc.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Drive
              </a>
            )}
            {(fileDoc.dataBase64 || fileDoc.downloadUrl || fileDoc.driveUrl) && (
              <a
                href={fileDoc.dataBase64 || fileDoc.downloadUrl || fileDoc.driveUrl}
                download={fileDoc.dataBase64 ? fileDoc.fileName : undefined}
                target={fileDoc.dataBase64 ? undefined : '_blank'}
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Dokumen
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
