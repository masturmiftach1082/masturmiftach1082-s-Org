import { useState, useEffect } from 'react';
import { SuratMasuk, SifatSurat, StatusSuratMasuk, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { X, Save, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

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
  const [isSimulatedUpload, setIsSimulatedUpload] = useState(false);

  useEffect(() => {
    if (suratToEdit) {
      setNomorAgendaPreview(suratToEdit.nomorAgenda);
      setTahunAgenda(suratToEdit.tahunAgenda);
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

      if (suratToEdit.fileDoc) {
        setFileName(suratToEdit.fileDoc.fileName);
        setFileSize(suratToEdit.fileDoc.fileSize);
        setFileType(suratToEdit.fileDoc.fileType);
        setDriveFileId(suratToEdit.fileDoc.fileId);
      }
    } else {
      // Calculate next agenda number for current year
      const currentYear = new Date().getFullYear();
      const nextAgenda = storageService.getNextAgendaSuratMasuk(currentYear);
      setNomorAgendaPreview(nextAgenda);
      setTahunAgenda(currentYear);
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
      setIsSimulatedUpload(false);
    }
  }, [suratToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type || 'application/pdf');
      // Generate realistic Google Drive File ID representation
      const randomDriveId = `1gdrive-in-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
      setIsSimulatedUpload(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomorSuratPengirim.trim() || !pengirim.trim() || !perihal.trim()) {
      alert('Mohon lengkapi Nomor Surat Pengirim, Pengirim, dan Perihal.');
      return;
    }

    const fileDoc = fileName
      ? {
          fileId: driveFileId || `1gdrive-file-${Date.now()}`,
          folderId: '1-GDRIVE-INCOMING-SOBOREJO-2026',
          fileName,
          fileSize: fileSize || 850000,
          fileType,
          driveUrl: `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: ringkasan || perihal,
        }
      : undefined;

    if (isEdit && suratToEdit) {
      storageService.updateSuratMasuk(
        suratToEdit.id,
        {
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
          fileDoc: fileDoc || suratToEdit.fileDoc,
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
                MI Ma'arif Al Ihsan Soborejo · Sistem Penomoran Agenda Terintegrasi
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
          {/* Agenda Number Lock Banner */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-900">Nomor Agenda Otomatis:</span>
              <span className="font-mono font-bold text-sm text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-emerald-300">
                #{nomorAgendaPreview} / {tahunAgenda}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 italic">
              {isEdit ? 'Nomor agenda permanen (tidak berubah saat edit)' : 'Nomor berurutan & unik per tahun'}
            </span>
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
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Penyimpanan Google Drive (Arsip Digital)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dokumen disimpan aman di Google Drive madrasah, hanya metadata tersinkronisasi.
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih Berkas PDF / Gambar</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Simpan Perubahan' : 'Daftarkan Surat Masuk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
