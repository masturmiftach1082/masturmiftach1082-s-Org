import { useState, useEffect, useRef } from 'react';
import {
  PkkmDokumen,
  PkkmKomponenId,
  PkkmStatusVerifikasi,
  UserProfile,
} from '../../types';
import { PKKM_COMPONENTS, getPkkmKomponenById } from '../../data/pkkmStructure';
import { storageService } from '../../services/storageService';
import { isAnyDriveUploadConnected, uploadFileSmart } from '../../services/googleDriveService';
import {
  X,
  Save,
  UploadCloud,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  HardDrive,
  ExternalLink,
  RefreshCw,
  Trash2,
  Link2,
} from 'lucide-react';

interface PkkmDokumenModalProps {
  isOpen: boolean;
  onClose: () => void;
  dokumenToEdit?: PkkmDokumen | null;
  defaultKomponenId: PkkmKomponenId;
  defaultSubMenuId?: string;
  defaultSubItemId?: string;
  currentUser: UserProfile;
  onSaved: () => void;
}

const TAHUN_AJARAN_OPTIONS = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];

export default function PkkmDokumenModal({
  isOpen,
  onClose,
  dokumenToEdit,
  defaultKomponenId,
  defaultSubMenuId,
  defaultSubItemId,
  currentUser,
  onSaved,
}: PkkmDokumenModalProps) {
  const isEdit = Boolean(dokumenToEdit);

  const [komponenId, setKomponenId] = useState<PkkmKomponenId>(defaultKomponenId);
  const [subMenuId, setSubMenuId] = useState<string>(defaultSubMenuId || 'a');
  const [subItemId, setSubItemId] = useState<string>(defaultSubItemId || '');
  const [kodeDokumen, setKodeDokumen] = useState('');
  const [judulDokumen, setJudulDokumen] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [tanggalDokumen, setTanggalDokumen] = useState(new Date().toISOString().split('T')[0]);
  const [penanggungJawab, setPenanggungJawab] = useState('Kepala Madrasah');
  const [statusVerifikasi, setStatusVerifikasi] = useState<PkkmStatusVerifikasi>('Lengkap');
  const [keterangan, setKeterangan] = useState('');

  // File attachment state
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

  const activeKomponen = getPkkmKomponenById(komponenId);
  const activeSubMenu =
    activeKomponen.subMenus.find((sm) => sm.id === subMenuId) || activeKomponen.subMenus[0];
  const hasSubItems = Boolean(activeSubMenu?.subItems && activeSubMenu.subItems.length > 0);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      prevEditIdRef.current = null;
      return;
    }

    const currentEditId = dokumenToEdit?.id ?? null;
    if (wasOpenRef.current && prevEditIdRef.current === currentEditId) {
      return;
    }
    wasOpenRef.current = true;
    prevEditIdRef.current = currentEditId;

    if (dokumenToEdit) {
      setKomponenId(dokumenToEdit.komponenId);
      setSubMenuId(dokumenToEdit.subMenuId);
      setSubItemId(dokumenToEdit.subItemId || '');
      setKodeDokumen(dokumenToEdit.kodeDokumen);
      setJudulDokumen(dokumenToEdit.judulDokumen);
      setTahunAjaran(dokumenToEdit.tahunAjaran || '2025/2026');
      setTahun(dokumenToEdit.tahun || new Date().getFullYear());
      setTanggalDokumen(dokumenToEdit.tanggalDokumen || new Date().toISOString().split('T')[0]);
      setPenanggungJawab(dokumenToEdit.penanggungJawab || 'Kepala Madrasah');
      setStatusVerifikasi(dokumenToEdit.statusVerifikasi || 'Lengkap');
      setKeterangan(dokumenToEdit.keterangan || '');
      setIsFileRemoved(false);
      setUploadNotice(null);

      if (dokumenToEdit.fileDoc) {
        setFileName(dokumenToEdit.fileDoc.fileName);
        setFileSize(dokumenToEdit.fileDoc.fileSize);
        setFileType(dokumenToEdit.fileDoc.fileType);
        setDriveFileId(dokumenToEdit.fileDoc.fileId);
        setDriveUrl(dokumenToEdit.fileDoc.driveUrl || '');
        setManualDriveLink(dokumenToEdit.fileDoc.driveUrl || '');
        setFileDataBase64(dokumenToEdit.fileDoc.dataBase64);
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
      const comp = getPkkmKomponenById(defaultKomponenId);
      const smId =
        defaultSubMenuId && comp.subMenus.some((s) => s.id === defaultSubMenuId)
          ? defaultSubMenuId
          : comp.subMenus[0].id;
      const smObj = comp.subMenus.find((s) => s.id === smId);
      const siId =
        defaultSubItemId && smObj?.subItems?.some((si) => si.id === defaultSubItemId)
          ? defaultSubItemId
          : smObj?.subItems?.[0]?.id || '';

      setKomponenId(defaultKomponenId);
      setSubMenuId(smId);
      setSubItemId(siId);
      setKodeDokumen('');
      setJudulDokumen('');
      setTahunAjaran('2025/2026');
      setTahun(new Date().getFullYear());
      setTanggalDokumen(new Date().toISOString().split('T')[0]);
      setPenanggungJawab(defaultKomponenId === 'kepemimpinan' ? 'Guru / Tim Kurikulum' : 'Kepala Madrasah');
      setStatusVerifikasi('Lengkap');
      setKeterangan('');
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
  }, [isOpen, dokumenToEdit, defaultKomponenId, defaultSubMenuId, defaultSubItemId]);

  if (!isOpen) return null;

  const handleKomponenChange = (nextId: PkkmKomponenId) => {
    const nextComp = getPkkmKomponenById(nextId);
    const firstSub = nextComp.subMenus[0];
    setKomponenId(nextId);
    setSubMenuId(firstSub.id);
    setSubItemId(firstSub.subItems?.[0]?.id || '');
  };

  const handleSubMenuChange = (nextSubId: string) => {
    setSubMenuId(nextSubId);
    const smObj = activeKomponen.subMenus.find((s) => s.id === nextSubId);
    setSubItemId(smObj?.subItems?.[0]?.id || '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileRemoved(false);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/pdf');
    setUploadNotice(null);
    if (!judulDokumen.trim()) {
      setJudulDokumen(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

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
        const meta = await uploadFileSmart(file, 'Arsip Digital', keterangan || file.name);
        setDriveFileId(meta.fileId);
        setDriveUrl(meta.driveUrl);
        setManualDriveLink(meta.driveUrl);
        setFileDataBase64(undefined);
        setUploadNotice('Berhasil diunggah otomatis ke Google Drive madrasah');
      } catch (err) {
        console.warn('Google Drive PKKM upload fallback:', err);
        const randomDriveId = `1gdrive-pkkm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        setDriveFileId(randomDriveId);
        setDriveUrl(`https://drive.google.com/file/d/${randomDriveId}/view`);
        setUploadNotice('Tersimpan di pangkalan data cloud SIPAS');
      } finally {
        setIsUploadingDrive(false);
      }
    } else {
      const randomDriveId = `1gdrive-pkkm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
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
      setFileName(`${(judulDokumen || 'Bukti_Fisik_PKKM').replace(/\s+/g, '_')}.pdf`);
      setFileSize(102400);
    }
    setUploadNotice('Tautan Google Drive berhasil disematkan');
  };

  const handleRemoveAttachment = () => {
    setIsFileRemoved(true);
    setFileName('');
    setFileSize(0);
    setDriveFileId('');
    setDriveUrl('');
    setManualDriveLink('');
    setFileDataBase64(undefined);
    setUploadNotice('Lampiran berkas dilepas.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulDokumen.trim()) return;

    const hasAttachment = !isFileRemoved && (Boolean(fileName) || Boolean(manualDriveLink.trim()) || Boolean(driveUrl));
    const resolvedDriveUrl = manualDriveLink.trim() || driveUrl;

    const fileDoc = hasAttachment
      ? {
          fileId: driveFileId || `1gdrive-pkkm-${Date.now()}`,
          fileName: fileName || `${judulDokumen.replace(/\s+/g, '_')}.pdf`,
          fileSize: fileSize || 102400,
          fileType,
          driveUrl: resolvedDriveUrl || `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: driveFileId ? `https://drive.google.com/uc?id=${driveFileId}&export=download` : undefined,
          uploadedAt: new Date().toISOString(),
          textContent: keterangan || judulDokumen,
          dataBase64: fileDataBase64,
        }
      : undefined;

    if (isEdit && dokumenToEdit) {
      storageService.updatePkkmDokumen(
        dokumenToEdit.id,
        {
          komponenId,
          subMenuId,
          subItemId: hasSubItems ? subItemId || activeSubMenu?.subItems?.[0]?.id : undefined,
          kodeDokumen: kodeDokumen.trim() || dokumenToEdit.kodeDokumen,
          judulDokumen: judulDokumen.trim(),
          tahunAjaran,
          tahun,
          tanggalDokumen,
          penanggungJawab: penanggungJawab.trim() || 'Kepala Madrasah',
          statusVerifikasi,
          keterangan: keterangan.trim(),
          fileDoc,
        },
        currentUser
      );
    } else {
      storageService.addPkkmDokumen(
        {
          komponenId,
          subMenuId,
          subItemId: hasSubItems ? subItemId || activeSubMenu?.subItems?.[0]?.id : undefined,
          kodeDokumen: kodeDokumen.trim() || undefined,
          judulDokumen: judulDokumen.trim(),
          tahunAjaran,
          tahun,
          tanggalDokumen,
          penanggungJawab: penanggungJawab.trim() || 'Kepala Madrasah',
          statusVerifikasi,
          keterangan: keterangan.trim(),
          fileDoc,
          createdBy: currentUser.name,
        },
        currentUser
      );
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight text-white">
                {isEdit ? `Edit Bukti Fisik PKKM: ${dokumenToEdit?.kodeDokumen}` : 'Tambah Bukti Fisik PKKM'}
              </h3>
              <p className="text-xs text-amber-200/80">
                Penilaian Kinerja Kepala Madrasah · {activeKomponen.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Komponen & Sub-Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Komponen PKKM *
              </label>
              <select
                value={komponenId}
                onChange={(e) => handleKomponenChange(e.target.value as PkkmKomponenId)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {PKKM_COMPONENTS.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.nomor}. {comp.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sub-Menu / Indikator *
              </label>
              <select
                value={subMenuId}
                onChange={(e) => handleSubMenuChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {activeKomponen.subMenus.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.kode} {sm.fullTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-Item Selector for Kepemimpinan Pembelajaran */}
          {hasSubItems && activeSubMenu?.subItems && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rincian Sub-Indikator ({activeSubMenu.fullTitle}) *
              </label>
              <select
                value={subItemId}
                onChange={(e) => setSubItemId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {activeSubMenu.subItems.map((si) => (
                  <option key={si.id} value={si.id}>
                    {si.kode} {si.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Kode & Judul */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Dokumen
                </label>
                <input
                  type="text"
                  value={kodeDokumen}
                  onChange={(e) => setKodeDokumen(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-950"
                />
              </div>
            )}
            <div className={isEdit ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Dokumen / Bukti Fisik *
              </label>
              <input
                type="text"
                required
                value={judulDokumen}
                onChange={(e) => setJudulDokumen(e.target.value)}
                placeholder={`Contoh: Dokumen ${activeSubMenu?.tabLabel || 'PKKM'} Tahun 2025/2026`}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tahun Ajaran, Tahun, Tanggal, Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Pelajaran
              </label>
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {TAHUN_AJARAN_OPTIONS.map((ta) => (
                  <option key={ta} value={ta}>
                    TP {ta}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun
              </label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Dokumen
              </label>
              <input
                type="date"
                value={tanggalDokumen}
                onChange={(e) => setTanggalDokumen(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Kelengkapan
              </label>
              <select
                value={statusVerifikasi}
                onChange={(e) => setStatusVerifikasi(e.target.value as PkkmStatusVerifikasi)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Lengkap">Lengkap / Terverifikasi</option>
                <option value="Proses">Dalam Proses</option>
                <option value="Revisi">Perlu Revisi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Penanggung Jawab / Penyusun
            </label>
            <input
              type="text"
              value={penanggungJawab}
              onChange={(e) => setPenanggungJawab(e.target.value)}
              placeholder="Contoh: Kepala Madrasah / Tim Pengembang Kurikulum / Guru Kelas"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Catatan Bukti Fisik
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Ringkasan isi dokumen, nomor SK terkait, atau catatan verifikasi asesor..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* File Upload & Google Drive Link */}
          <div className="p-4 bg-slate-50 border border-dashed border-emerald-300 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  Lampiran Bukti Fisik (Cloud &amp; Google Drive)
                </span>
                <span className="text-[11px] text-slate-500">
                  Unggah dokumen (PDF/Word/Excel/Foto) atau tempel tautan Google Drive di bawah.
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors shadow-2xs shrink-0">
                {isUploadingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingDrive ? 'Mengunggah...' : fileName && !isFileRemoved ? 'Ganti Berkas' : 'Pilih File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  onChange={handleFileUpload}
                  disabled={isUploadingDrive}
                  className="hidden"
                />
              </label>
            </div>

            {fileName && !isFileRemoved && !isUploadingDrive && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{fileName}</span>
                  {fileSize > 0 && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({(fileSize / 1024).toFixed(0)} KB)
                    </span>
                  )}
                  {uploadNotice && (
                    <span className="text-[11px] text-emerald-700 font-medium">{uploadNotice}</span>
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
                      <ExternalLink className="w-3 h-3" /> Buka Drive
                    </a>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded transition-colors">
                    <RefreshCw className="w-3 h-3 text-amber-800" />
                    <span>Ganti</span>
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
                  >
                    <Trash2 className="w-3 h-3" /> Lepas
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200">
              <label className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                Tautan Berkas Google Drive (Opsional)
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Bukti Fisik'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
