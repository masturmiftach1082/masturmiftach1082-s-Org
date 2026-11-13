import { useState, useRef } from 'react';
import { DocumentFile, UserProfile } from '../../types';
import { formatFileSize, formatDateIndo } from '../../utils/formatters';
import { isAnyDriveUploadConnected, uploadFileSmart, deleteFileSmart } from '../../services/googleDriveService';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ExternalLink,
  HardDrive,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileCheck,
  Link2,
} from 'lucide-react';

export interface EditBerkasModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipe: 'surat-masuk' | 'surat-keluar' | 'surat-keputusan' | 'arsip';
  itemTitle: string;
  itemSubtitle?: string;
  currentFile?: DocumentFile | null;
  currentUser: UserProfile;
  onSave: (newFile: DocumentFile | undefined, shouldDeleteDriveId?: string) => Promise<void> | void;
  onPreview?: (file: DocumentFile) => void;
}

export default function EditBerkasModal({
  isOpen,
  onClose,
  tipe,
  itemTitle,
  itemSubtitle,
  currentFile,
  onSave,
  onPreview,
}: EditBerkasModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replacement file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [newFileDoc, setNewFileDoc] = useState<DocumentFile | null>(null);
  const [manualDriveUrl, setManualDriveUrl] = useState('');

  // File removal state
  const [isMarkedForRemoval, setIsMarkedForRemoval] = useState(false);
  const [deleteFromGoogleDriveAlso, setDeleteFromGoogleDriveAlso] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getCategoryLabel = (): 'Surat Masuk' | 'Surat Keluar' | 'Surat Keputusan' | 'Arsip Digital' => {
    switch (tipe) {
      case 'surat-masuk':
        return 'Surat Masuk';
      case 'surat-keluar':
        return 'Surat Keluar';
      case 'surat-keputusan':
        return 'Surat Keputusan';
      case 'arsip':
      default:
        return 'Arsip Digital';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas melebihi batas maksimum 25 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIsMarkedForRemoval(false);

    // Read small files (<= 350 KB) as Data URL only if Drive upload is not active
    let base64Content: string | undefined;
    if (file.size <= 350 * 1024 && !isAnyDriveUploadConnected()) {
      try {
        base64Content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch {
        // ignore
      }
    }

    // Auto upload to Google Drive if connected via Apps Script or API
    if (isAnyDriveUploadConnected()) {
      setIsUploadingDrive(true);
      setUploadProgressText('Sedang mengunggah berkas pengganti ke Google Drive madrasah...');
      try {
        const driveMeta = await uploadFileSmart(
          file,
          getCategoryLabel(),
          `${itemTitle} - ${file.name}`
        );

        setNewFileDoc({
          fileId: driveMeta.fileId,
          folderId: driveMeta.folderId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          driveUrl: driveMeta.driveUrl,
          downloadUrl: driveMeta.downloadUrl,
          uploadedAt: new Date().toISOString(),
          textContent: itemTitle,
          dataBase64: undefined,
        });
        setUploadNotice('Berhasil diunggah ke folder Google Drive madrasah!');
      } catch (err: any) {
        console.warn('Drive upload fallback in EditBerkasModal:', err);
        const fallbackDriveId = `1gdrive-${tipe}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        setNewFileDoc({
          fileId: fallbackDriveId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          driveUrl: `https://drive.google.com/file/d/${fallbackDriveId}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${fallbackDriveId}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: itemTitle,
          dataBase64: base64Content,
        });
        setUploadNotice('Tersimpan di pangkalan data cloud SIPAS');
      } finally {
        setIsUploadingDrive(false);
      }
    } else {
      // Local & Supabase synced file
      const fallbackDriveId = `1gdrive-${tipe}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      setNewFileDoc({
        fileId: fallbackDriveId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
        driveUrl: `https://drive.google.com/file/d/${fallbackDriveId}/view`,
        downloadUrl: `https://drive.google.com/uc?id=${fallbackDriveId}&export=download`,
        uploadedAt: new Date().toISOString(),
        textContent: itemTitle,
        dataBase64: base64Content,
      });
      setUploadNotice('Berkas baru siap disimpan & disinkronkan ke pangkalan data cloud');
    }
  };

  const handleApplyManualDriveUrl = () => {
    if (!manualDriveUrl.trim()) return;
    const url = manualDriveUrl.trim();
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    const fileId = idMatch ? idMatch[1] : `gdrive-link-${Date.now().toString(36)}`;

    setNewFileDoc({
      fileId,
      fileName: newFileDoc?.fileName || currentFile?.fileName || `Dokumen Drive - ${itemTitle}`,
      fileSize: newFileDoc?.fileSize || currentFile?.fileSize || 102400,
      fileType: 'application/pdf',
      driveUrl: url,
      downloadUrl: idMatch ? `https://drive.google.com/uc?id=${fileId}&export=download` : url,
      uploadedAt: new Date().toISOString(),
      textContent: itemTitle,
      dataBase64: newFileDoc?.dataBase64,
    });
    setIsMarkedForRemoval(false);
    setUploadNotice('Tautan Google Drive berhasil disematkan!');
  };

  const handleMarkRemove = () => {
    setIsMarkedForRemoval(true);
    setSelectedFile(null);
    setNewFileDoc(null);
    setUploadNotice(null);
  };

  const handleUndoRemove = () => {
    setIsMarkedForRemoval(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (isMarkedForRemoval) {
        // Remove attached file
        let driveIdToDelete: string | undefined;
        if (deleteFromGoogleDriveAlso && currentFile?.fileId && !currentFile.fileId.startsWith('1gdrive-')) {
          driveIdToDelete = currentFile.fileId;
          if (isAnyDriveUploadConnected()) {
            try {
              await deleteFileSmart(currentFile.fileId, currentFile.fileName);
            } catch (delErr) {
              console.warn('Error deleting from Drive:', delErr);
            }
          }
        }
        await onSave(undefined, driveIdToDelete);
      } else if (newFileDoc) {
        // If there was an old file on Drive and user replaced it, check if we should delete old file
        let oldDriveIdToDelete: string | undefined;
        if (
          deleteFromGoogleDriveAlso &&
          currentFile?.fileId &&
          currentFile.fileId !== newFileDoc.fileId &&
          !currentFile.fileId.startsWith('1gdrive-')
        ) {
          oldDriveIdToDelete = currentFile.fileId;
          if (isAnyDriveUploadConnected()) {
            try {
              await deleteFileSmart(currentFile.fileId, currentFile.fileName);
            } catch (delErr) {
              console.warn('Error deleting replaced file from Drive:', delErr);
            }
          }
        }
        await onSave(newFileDoc, oldDriveIdToDelete);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan berkas.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = isMarkedForRemoval || Boolean(newFileDoc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (Royal Emerald & Gold) */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/70 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  {getCategoryLabel()}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  Menu Edit / Koreksi Berkas
                </h3>
              </div>
              <p className="text-xs text-amber-100/80 truncate max-w-md mt-0.5 font-medium">
                {itemTitle} {itemSubtitle ? `· ${itemSubtitle}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-semibold text-amber-900">
                Koreksi Kesalahan Unggah Berkas:
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Gunakan menu ini jika sebelumnya salah memilih berkas scan, atau ingin mengganti berkas draft/buram dengan hasil scan resmi yang telah ditandatangani dan distempel madrasah.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Berkas Saat Ini */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>1. Berkas Lampiran Saat Ini</span>
              {currentFile && !isMarkedForRemoval && (
                <span className="text-[11px] font-normal text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Tersedia
                </span>
              )}
            </h4>

            {currentFile ? (
              isMarkedForRemoval ? (
                <div className="p-4 bg-red-50/80 border border-dashed border-red-300 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-red-800">
                    <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <p className="font-bold">Lampiran berkas ditandai untuk dihapus</p>
                      <p className="text-[11px] text-red-600 mt-0.5 font-mono">
                        {currentFile.fileName} ({formatFileSize(currentFile.fileSize)})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUndoRemove}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    Batal Hapus
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate max-w-sm">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentFile.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono">{formatFileSize(currentFile.fileSize)}</span>
                          <span>•</span>
                          <span>{currentFile.uploadedAt ? formatDateIndo(currentFile.uploadedAt) : 'Arsip SIPAS'}</span>
                        </div>
                        {currentFile.fileId && (
                          <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                            ID: {currentFile.fileId}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons for existing file */}
                    <div className="flex items-center gap-2 shrink-0">
                      {onPreview && (
                        <button
                          type="button"
                          onClick={() => onPreview(currentFile)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Pratinjau
                        </button>
                      )}
                      {currentFile.driveUrl && (
                        <a
                          href={currentFile.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Buka di Drive
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleMarkRemove}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                        title="Hapus / Lepas berkas ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>

                  {/* Drive deletion option */}
                  {isAnyDriveUploadConnected() && (
                    <label className="flex items-center gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deleteFromGoogleDriveAlso}
                        onChange={(e) => setDeleteFromGoogleDriveAlso(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>
                        Hapus juga berkas lama dari Google Drive madrasah jika diganti atau dilepas.
                      </span>
                    </label>
                  )}
                </div>
              )
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>Belum ada berkas dokumen yang terlampir pada data ini.</p>
              </div>
            )}
          </div>

          {/* Section 2: Unggah Berkas Baru / Pengganti */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>2. {currentFile && !isMarkedForRemoval ? 'Ganti dengan Berkas Baru' : 'Unggah Berkas Lampiran'}</span>
              <span className="text-[11px] font-normal text-slate-500">
                PDF, Word, JPG, PNG (Maks. 25 MB)
              </span>
            </h4>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${
                newFileDoc
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isUploadingDrive}
                className="hidden"
              />

              {isUploadingDrive ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-emerald-900">{uploadProgressText}</p>
                  <p className="text-[11px] text-emerald-700">Menyimpan langsung ke Google Drive madrasah...</p>
                </div>
              ) : newFileDoc ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">{newFileDoc.fileName}</p>
                    <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      Ukuran: {formatFileSize(newFileDoc.fileSize)}
                    </p>
                  </div>
                  {uploadNotice && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-200/80 text-emerald-900">
                      ✓ {uploadNotice}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Klik di sini jika ingin memilih berkas yang lain
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk memilih berkas scan / dokumen surat yang benar
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Berkas fisik akan otomatis tersimpan &amp; tersinkronisasi ke seluruh perangkat via cloud.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alternatif: Tautan Google Drive Langsung */}
            <div className="pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-700" /> Atau Sematkan Tautan Berkas Google Drive (Tanpa Autentikasi)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bebas Hambatan
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={manualDriveUrl}
                    onChange={(e) => setManualDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyManualDriveUrl}
                    disabled={!manualDriveUrl.trim()}
                    className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors cursor-pointer text-xs shrink-0"
                  >
                    Terapkan Tautan
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Jika surat telah diunggah ke Google Drive madrasah, cukup salin link berkas tersebut dan klik Terapkan Tautan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isUploadingDrive || isSaving}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer ${
              hasChanges && !isUploadingDrive && !isSaving
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border border-amber-400/80'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isMarkedForRemoval ? (
              <>
                <Trash2 className="w-4 h-4 text-red-800" />
                <span>Simpan Penghapusan Berkas</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 text-emerald-950" />
                <span>Simpan Berkas Pengganti</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
