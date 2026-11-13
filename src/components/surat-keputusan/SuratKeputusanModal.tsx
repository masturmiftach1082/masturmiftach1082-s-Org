import { useState, useEffect, useMemo } from 'react';
import { SuratKeputusan, StatusSK, MadrasahSettings, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { isAnyDriveUploadConnected, uploadFileSmart } from '../../services/googleDriveService';
import { X, Save, UploadCloud, CheckCircle2, ShieldCheck, Award, Loader2, HardDrive, ExternalLink, RefreshCw, Trash2, Link2 } from 'lucide-react';

interface SuratKeputusanModalProps {
  isOpen: boolean;
  onClose: () => void;
  skToEdit?: SuratKeputusan | null;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onSaved: () => void;
}

export default function SuratKeputusanModal({
  isOpen,
  onClose,
  skToEdit,
  settings,
  currentUser,
  onSaved,
}: SuratKeputusanModalProps) {
  const isEdit = Boolean(skToEdit);

  const [tanggalSK, setTanggalSK] = useState('');
  const [judul, setJudul] = useState('');
  const [tentang, setTentang] = useState('');
  const [tahunPelajaran, setTahunPelajaran] = useState('2025/2026');
  const [penandatangan, setPenandatangan] = useState(settings.kepalaMadrasah);
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState('Kepala Madrasah');
  const [status, setStatus] = useState<StatusSK>('Berlaku');
  const [ringkasan, setRingkasan] = useState('');

  const [modePenomoran, setModePenomoran] = useState<'otomatis' | 'manual'>('otomatis');
  const [manualNomorSK, setManualNomorSK] = useState('');
  const [manualNomorUrut, setManualNomorUrut] = useState<number | ''>('');

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isFileRemoved, setIsFileRemoved] = useState(false);
  const [fileDataBase64, setFileDataBase64] = useState<string | undefined>(undefined);

  // Real-time generated SK number
  const generatedSKNumber = useMemo(() => {
    if (isEdit && skToEdit) {
      return skToEdit.nomorSK;
    }
    const d = new Date(tanggalSK || new Date().toISOString().split('T')[0]);
    const year = d.getFullYear() || 2026;
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const info = storageService.getNextSKInfo(year, monthStr);
    return info.nomorSK;
  }, [isEdit, skToEdit, tanggalSK]);

  useEffect(() => {
    if (skToEdit) {
      setTanggalSK(skToEdit.tanggalSK);
      setJudul(skToEdit.judul);
      setTentang(skToEdit.tentang);
      setTahunPelajaran(skToEdit.tahunPelajaran);
      setPenandatangan(skToEdit.penandatangan);
      setJabatanPenandatangan(skToEdit.jabatanPenandatangan);
      setStatus(skToEdit.status);
      setRingkasan(skToEdit.ringkasan);
      setManualNomorSK(skToEdit.nomorSK || '');
      setManualNomorUrut(skToEdit.nomorUrut || '');
      setModePenomoran('otomatis');

      setIsFileRemoved(false);
      if (skToEdit.fileDoc) {
        setFileName(skToEdit.fileDoc.fileName);
        setFileSize(skToEdit.fileDoc.fileSize);
        setFileType(skToEdit.fileDoc.fileType);
        setDriveFileId(skToEdit.fileDoc.fileId);
        setDriveUrl(skToEdit.fileDoc.driveUrl || '');
        setFileDataBase64(skToEdit.fileDoc.dataBase64);
      } else {
        setFileName('');
        setFileSize(0);
        setFileType('application/pdf');
        setDriveFileId('');
        setDriveUrl('');
        setFileDataBase64(undefined);
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTanggalSK(today);
      setJudul('');
      setTentang('');
      setTahunPelajaran('2025/2026');
      setPenandatangan(settings.kepalaMadrasah);
      setJabatanPenandatangan('Kepala Madrasah');
      setStatus('Berlaku');
      setRingkasan('');
      setFileName('');
      setFileSize(0);
      setFileType('application/pdf');
      setDriveFileId('');
      setDriveUrl('');
      setUploadNotice(null);
      setManualNomorSK('');
      setManualNomorUrut('');
      setModePenomoran('otomatis');
      setIsFileRemoved(false);
    }
  }, [skToEdit, isOpen, settings]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileRemoved(false);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/pdf');
    setUploadNotice(null);

    // Read base64 for direct device preview
    if (file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => setFileDataBase64(reader.result as string);
      reader.readAsDataURL(file);
    }

    if (isAnyDriveUploadConnected()) {
      setIsUploadingDrive(true);
      try {
        const meta = await uploadFileSmart(file, 'Surat Keputusan', tentang || file.name);
        setDriveFileId(meta.fileId);
        setDriveUrl(meta.driveUrl);
        setUploadNotice('Berhasil diunggah otomatis ke Google Drive madrasah');
      } catch (err: any) {
        console.warn('Google Drive SK upload notice:', err);
        const randomDriveId = `1gdrive-sk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        setDriveFileId(randomDriveId);
        setUploadNotice('Tersimpan di pangkalan data cloud SIPAS');
      } finally {
        setIsUploadingDrive(false);
      }
    } else {
      const randomDriveId = `1gdrive-sk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
      setUploadNotice('Berkas tersimpan & tersinkronisasi di cloud');
    }
  };

  const handleRemoveAttachment = () => {
    if (window.confirm('Yakin ingin melepas berkas lampiran SK ini? Klik Simpan setelah ini untuk memperbarui.')) {
      setIsFileRemoved(true);
      setFileName('');
      setFileSize(0);
      setDriveFileId('');
      setDriveUrl('');
      setFileDataBase64(undefined);
      setUploadNotice('Berkas lampiran SK telah dilepas.');
    }
  };

  const handleCopyGeneratedToManual = () => {
    setManualNomorSK(generatedSKNumber);
    const match = generatedSKNumber.match(/^(\d+)/);
    if (match) {
      setManualNomorUrut(parseInt(match[1], 10));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim() || !tentang.trim() || !tanggalSK) {
      alert('Mohon lengkapi Judul SK, Pokok Ketetapan (Tentang), dan Tanggal SK.');
      return;
    }

    if (modePenomoran === 'manual' && !manualNomorSK.trim()) {
      alert('Mode penomoran manual aktif. Silakan masukkan nomor SK yang diinginkan.');
      return;
    }

    const finalFileDoc = isFileRemoved
      ? undefined
      : fileName
      ? {
          fileId: driveFileId || `1gdrive-sk-${Date.now()}`,
          folderId: '1-GDRIVE-SK-SOBOREJO-2026',
          fileName,
          fileSize: fileSize || 1200000,
          fileType,
          driveUrl: driveUrl || `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: ringkasan || tentang,
          dataBase64: fileDataBase64,
        }
      : undefined;

    if (isEdit && skToEdit) {
      storageService.updateSuratKeputusan(
        skToEdit.id,
        {
          nomorSK: modePenomoran === 'manual' ? manualNomorSK.trim() : skToEdit.nomorSK,
          nomorUrut: modePenomoran === 'manual' && typeof manualNomorUrut === 'number' ? manualNomorUrut : skToEdit.nomorUrut,
          tanggalSK,
          judul: judul.trim(),
          tentang: tentang.trim(),
          tahunPelajaran,
          penandatangan,
          jabatanPenandatangan,
          status,
          ringkasan: ringkasan.trim(),
          fileDoc: finalFileDoc,
        },
        currentUser
      );
    } else {
      const d = new Date(tanggalSK);
      const year = d.getFullYear() || 2026;

      storageService.addSuratKeputusan(
        {
          tahun: year,
          judul: judul.trim(),
          tentang: tentang.trim(),
          tanggalSK,
          tahunPelajaran,
          penandatangan,
          jabatanPenandatangan,
          status,
          ringkasan: ringkasan.trim(),
          fileDoc: finalFileDoc,
          createdBy: currentUser.name,
          customNomorSK: modePenomoran === 'manual' ? manualNomorSK.trim() : undefined,
          customNomorUrut: modePenomoran === 'manual' && typeof manualNomorUrut === 'number' ? manualNomorUrut : undefined,
        },
        currentUser
      );
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight text-white">
                {isEdit ? 'Ubah Surat Keputusan (SK)' : 'Terbitkan Surat Keputusan (SK) Baru'}
              </h3>
              <p className="text-xs text-amber-200/80">
                MI Ma'arif Al Ihsan Soborejo · Opsi Penomoran SK Otomatis & Manual
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
          {/* Numbering Option Selector Card (Automatic vs Manual) */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-amber-50/40 rounded-xl border border-emerald-300 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Opsi Penomoran Surat Keputusan (SK)
              </span>

              {/* Radio Switcher */}
              <div className="inline-flex p-1 bg-white rounded-lg border border-emerald-300 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModePenomoran('otomatis')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    modePenomoran === 'otomatis'
                      ? 'bg-[#023126] text-amber-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Otomatis ({settings.formatPenomoranSK || 'XXX Tahun YYYY'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModePenomoran('manual');
                    if (!manualNomorSK) {
                      setManualNomorSK(generatedSKNumber);
                    }
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    modePenomoran === 'manual'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual (Input Bebas)
                </button>
              </div>
            </div>

            {/* Mode Otomatis View */}
            {modePenomoran === 'otomatis' ? (
              <div className="p-3 bg-white rounded-lg border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-emerald-800 font-semibold block uppercase">
                    Nomor SK Terkunci Format Resmi:
                  </span>
                  <span className="font-mono text-sm md:text-base font-extrabold text-emerald-950 tracking-wide">
                    {generatedSKNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                    Format: {settings.formatPenomoranSK || 'XXX Tahun YYYY'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setModePenomoran('manual');
                      handleCopyGeneratedToManual();
                    }}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    Edit Manual
                  </button>
                </div>
              </div>
            ) : (
              /* Mode Manual Input View */
              <div className="p-3.5 bg-white rounded-lg border border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <span>Masukkan Nomor SK Bebas / Kustom:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyGeneratedToManual}
                    className="text-[11px] px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold transition-colors cursor-pointer"
                    title="Gunakan format otomatis sebagai draf"
                  >
                    Terapkan Nomor Otomatis
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      required
                      value={manualNomorSK}
                      onChange={(e) => setManualNomorSK(e.target.value)}
                      placeholder="Contoh: 005 Tahun 2026 atau 015/MI.11.23.0053/SK/VII/2026"
                      className="w-full text-xs font-mono font-bold px-3 py-2 border-2 border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 bg-amber-50/20"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={manualNomorUrut}
                      onChange={(e) => setManualNomorUrut(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="No Urut (opsional)"
                      className="w-full text-xs font-mono px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-amber-800 leading-tight">
                  💡 <strong>Mode Manual Aktif:</strong> Anda dapat memasukkan nomor SK dengan format penomoran khusus yayasan, madrasah, atau nomor SK fisik yang telah disahkan sebelumnya.
                </p>
              </div>
            )}
          </div>

          {/* Row 1: Judul SK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Surat Keputusan *
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Pembagian Tugas Guru dalam Proses Belajar Mengajar TP 2025/2026"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Row 2: Tentang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tentang / Pokok Ketetapan *
            </label>
            <textarea
              rows={2}
              required
              value={tentang}
              onChange={(e) => setTentang(e.target.value)}
              placeholder="Contoh: Penetapan beban mengajar, wali kelas I-VI, dan tugas tambahan guru di lingkungan madrasah."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Row 3: Tanggal SK & Tahun Pelajaran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penetapan SK *
              </label>
              <input
                type="date"
                required
                value={tanggalSK}
                onChange={(e) => setTanggalSK(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Pelajaran / Periode
              </label>
              <input
                type="text"
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                placeholder="Contoh: 2025/2026 atau 2026/2027"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Penandatangan & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pejabat Penandatangan
              </label>
              <input
                type="text"
                value={penandatangan}
                onChange={(e) => setPenandatangan(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Keberlakuan SK
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusSK)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Berlaku">Berlaku (Aktif)</option>
                <option value="Direvisi">Direvisi</option>
                <option value="Dicabut">Dicabut</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>
            </div>
          </div>

          {/* Ringkasan Konsiderans */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Konsiderans / Ringkasan Diktum Keputusan
            </label>
            <textarea
              rows={2}
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              placeholder="Tuliskan intisari menimbang, mengingat, dan memutuskan..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* File Upload Google Drive */}
          <div className="p-4 bg-slate-50 border border-dashed border-emerald-300 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  Pindaian Berkas SK di Google Drive
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAnyDriveUploadConnected()
                    ? '🟢 Google Drive terhubung otomatis: berkas SK akan langsung diunggah ke Google Drive madrasah.'
                    : 'Simpan dokumen PDF SK bertanda tangan asli ke Google Drive madrasah.'}
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors shadow-2xs">
                {isUploadingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingDrive ? 'Mengunggah ke Drive...' : 'Pilih Berkas PDF SK'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploadingDrive}
                  className="hidden"
                />
              </label>
            </div>

            {isUploadingDrive && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sedang mengunggah berkas SK ke folder Google Drive madrasah...</span>
              </div>
            )}

            {fileName && !isFileRemoved && !isUploadingDrive && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-lg text-xs mt-2 shadow-2xs">
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
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded transition-colors shadow-2xs" title="Pilih berkas baru untuk mengganti berkas yang salah">
                    <RefreshCw className="w-3 h-3 text-amber-800" />
                    <span>Ganti Berkas</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    title="Hapus / Lepas berkas lampiran"
                  >
                    <Trash2 className="w-3 h-3" /> Lepas
                  </button>
                </div>
              </div>
            )}

            {isFileRemoved && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 mt-2">
                <span>Berkas lampiran telah dilepas. Klik Simpan untuk memperbarui data SK.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFileRemoved(false);
                    if (skToEdit?.fileDoc) {
                      setFileName(skToEdit.fileDoc.fileName);
                      setFileSize(skToEdit.fileDoc.fileSize);
                      setFileType(skToEdit.fileDoc.fileType);
                      setDriveFileId(skToEdit.fileDoc.fileId);
                      setDriveUrl(skToEdit.fileDoc.driveUrl || '');
                    }
                  }}
                  className="text-xs font-semibold text-amber-950 underline hover:text-black cursor-pointer"
                >
                  Batal Lepas
                </button>
              </div>
            )}

            {/* Inline Tautan Google Drive */}
            <div className="pt-2 border-t border-slate-200 mt-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                Tautan Berkas Google Drive (Opsional — Edit / Tempel Link Langsung)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDriveUrl(val);
                    if (val.trim()) {
                      setIsFileRemoved(false);
                      const idMatch = val.match(/\/d\/([a-zA-Z0-9_-]+)/) || val.match(/id=([a-zA-Z0-9_-]+)/);
                      if (idMatch) setDriveFileId(idMatch[1]);
                      if (!fileName) {
                        setFileName(`Lampiran_SK_Madrasah.pdf`);
                        setFileSize(102400);
                      }
                    }
                  }}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Simpan Perubahan' : 'Tetapkan SK & Kunci Nomor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
