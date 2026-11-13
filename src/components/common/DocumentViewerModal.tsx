import { useState, useEffect, useRef } from 'react';
import { GoogleDriveMetadata, MadrasahSettings } from '../../types';
import { formatFileSize, formatDateTimeIndo } from '../../utils/formatters';
import MadrasahKop from './MadrasahKop';
import {
  ExternalLink,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  X,
  HardDrive,
  RefreshCw,
  Edit,
  Maximize2,
  Minimize2,
  Info,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setZoom(100);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, fileDoc?.fileId]);

  if (!isOpen || !fileDoc) return null;

  const isRealDriveFile =
    Boolean(fileDoc.fileId) &&
    !fileDoc.fileId.startsWith('1gdrive-') &&
    !fileDoc.fileId.startsWith('gdrive-link-') &&
    !fileDoc.fileId.startsWith('arsip-empty-') &&
    fileDoc.fileId !== 'doc-auto';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fileDoc.driveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 25));
  const handleZoomIn = () => setZoom((prev) => Math.min(200, prev + 25));
  const handleResetZoom = () => {
    setZoom(100);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`relative bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'w-screen h-screen rounded-none border-0'
            : 'w-[96vw] max-w-7xl h-[94vh] rounded-xl border border-slate-200'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-white leading-tight truncate">
                  {title || 'Penampil Dokumen'}
                </h3>
                {nomorSurat && (
                  <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 rounded shrink-0">
                    {nomorSurat}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-200/80 truncate">
                {fileDoc.fileName} · {formatFileSize(fileDoc.fileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-black/25 border border-white/15 rounded-lg p-0.5 mr-0.5 sm:mr-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="Perkecil Tampilan"
                className="p-1 sm:p-1.5 text-amber-100/90 hover:text-white disabled:opacity-40 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom ke 100%"
                className="px-1.5 sm:px-2 py-1 text-[11px] font-mono font-semibold text-amber-200 hover:text-white transition-colors cursor-pointer"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Perbesar Tampilan"
                className="p-1 sm:p-1.5 text-amber-100/90 hover:text-white disabled:opacity-40 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoom !== 100 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Kembali ke ukuran standar"
                  className="hidden sm:inline-flex p-1.5 text-amber-200 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowInfo((prev) => !prev)}
              title="Detail Informasi Berkas"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                showInfo
                  ? 'bg-amber-400/20 text-amber-200 border-amber-300/50'
                  : 'text-amber-100/90 hover:text-white border-white/15 hover:bg-white/10'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Info Berkas</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Perkecil Jendela' : 'Perluas 1 Jendela Penuh'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-100/90 hover:text-white rounded-lg border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mode Jendela</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Tutup Pratinjau (Esc)"
              className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Metadata Info Strip */}
        {showInfo && (
          <div className="px-4 sm:px-6 py-3 bg-emerald-50/70 border-b border-emerald-200 text-xs shrink-0 max-h-44 overflow-y-auto preview-scrollbar space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Penyimpanan Terhubung</span>
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Google Drive Cloud
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ukuran &amp; Format File</span>
                <span className="font-medium text-slate-800">
                  {formatFileSize(fileDoc.fileSize)} · {(fileDoc.fileType || 'PDF').toUpperCase().replace('APPLICATION/', '')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Waktu Diunggah</span>
                <span className="font-medium text-slate-800">
                  {formatDateTimeIndo(fileDoc.uploadedAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-emerald-200/80">
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-500">Google Drive ID:</span>
                <span className="font-mono text-slate-800 font-medium truncate">{fileDoc.fileId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-emerald-800 font-medium bg-slate-50 border border-slate-200 rounded hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tautan Tersalin!' : 'Salin Tautan Drive'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Full-Space Scrollable Document Preview Canvas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-scroll overflow-x-auto preview-scrollbar bg-slate-200/80 p-2 sm:p-4"
        >
          {fileDoc.dataBase64 && fileDoc.fileType?.includes('image') ? (
            <div className="min-h-full w-full flex items-start justify-center p-2">
              <img
                src={fileDoc.dataBase64}
                alt={fileDoc.fileName}
                style={{ width: `${zoom}%`, maxWidth: zoom <= 100 ? '56rem' : 'none' }}
                className="h-auto rounded-lg shadow-md bg-white border border-slate-300"
              />
            </div>
          ) : fileDoc.dataBase64 && fileDoc.fileType?.includes('pdf') ? (
            <div
              className="mx-auto bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden"
              style={{
                width: `${zoom}%`,
                minWidth: zoom > 100 ? `${zoom}%` : '100%',
                height: zoom > 100 ? `${Math.max(100, zoom)}%` : '100%',
                minHeight: zoom > 100 ? `${Math.max(760, Math.round(zoom * 7.6))}px` : '680px',
              }}
            >
              <iframe
                src={fileDoc.dataBase64}
                scrolling="yes"
                className="w-full h-full border-0 bg-white"
                title={fileDoc.fileName}
              />
            </div>
          ) : isRealDriveFile ? (
            <div
              className="mx-auto bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden"
              style={{
                width: `${zoom}%`,
                minWidth: zoom > 100 ? `${zoom}%` : '100%',
                height: zoom > 100 ? `${Math.max(100, zoom)}%` : '100%',
                minHeight: zoom > 100 ? `${Math.max(780, Math.round(zoom * 7.8))}px` : '720px',
              }}
            >
              <iframe
                src={`https://drive.google.com/file/d/${fileDoc.fileId}/preview`}
                scrolling="yes"
                className="w-full h-full border-0 bg-white"
                title={fileDoc.fileName}
                allow="autoplay"
              />
            </div>
          ) : (
            /* Simulated Madrasah Document Summary Preview */
            <div className="min-h-full w-full flex items-start justify-center p-2 sm:p-4">
              <div
                style={{
                  width: `${Math.round((768 * zoom) / 100)}px`,
                  maxWidth: zoom > 100 ? 'none' : '100%',
                }}
                className="bg-white shadow-sm border border-slate-200 p-8 sm:p-10 rounded-lg text-slate-800 font-serif min-h-[420px] flex flex-col justify-between shrink-0"
              >
                <div>
                  {/* Header Kop */}
                  <MadrasahKop settings={settings} />

                  {/* Surat Title / Summary */}
                  <div className="my-5 text-center font-sans">
                    <h5 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                      {nomorSurat || 'DOKUMEN ARSIP RESMI'}
                    </h5>
                    <p className="text-xs text-slate-600 mt-1 italic">
                      Perihal: {title}
                    </p>
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed text-slate-700 font-sans bg-slate-50/70 p-5 rounded border border-slate-100 my-4">
                    <p className="font-semibold text-slate-800 mb-1.5">Ringkasan Dokumen:</p>
                    <p className="text-slate-600">
                      {fileDoc.textContent ||
                        'Dokumen fisik dan pindaian digital telah tersimpan dalam repositori dokumen madrasah. Seluruh hak cipta dan arsip berada dalam naungan MI Ma\'arif Al Ihsan Soborejo.'}
                    </p>
                  </div>
                </div>

                {/* Verified Stamp */}
                <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between font-sans text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Terverifikasi Google Drive Madrasah
                  </div>
                  <span>Soborejo, {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 shrink-0">
          <span className="text-[11px] text-slate-500 truncate">
            {isRealDriveFile
              ? 'Pratinjau Langsung Google Drive Madrasah'
              : `Folder: ${fileDoc.folderId || '1-GDRIVE-ARCHIVE-SOBOREJO'}`}
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
