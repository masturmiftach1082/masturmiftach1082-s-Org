import { useState } from 'react';
import { ArsipDigital, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { X, Save, UploadCloud, CheckCircle2, Archive } from 'lucide-react';

interface ArsipDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  currentUser,
  onSaved,
}: ArsipDigitalModalProps) {
  const [judulArsip, setJudulArsip] = useState('');
  const [kategori, setKategori] = useState(KATEGORI_ARSIP[0]);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [nomorDokumenTerait, setNomorDokumenTerait] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [lokasiFisik, setLokasiFisik] = useState('Lemari Arsip TU');

  // File
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type || 'application/pdf');
      const randomDriveId = `1gdrive-arc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
      if (!judulArsip) {
        setJudulArsip(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
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

    const code = `ARS-${kategori.substring(0, 3).toUpperCase()}-${tahun}-${Math.floor(100 + Math.random() * 900)}`;

    const fileDoc = {
      fileId: driveFileId || `1gdrive-arc-${Date.now()}`,
      folderId: '1-GDRIVE-ARCHIVE-SOBOREJO-2026',
      fileName: fileName || `${judulArsip.replace(/\s+/g, '_')}.pdf`,
      fileSize: fileSize || 1500000,
      fileType,
      driveUrl: `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
      downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
      uploadedAt: new Date().toISOString(),
      textContent: deskripsi || judulArsip,
    };

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
                Simpan Arsip Digital Baru
              </h3>
              <p className="text-xs text-amber-200/80">
                Penyimpanan berkas madrasah terintegrasi Google Drive Cloud
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
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

          {/* Upload Dokumen Google Drive */}
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Unggah File Berkas ke Google Drive
                </span>
                <span className="text-[11px] text-slate-500">
                  File disimpan pada cloud drive madrasah, aman dan tidak membebani database.
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih File</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
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
                    Drive ID: {driveFileId.slice(0, 16)}...
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              <span>Simpan ke Arsip Digital</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
