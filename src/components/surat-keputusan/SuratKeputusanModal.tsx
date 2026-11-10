import { useState, useEffect, useMemo } from 'react';
import { SuratKeputusan, StatusSK, MadrasahSettings, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { X, Save, UploadCloud, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

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

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');

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

      if (skToEdit.fileDoc) {
        setFileName(skToEdit.fileDoc.fileName);
        setFileSize(skToEdit.fileDoc.fileSize);
        setFileType(skToEdit.fileDoc.fileType);
        setDriveFileId(skToEdit.fileDoc.fileId);
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
    }
  }, [skToEdit, isOpen, settings]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type || 'application/pdf');
      const randomDriveId = `1gdrive-sk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim() || !tentang.trim() || !tanggalSK) {
      alert('Mohon lengkapi Judul SK, Pokok Ketetapan (Tentang), dan Tanggal SK.');
      return;
    }

    const fileDoc = fileName
      ? {
          fileId: driveFileId || `1gdrive-sk-${Date.now()}`,
          folderId: '1-GDRIVE-SK-SOBOREJO-2026',
          fileName,
          fileSize: fileSize || 1200000,
          fileType,
          driveUrl: `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: ringkasan || tentang,
        }
      : undefined;

    if (isEdit && skToEdit) {
      storageService.updateSuratKeputusan(
        skToEdit.id,
        {
          tanggalSK,
          judul: judul.trim(),
          tentang: tentang.trim(),
          tahunPelajaran,
          penandatangan,
          jabatanPenandatangan,
          status,
          ringkasan: ringkasan.trim(),
          fileDoc: fileDoc || skToEdit.fileDoc,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight">
                {isEdit ? 'Ubah Surat Keputusan (SK)' : 'Terbitkan Surat Keputusan (SK) Baru'}
              </h3>
              <p className="text-xs text-emerald-200">
                MI Ma'arif Al Ihsan Soborejo · Penetapan Regulasi dan Keputusan Resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Automatic SK Number Display */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Nomor Surat Keputusan (SK) Resmi
              </span>
              <span className="text-[11px] text-emerald-800 italic">
                {isEdit ? 'Nomor SK permanen' : 'Format SK Kepala Madrasah'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-emerald-300 flex items-center justify-between">
              <span className="font-mono text-sm md:text-base font-extrabold text-emerald-900 tracking-wide">
                {generatedSKNumber}
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                Format: {settings.formatPenomoranSK || 'XXX Tahun YYYY'}
              </span>
            </div>
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
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Pindaian Berkas SK di Google Drive
                </span>
                <span className="text-[11px] text-slate-500">
                  Simpan dokumen PDF SK bertanda tangan asli ke Google Drive madrasah.
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih Berkas PDF SK</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {fileName && (
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded text-xs mt-2">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{fileName}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({(fileSize / 1024).toFixed(0)} KB)
                  </span>
                </div>
                {driveFileId && (
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    ID: {driveFileId.slice(0, 16)}...
                  </span>
                )}
              </div>
            )}
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
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
