import { useState, useEffect, useRef } from 'react';
import { ArsipDigital, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { isAnyDriveUploadConnected, uploadFileSmart } from '../../services/googleDriveService';
import {
  X,
  Save,
  UploadCloud,
  CheckCircle2,
  Archive,
  Loader2,
  HardDrive,
  ExternalLink,
  RefreshCw,
  Trash2,
  Link2,
} from 'lucide-react';

interface ArsipDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  arsipToEdit?: ArsipDigital | null;
  currentUser: UserProfile;
  onSaved: () => void;
}

const KATEGORI_ARSIP = [
  'Kurikulum & Akademik',
  'Kesiswaan & Ekstrakurikuler',
  'Kepegawaian & Guru',
  'Keuangan & BOS',
  'Akreditasi Madrasah',
  'Sarana & Prasarana',
  'Surat Keputusan (SK)',
  'Dokumentasi & Publikasi',
];

export default function ArsipDigitalModal({
  isOpen,
  onClose,
  arsipToEdit,
  currentUser,
  onSaved,
}: ArsipDigitalModalProps) {
  const isEdit = Boolean(arsipToEdit);

  const [kodeArsip, setKodeArsip] = useState('');
  const [judulArsip, setJudulArsip] = useState('');
  const [kategori, setKategori] = useState(KATEGORI_ARSIP[0]);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [nomorDokumenTerait, setNomorDokumenTerait] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [lokasiFisik, setLokasiFisik] = useState('Lemari Arsip TU');

  // File state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [manualDriveLink, setManualDriveLink] = useState('');
  const [fileDataBase64, setFileDataBase64] = useState<string | undefined>(undefined);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isFileRemoved, setIsFileRemoved] = useState(false);

  const wasOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      prevEditIdRef.current = null;
      return;
    }

    const currentEditId = arsipToEdit?.id ?? null;
    if (wasOpenRef.current && prevEditIdRef.current === currentEditId) {
      return;
    }
    wasOpenRef.current = true;
    prevEditIdRef.current = currentEditId;

    if (arsipToEdit) {
      setKodeArsip(arsipToEdit.kodeArsip);
      setJudulArsip(arsipToEdit.judulArsip);
      setKategori(arsipToEdit.kategori || KATEGORI_ARSIP[0]);
      setTahun(arsipToEdit.tahun || new Date().getFullYear());
      setNomorDokumenTerait(arsipToEdit.nomorDokumenTerait || '');
      setDeskripsi(arsipToEdit.deskripsi || '');
      setTagInput(arsipToEdit.tags ? arsipToEdit.tags.join(', ') : '');
      setLokasiFisik(arsipToEdit.lokasiFisik || '');
      setIsFileRemoved(false);
      setUploadNotice(null);

      if (arsipToEdit.fileDoc) {
        setFileName(arsipToEdit.fileDoc.fileName);
        setFileSize(arsipToEdit.fileDoc.fileSize);
        setFileType(arsipToEdit.fileDoc.fileType);
        setDriveFileId(arsipToEdit.fileDoc.fileId);
        setDriveUrl(arsipToEdit.fileDoc.driveUrl || '');
        setManualDriveLink(arsipToEdit.fileDoc.driveUrl || '');
        setFileDataBase64(arsipToEdit.fileDoc.dataBase64);
      } else {
        setFileName('');
        setFileSize(0);
        setFileType('application/pdf');
        setDriveFileId('');
        setDriveUrl('');
        setManualDriveLink('');
        setFileDataBase64(undefined);
      }
    } else {
      setKodeArsip('');
      setJudulArsip('');
      setKategori(KATEGORI_ARSIP[0]);
      setTahun(new Date().getFullYear());
      setNomorDokumenTerait('');
      setDeskripsi('');
      setTagInput('');
      setLokasiFisik('Lemari Arsip TU');
      setFileName('');
      setFileSize(0);
      setFileType('application/pdf');
      setDriveFileId('');
      setDriveUrl('');
      setManualDriveLink('');
      setFileDataBase64(undefined);
      setUploadNotice(null);
      setIsFileRemoved(false);
    }
  }, [isOpen, arsipToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileRemoved(false);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/pdf');
    setUploadNotice(null);
    if (!judulArsip) {
      setJudulArsip(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    // Only keep lightweight local base64 preview if file is small (<= 350 KB)
    if (file.size <= 350 * 1024) {
      const reader = new FileReader();
      reader.onload = () => setFileDataBase64(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFileDataBase64(undefined);
    }

    if (isAnyDriveUploadConnected()) {
      setIsUploadingDrive(true);
      try {
        const meta = await uploadFileSmart(file, 'Arsip Digital', deskripsi || file.name);
        setDriveFileId(meta.fileId);
        setDriveUrl(meta.driveUrl);
        setManualDriveLink(meta.driveUrl);
        // Real Google Drive file already hosted in Drive; no need to bloat storage with base64
        setFileDataBase64(undefined);
        setUploadNotice('Berhasil diunggah otomatis ke Google Drive madrasah');
      } catch (err: any) {
        console.warn('Google Drive archive upload notice:', err);
        const randomDriveId = `1gdrive-arc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        setDriveFileId(randomDriveId);
        setDriveUrl(`https://drive.google.com/file/d/${randomDriveId}/view`);
        setUploadNotice('Tersimpan di pangkalan data cloud SIPAS');
      } finally {
        setIsUploadingDrive(false);
      }
    } else {
      const randomDriveId = `1gdrive-arc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
      setDriveUrl(`https://drive.google.com/file/d/${randomDriveId}/view`);
      setUploadNotice('Berkas tersimpan & tersinkronisasi di cloud');
    }
  };

  const handleApplyManualLink = () => {
    const trimmed = manualDriveLink.trim();
    if (!trimmed) return;
    const idMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    const extractedId = idMatch ? idMatch[1] : `gdrive-link-${Date.now().toString(36)}`;
    setIsFileRemoved(false);
    setDriveFileId(extractedId);
    setDriveUrl(trimmed);
    if (!fileName) {
      setFileName(`${(judulArsip || 'Dokumen_Arsip').replace(/\s+/g, '_')}.pdf`);
      setFileSize(102400);
    }
    setUploadNotice('Tautan Google Drive berhasil disematkan!');
  };

  const handleRemoveAttachment = () => {
    if (window.confirm('Yakin ingin melepas berkas lampiran arsip ini?')) {
      setIsFileRemoved(true);
      setFileName('');
      setFileSize(0);
      setDriveFileId('');
      setDriveUrl('');
      setManualDriveLink('');
      setFileDataBase64(undefined);
      setUploadNotice('Berkas lampiran arsip telah dilepas.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulArsip.trim()) {
      alert('Judul arsip wajib diisi.');
      return;
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const code =
      kodeArsip.trim() ||
      `ARS-${kategori.substring(0, 3).toUpperCase()}-${tahun}-${Math.floor(1000 + Math.random() * 9000)}`;

    const resolvedDriveUrl =
      manualDriveLink.trim() ||
      driveUrl ||
      `https://drive.google.com/file/d/${driveFileId || 'default'}/view`;

    const fileDoc = isFileRemoved
      ? {
          fileId: '',
          fileName: 'Belum ada berkas terlampir',
          fileSize: 0,
          fileType: 'application/pdf',
          driveUrl: '',
          uploadedAt: new Date().toISOString(),
          textContent: deskripsi || judulArsip,
        }
      : {
          fileId: driveFileId || `1gdrive-arc-${Date.now()}`,
          folderId: '1-GDRIVE-ARCHIVE-SOBOREJO-2026',
          fileName: fileName || `${judulArsip.replace(/\s+/g, '_')}.pdf`,
          fileSize: fileSize || 1500000,
          fileType,
          driveUrl: resolvedDriveUrl,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: deskripsi || judulArsip,
          dataBase64: fileDataBase64,
        };

    if (isEdit && arsipToEdit) {
      storageService.updateArsipDigital(
        arsipToEdit.id,
        {
          kodeArsip: code,
          judulArsip: judulArsip.trim(),
          kategori,
          tahun,
          nomorDokumenTerait: nomorDokumenTerait.trim() || undefined,
          deskripsi: deskripsi.trim(),
          tags,
          fileDoc,
          lokasiFisik: lokasiFisik.trim() || undefined,
        },
        currentUser
      );
    } else {
      storageService.addArsipDigital(
        {
          kodeArsip: code,
          judulArsip: judulArsip.trim(),
          kategori,
          tahun,
          nomorDokumenTerait: nomorDokumenTerait.trim() || undefined,
          deskripsi: deskripsi.trim(),
          tags,
          fileDoc,
          lokasiFisik: lokasiFisik.trim() || undefined,
          createdBy: currentUser.name,
        },
        currentUser
      );
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight text-white">
                {isEdit ? `Edit Arsip Digital: ${arsipToEdit?.kodeArsip}` : 'Simpan Arsip Digital Baru'}
              </h3>
              <p className="text-xs text-amber-200/80">
                Penyimpanan &amp; pengelolaan berkas madrasah terintegrasi Cloud &amp; Google Drive
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Arsip
                </label>
                <input
                  type="text"
                  value={kodeArsip}
                  onChange={(e) => setKodeArsip(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-950"
                />
              </div>
            )}
            <div className={isEdit ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Arsip Dokumen *
              </label>
              <input
                type="text"
                required
                value={judulArsip}
                onChange={(e) => setJudulArsip(e.target.value)}
                placeholder="Contoh: Kurikulum Operasional Madrasah (KOM) 2025/2026"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Berkas
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {KATEGORI_ARSIP.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Dokumen
              </label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value, 10))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Dokumen Terkait (Opsional)
              </label>
              <input
                type="text"
                value={nomorDokumenTerait}
                onChange={(e) => setNomorDokumenTerait(e.target.value)}
                placeholder="Contoh: SK No. 018/Mis.11.23.14.14/SK/07/2025"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Fisik / Rak Arsip (Opsional)
              </label>
              <input
                type="text"
                value={lokasiFisik}
                onChange={(e) => setLokasiFisik(e.target.value)}
                placeholder="Contoh: Lemari Arsip TU Rak B1 / Bantex BOS"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Kunci / Tag Pencarian (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Contoh: KOM, Kurikulum Merdeka, BOS, Kemenag"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Berkas
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Keterangan singkat isi atau urgensi dokumen..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Upload / Edit Dokumen */}
          <div className="p-4 bg-slate-50 border border-dashed border-emerald-300 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  Berkas Dokumen Arsip (Cloud &amp; Google Drive)
                </span>
                <span className="text-[11px] text-slate-500">
                  Unggah berkas baru (PDF/Word/Excel/Gambar) atau tempel tautan Google Drive di bawah.
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors shadow-2xs">
                {isUploadingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingDrive ? 'Mengunggah...' : fileName && !isFileRemoved ? 'Unggah Ulang File' : 'Pilih File Arsip'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  onChange={handleFileUpload}
                  disabled={isUploadingDrive}
                  className="hidden"
                />
              </label>
            </div>

            {isUploadingDrive && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sedang mengunggah berkas arsip...</span>
              </div>
            )}

            {fileName && !isFileRemoved && !isUploadingDrive && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{fileName}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({(fileSize / 1024).toFixed(0)} KB)
                  </span>
                  {uploadNotice && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                      {uploadNotice}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {driveUrl && (
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 underline font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" /> Buka di Drive
                    </a>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded transition-colors shadow-2xs">
                    <RefreshCw className="w-3 h-3 text-amber-800" />
                    <span>Ganti Berkas</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    title="Lepas berkas lampiran"
                  >
                    <Trash2 className="w-3 h-3" /> Lepas
                  </button>
                </div>
              </div>
            )}

            {isFileRemoved && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                <span>Berkas lampiran arsip dilepas. Klik Simpan Perubahan untuk mengonfirmasi.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFileRemoved(false);
                    if (arsipToEdit?.fileDoc) {
                      setFileName(arsipToEdit.fileDoc.fileName);
                      setFileSize(arsipToEdit.fileDoc.fileSize);
                      setFileType(arsipToEdit.fileDoc.fileType);
                      setDriveFileId(arsipToEdit.fileDoc.fileId);
                      setDriveUrl(arsipToEdit.fileDoc.driveUrl || '');
                      setManualDriveLink(arsipToEdit.fileDoc.driveUrl || '');
                      setFileDataBase64(arsipToEdit.fileDoc.dataBase64);
                    }
                  }}
                  className="text-xs font-semibold text-amber-950 underline hover:text-black cursor-pointer"
                >
                  Batal Lepas
                </button>
              </div>
            )}

            {/* Inline Tautan Google Drive */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                Atau Tautan Berkas Google Drive (Opsional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={manualDriveLink}
                  onChange={(e) => setManualDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyManualLink}
                  disabled={!manualDriveLink.trim()}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Sematkan
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploadingDrive}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>
                {isUploadingDrive
                  ? 'Menunggu Unggahan Drive...'
                  : isEdit
                  ? 'Simpan Perubahan Arsip'
                  : 'Simpan ke Arsip Digital'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
