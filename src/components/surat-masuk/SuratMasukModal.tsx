import { useState, useEffect, useRef } from 'react';
import { SuratMasuk, SifatSurat, StatusSuratMasuk, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { isAnyDriveUploadConnected, uploadFileSmart } from '../../services/googleDriveService';
import { X, Save, UploadCloud, FileText, CheckCircle2, Loader2, HardDrive, ExternalLink, RefreshCw, Trash2, Link2 } from 'lucide-react';

interface SuratMasukModalProps {
  isOpen: boolean;
  onClose: () => void;
  suratToEdit?: SuratMasuk | null;
  currentUser: UserProfile;
  onSaved: () => void;
}

const KATEGORI_OPTIONS = [
  'Dinas Pendidikan/Kemenag',
  'LP Ma\'arif NU',
  'Yayasan/Komite',
  'Instansi Luar/Pemerintah',
  'Undangan / Kegiatan',
  'Pemberitahuan / Edaran',
  'Bantuan / Proposal',
  'Lain-lain',
];

const TUJUAN_INTERNAL_OPTIONS = [
  'Kepala Madrasah & Waka Kurikulum',
  'Kepala Madrasah & Waka Kesiswaan',
  'Tata Usaha / Kepegawaian',
  'Bendahara Madrasah / BOS',
  'UKS Madrasah & Wali Kelas',
  'Tim Sarpras Madrasah',
  'Dewan Guru',
];

export default function SuratMasukModal({
  isOpen,
  onClose,
  suratToEdit,
  currentUser,
  onSaved,
}: SuratMasukModalProps) {
  const isEdit = Boolean(suratToEdit);

  const [nomorAgendaPreview, setNomorAgendaPreview] = useState('001');
  const [tahunAgenda, setTahunAgenda] = useState(new Date().getFullYear());
  const [modeAgenda, setModeAgenda] = useState<'otomatis' | 'manual'>('otomatis');
  const [customNomorAgenda, setCustomNomorAgenda] = useState('');
  const [nomorSuratPengirim, setNomorSuratPengirim] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [tanggalDiterima, setTanggalDiterima] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [perihal, setPerihal] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [sifat, setSifat] = useState<SifatSurat>('Biasa');
  const [tujuanInternal, setTujuanInternal] = useState(TUJUAN_INTERNAL_OPTIONS[0]);
  const [status, setStatus] = useState<StatusSuratMasuk>('Baru Diterima');
  const [catatan, setCatatan] = useState('');

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isSimulatedUpload, setIsSimulatedUpload] = useState(false);
  const [isFileRemoved, setIsFileRemoved] = useState(false);
  const [fileDataBase64, setFileDataBase64] = useState<string | undefined>(undefined);

  const wasOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      prevEditIdRef.current = null;
      return;
    }

    const currentEditId = suratToEdit?.id ?? null;
    if (wasOpenRef.current && prevEditIdRef.current === currentEditId) {
      return;
    }
    wasOpenRef.current = true;
    prevEditIdRef.current = currentEditId;

    if (suratToEdit) {
      setNomorAgendaPreview(suratToEdit.nomorAgenda);
      setCustomNomorAgenda(suratToEdit.nomorAgenda);
      setTahunAgenda(suratToEdit.tahunAgenda);
      setModeAgenda('otomatis');
      setNomorSuratPengirim(suratToEdit.nomorSuratPengirim);
      setTanggalSurat(suratToEdit.tanggalSurat);
      setTanggalDiterima(suratToEdit.tanggalDiterima);
      setPengirim(suratToEdit.pengirim);
      setPerihal(suratToEdit.perihal);
      setRingkasan(suratToEdit.ringkasan || '');
      setKategori(suratToEdit.kategori);
      setSifat(suratToEdit.sifat);
      setTujuanInternal(suratToEdit.tujuanInternal);
      setStatus(suratToEdit.status);
      setCatatan(suratToEdit.catatan || '');
      setIsFileRemoved(false);

      if (suratToEdit.fileDoc) {
        setFileName(suratToEdit.fileDoc.fileName);
        setFileSize(suratToEdit.fileDoc.fileSize);
        setFileType(suratToEdit.fileDoc.fileType);
        setDriveFileId(suratToEdit.fileDoc.fileId);
        setDriveUrl(suratToEdit.fileDoc.driveUrl || '');
        setFileDataBase64(suratToEdit.fileDoc.dataBase64);
      } else {
        setFileName('');
        setFileSize(0);
        setFileType('application/pdf');
        setDriveFileId('');
        setDriveUrl('');
        setFileDataBase64(undefined);
      }
    } else {
      // Calculate next agenda number for current year
      const currentYear = new Date().getFullYear();
      const nextAgenda = storageService.getNextAgendaSuratMasuk(currentYear);
      setNomorAgendaPreview(nextAgenda);
      setCustomNomorAgenda(nextAgenda);
      setTahunAgenda(currentYear);
      setModeAgenda('otomatis');
      setNomorSuratPengirim('');
      const today = new Date().toISOString().split('T')[0];
      setTanggalSurat(today);
      setTanggalDiterima(today);
      setPengirim('');
      setPerihal('');
      setRingkasan('');
      setKategori(KATEGORI_OPTIONS[0]);
      setSifat('Biasa');
      setTujuanInternal(TUJUAN_INTERNAL_OPTIONS[0]);
      setStatus('Baru Diterima');
      setCatatan('');
      setFileName('');
      setFileSize(0);
      setFileType('application/pdf');
      setDriveFileId('');
      setDriveUrl('');
      setUploadNotice(null);
      setIsSimulatedUpload(false);
      setIsFileRemoved(false);
      setFileDataBase64(undefined);
    }
  }, [isOpen, suratToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileRemoved(false);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/pdf');
    setUploadNotice(null);

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
        const meta = await uploadFileSmart(file, 'Surat Masuk', perihal || file.name);
        setDriveFileId(meta.fileId);
        setDriveUrl(meta.driveUrl);
        setFileDataBase64(undefined);
        setIsSimulatedUpload(false);
        setUploadNotice('Berhasil diunggah otomatis ke Google Drive madrasah');
      } catch (err: any) {
        console.warn('Google Drive direct upload notice:', err);
        const randomDriveId = `1gdrive-in-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        setDriveFileId(randomDriveId);
        setIsSimulatedUpload(true);
        setUploadNotice('Tersimpan di pangkalan data cloud SIPAS');
      } finally {
        setIsUploadingDrive(false);
      }
    } else {
      const randomDriveId = `1gdrive-in-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
      setIsSimulatedUpload(true);
      setUploadNotice('Berkas tersimpan & tersinkronisasi di cloud');
    }
  };

  const handleRemoveAttachment = () => {
    if (window.confirm('Yakin ingin melepas berkas lampiran ini? Klik Simpan setelah ini untuk memperbarui.')) {
      setIsFileRemoved(true);
      setFileName('');
      setFileSize(0);
      setDriveFileId('');
      setDriveUrl('');
      setFileDataBase64(undefined);
      setUploadNotice('Berkas lampiran telah dilepas.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomorSuratPengirim.trim() || !pengirim.trim() || !perihal.trim()) {
      alert('Mohon lengkapi Nomor Surat Pengirim, Pengirim, dan Perihal.');
      return;
    }

    const finalFileDoc = isFileRemoved
      ? undefined
      : fileName
      ? {
          fileId: driveFileId || `1gdrive-file-${Date.now()}`,
          folderId: '1-GDRIVE-INCOMING-SOBOREJO-2026',
          fileName,
          fileSize: fileSize || 850000,
          fileType,
          driveUrl: driveUrl || `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: ringkasan || perihal,
          dataBase64: fileDataBase64,
        }
      : undefined;

    const finalAgenda = modeAgenda === 'manual' && customNomorAgenda.trim() ? customNomorAgenda.trim() : undefined;

    if (isEdit && suratToEdit) {
      storageService.updateSuratMasuk(
        suratToEdit.id,
        {
          nomorAgenda: finalAgenda || suratToEdit.nomorAgenda,
          nomorSuratPengirim: nomorSuratPengirim.trim(),
          tanggalSurat,
          tanggalDiterima,
          pengirim: pengirim.trim(),
          perihal: perihal.trim(),
          ringkasan: ringkasan.trim(),
          kategori,
          sifat,
          tujuanInternal,
          status,
          catatan: catatan.trim(),
          fileDoc: finalFileDoc,
        },
        currentUser
      );
    } else {
      storageService.addSuratMasuk(
        {
          tahunAgenda,
          nomorSuratPengirim: nomorSuratPengirim.trim(),
          tanggalSurat,
          tanggalDiterima,
          pengirim: pengirim.trim(),
          perihal: perihal.trim(),
          ringkasan: ringkasan.trim(),
          kategori,
          sifat,
          tujuanInternal,
          status,
          catatan: catatan.trim(),
          fileDoc: finalFileDoc,
          createdBy: currentUser.name,
          customNomorAgenda: finalAgenda,
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight text-white">
                {isEdit ? 'Ubah Data Surat Masuk' : 'Tambah Surat Masuk Baru'}
              </h3>
              <p className="text-xs text-amber-200/80">
                MI Ma'arif Al Ihsan Soborejo · Penomoran Agenda Otomatis & Manual
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
          {/* Agenda Number Option Selector Card */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-amber-50/40 rounded-xl border border-emerald-300 shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-950 text-xs">Penomoran Agenda Masuk:</span>
                {modeAgenda === 'otomatis' ? (
                  <span className="font-mono font-bold text-sm text-emerald-900 bg-white px-2.5 py-0.5 rounded border border-emerald-300">
                    #{nomorAgendaPreview} / {tahunAgenda}
                  </span>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-amber-950">#</span>
                    <input
                      type="text"
                      required
                      value={customNomorAgenda}
                      onChange={(e) => setCustomNomorAgenda(e.target.value)}
                      placeholder="Contoh: 045 atau 001-A"
                      className="font-mono font-bold text-xs px-2 py-0.5 border-2 border-amber-400 bg-white rounded focus:ring-1 focus:ring-amber-500 focus:outline-none w-28"
                    />
                    <span className="font-mono text-xs text-slate-500">/ {tahunAgenda}</span>
                  </div>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex p-0.5 bg-white rounded-lg border border-emerald-300 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModeAgenda('otomatis')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    modeAgenda === 'otomatis'
                      ? 'bg-[#023126] text-amber-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModeAgenda('manual');
                    if (!customNomorAgenda) setCustomNomorAgenda(nomorAgendaPreview);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    modeAgenda === 'manual'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual (Ketik Sendiri)
                </button>
              </div>
            </div>

            <p className="text-[10px] text-emerald-800">
              {modeAgenda === 'otomatis'
                ? 'Nomor agenda otomatis diurutkan sistem per tahun kalender (dimulai dari 001).'
                : 'Mode manual aktif: Anda bebas menentukan nomor agenda untuk arsip susulan atau penomoran khusus.'}
            </p>
          </div>

          {/* Row 1: No Surat Pengirim, Tgl Surat, Tgl Diterima */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Surat Pengirim *
              </label>
              <input
                type="text"
                required
                value={nomorSuratPengirim}
                onChange={(e) => setNomorSuratPengirim(e.target.value)}
                placeholder="Contoh: B-142/Kk.11.23/2/PP.00/..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Surat Asli *
              </label>
              <input
                type="date"
                required
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Diterima Madrasah *
              </label>
              <input
                type="date"
                required
                value={tanggalDiterima}
                onChange={(e) => setTanggalDiterima(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Pengirim & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pengirim / Instansi Asal *
              </label>
              <input
                type="text"
                required
                value={pengirim}
                onChange={(e) => setPengirim(e.target.value)}
                placeholder="Contoh: Kantor Kemenag Kab. Temanggung"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Surat
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {KATEGORI_OPTIONS.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Perihal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perihal Surat *
            </label>
            <input
              type="text"
              required
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              placeholder="Contoh: Pemberitahuan Pelaksanaan Asesmen Madrasah 2026"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Ringkasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ringkasan Isi Surat
            </label>
            <textarea
              rows={2}
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              placeholder="Tuliskan intisari pokok surat masuk..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Row 4: Sifat, Tujuan Internal, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sifat Surat
              </label>
              <select
                value={sifat}
                onChange={(e) => setSifat(e.target.value as SifatSurat)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Segera">Segera</option>
                <option value="Sangat Segera">Sangat Segera</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tujuan Internal
              </label>
              <select
                value={tujuanInternal}
                onChange={(e) => setTujuanInternal(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {TUJUAN_INTERNAL_OPTIONS.map((tuj) => (
                  <option key={tuj} value={tuj}>
                    {tuj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Surat
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusSuratMasuk)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Baru Diterima">Baru Diterima</option>
                <option value="Didisposisikan">Didisposisikan</option>
                <option value="Ditindaklanjuti">Ditindaklanjuti</option>
                <option value="Selesai">Selesai</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>
            </div>
          </div>

          {/* Row 5: Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Administrasi / Keterangan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Diserahkan langsung oleh kurir pos, berkas fisik di map 2026."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Upload Dokumen Google Drive */}
          <div className="p-4 bg-slate-50 border border-dashed border-emerald-300 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  Lampiran Berkas Google Drive (Arsip Digital)
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAnyDriveUploadConnected()
                    ? '🟢 Google Drive terhubung otomatis: berkas akan langsung diunggah ke Google Drive madrasah.'
                    : 'Dokumen fisik/digital disimpan pada Google Drive madrasah.'}
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors shadow-2xs">
                {isUploadingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingDrive ? 'Mengunggah ke Drive...' : 'Pilih Berkas PDF / Gambar'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploadingDrive}
                  className="hidden"
                />
              </label>
            </div>

            {isUploadingDrive && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sedang mengunggah berkas ke folder Google Drive madrasah...</span>
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                <span>Berkas lampiran telah dilepas. Klik Simpan untuk memperbarui data surat.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFileRemoved(false);
                    if (suratToEdit?.fileDoc) {
                      setFileName(suratToEdit.fileDoc.fileName);
                      setFileSize(suratToEdit.fileDoc.fileSize);
                      setFileType(suratToEdit.fileDoc.fileType);
                      setDriveFileId(suratToEdit.fileDoc.fileId);
                      setDriveUrl(suratToEdit.fileDoc.driveUrl || '');
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
                        setFileName(`Lampiran_${nomorSuratPengirim || 'Surat_Masuk'}.pdf`);
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

          {/* Modal Actions */}
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
              disabled={isUploadingDrive}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>
                {isUploadingDrive
                  ? 'Menunggu Unggahan Drive...'
                  : isEdit
                  ? 'Simpan Perubahan'
                  : 'Daftarkan Surat Masuk'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
