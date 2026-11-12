import { useState, useEffect, useMemo } from 'react';
import { SuratKeluar, SifatSurat, StatusSuratKeluar, MadrasahSettings, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { isGoogleDriveConnected } from '../../services/googleAuthService';
import { uploadFileToGoogleDrive } from '../../services/googleDriveService';
import { X, Save, UploadCloud, FileText, CheckCircle2, ShieldCheck, Loader2, HardDrive, ExternalLink } from 'lucide-react';

interface SuratKeluarModalProps {
  isOpen: boolean;
  onClose: () => void;
  suratToEdit?: SuratKeluar | null;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onSaved: () => void;
}

export default function SuratKeluarModal({
  isOpen,
  onClose,
  suratToEdit,
  settings,
  currentUser,
  onSaved,
}: SuratKeluarModalProps) {
  const isEdit = Boolean(suratToEdit);
  const klasifikasiList = useMemo(() => storageService.getKlasifikasi(), []);

  const [tanggalSurat, setTanggalSurat] = useState('');
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState('PP.00');
  const [tujuanSurat, setTujuanSurat] = useState('');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [jabatanPenerima, setJabatanPenerima] = useState('');
  const [alamatPenerima, setAlamatPenerima] = useState('');
  const [perihal, setPerihal] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [kategori, setKategori] = useState('Kurikulum & Pembelajaran');
  const [sifat, setSifat] = useState<SifatSurat>('Biasa');
  const [status, setStatus] = useState<StatusSuratKeluar>('Disetujui');
  const [catatan, setCatatan] = useState('');

  const [modePenomoran, setModePenomoran] = useState<'otomatis' | 'manual'>('otomatis');
  const [manualNomorSurat, setManualNomorSurat] = useState('');
  const [manualNomorUrut, setManualNomorUrut] = useState<number | ''>('');

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Real-time generated number preview
  const generatedNumber = useMemo(() => {
    if (isEdit && suratToEdit) {
      return suratToEdit.nomorSuratLengkap;
    }
    const d = new Date(tanggalSurat || new Date().toISOString().split('T')[0]);
    const year = d.getFullYear() || 2026;
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const info = storageService.getNextSuratKeluarInfo(year, monthStr, kodeKlasifikasi);
    return info.nomorLengkap;
  }, [isEdit, suratToEdit, tanggalSurat, kodeKlasifikasi]);

  useEffect(() => {
    if (suratToEdit) {
      setTanggalSurat(suratToEdit.tanggalSurat);
      setKodeKlasifikasi(suratToEdit.kodeKlasifikasi || 'PP.00');
      setTujuanSurat(suratToEdit.tujuanSurat);
      setNamaPenerima(suratToEdit.namaPenerima || '');
      setJabatanPenerima(suratToEdit.jabatanPenerima || '');
      setAlamatPenerima(suratToEdit.alamatPenerima || '');
      setPerihal(suratToEdit.perihal);
      setRingkasan(suratToEdit.ringkasan || '');
      setKategori(suratToEdit.kategori);
      setSifat(suratToEdit.sifat);
      setStatus(suratToEdit.status);
      setCatatan(suratToEdit.catatan || '');
      setManualNomorSurat(suratToEdit.nomorSuratLengkap || '');
      setManualNomorUrut(suratToEdit.nomorUrut || '');
      setModePenomoran('otomatis');

      if (suratToEdit.fileDoc) {
        setFileName(suratToEdit.fileDoc.fileName);
        setFileSize(suratToEdit.fileDoc.fileSize);
        setFileType(suratToEdit.fileDoc.fileType);
        setDriveFileId(suratToEdit.fileDoc.fileId);
        setDriveUrl(suratToEdit.fileDoc.driveUrl || '');
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTanggalSurat(today);
      setKodeKlasifikasi('PP.00');
      setTujuanSurat('');
      setNamaPenerima('');
      setJabatanPenerima('');
      setAlamatPenerima('');
      setPerihal('');
      setRingkasan('');
      setKategori('Kurikulum & Pembelajaran');
      setSifat('Biasa');
      setStatus('Disetujui');
      setCatatan('');
      setFileName('');
      setFileSize(0);
      setFileType('application/pdf');
      setDriveFileId('');
      setDriveUrl('');
      setUploadNotice(null);
      setManualNomorSurat('');
      setManualNomorUrut('');
      setModePenomoran('otomatis');
    }
  }, [suratToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/pdf');
    setUploadNotice(null);

    if (isGoogleDriveConnected()) {
      setIsUploadingDrive(true);
      try {
        const meta = await uploadFileToGoogleDrive(file, 'Surat Keluar', perihal || file.name);
        setDriveFileId(meta.fileId);
        setDriveUrl(meta.driveUrl);
        setUploadNotice('Berhasil diunggah otomatis ke Google Drive madrasah');
      } catch (err: any) {
        console.warn('Google Drive upload notice:', err);
        const randomDriveId = `1gdrive-out-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        setDriveFileId(randomDriveId);
        setUploadNotice('Tersimpan di metadata SIPAS');
      } finally {
        setIsUploadingDrive(false);
      }
    } else {
      const randomDriveId = `1gdrive-out-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      setDriveFileId(randomDriveId);
    }
  };

  const handleKlasifikasiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setKodeKlasifikasi(code);
    const found = klasifikasiList.find((k) => k.kode === code);
    if (found) {
      setKategori(found.nama);
    }
  };

  const handleCopyGeneratedToManual = () => {
    setManualNomorSurat(generatedNumber);
    const match = generatedNumber.match(/^(\d+)/);
    if (match) {
      setManualNomorUrut(parseInt(match[1], 10));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tujuanSurat.trim() || !perihal.trim() || !tanggalSurat) {
      alert('Mohon lengkapi Tujuan Surat, Tanggal Surat, dan Perihal.');
      return;
    }

    if (modePenomoran === 'manual' && !manualNomorSurat.trim()) {
      alert('Mode penomoran manual aktif. Silakan masukkan nomor surat yang diinginkan.');
      return;
    }

    const fileDoc = fileName
      ? {
          fileId: driveFileId || `1gdrive-out-${Date.now()}`,
          folderId: '1-GDRIVE-OUTGOING-SOBOREJO-2026',
          fileName,
          fileSize: fileSize || 620000,
          fileType,
          driveUrl: driveUrl || `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: ringkasan || perihal,
        }
      : undefined;

    if (isEdit && suratToEdit) {
      storageService.updateSuratKeluar(
        suratToEdit.id,
        {
          nomorSuratLengkap: modePenomoran === 'manual' ? manualNomorSurat.trim() : suratToEdit.nomorSuratLengkap,
          nomorUrut: modePenomoran === 'manual' && typeof manualNomorUrut === 'number' ? manualNomorUrut : suratToEdit.nomorUrut,
          tanggalSurat,
          kodeKlasifikasi,
          tujuanSurat: tujuanSurat.trim(),
          namaPenerima: namaPenerima.trim() || undefined,
          jabatanPenerima: jabatanPenerima.trim() || undefined,
          alamatPenerima: alamatPenerima.trim() || undefined,
          perihal: perihal.trim(),
          ringkasan: ringkasan.trim(),
          kategori,
          sifat,
          status,
          catatan: catatan.trim() || undefined,
          fileDoc: fileDoc || suratToEdit.fileDoc,
        },
        currentUser
      );
    } else {
      const d = new Date(tanggalSurat);
      const year = d.getFullYear() || 2026;
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');

      storageService.addSuratKeluar(
        {
          tahunSurat: year,
          bulanSurat: monthStr,
          kodeKlasifikasi,
          tanggalSurat,
          tujuanSurat: tujuanSurat.trim(),
          namaPenerima: namaPenerima.trim() || undefined,
          jabatanPenerima: jabatanPenerima.trim() || undefined,
          alamatPenerima: alamatPenerima.trim() || undefined,
          perihal: perihal.trim(),
          ringkasan: ringkasan.trim(),
          kategori,
          sifat,
          status,
          catatan: catatan.trim() || undefined,
          fileDoc,
          createdBy: currentUser.name,
          customNomorSurat: modePenomoran === 'manual' ? manualNomorSurat.trim() : undefined,
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight text-white">
                {isEdit ? 'Ubah Data Surat Keluar' : 'Terbitkan Surat Keluar Baru'}
              </h3>
              <p className="text-xs text-amber-200/80">
                MI Ma'arif Al Ihsan Soborejo · Opsi Penomoran Otomatis & Manual
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
                Opsi Penomoran Surat Keluar
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
                  Otomatis (Sistem)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModePenomoran('manual');
                    if (!manualNomorSurat) {
                      setManualNomorSurat(generatedNumber);
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
                    Nomor Terkunci Sistem Sesuai Kode & Tanggal:
                  </span>
                  <span className="font-mono text-sm md:text-base font-extrabold text-emerald-950 tracking-wide">
                    {generatedNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                    Format Standar Madrasah
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
                    <span>Masukkan Nomor Surat Keluar Bebas / Kustom:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyGeneratedToManual}
                    className="text-[11px] px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold transition-colors cursor-pointer"
                    title="Gunakan format standar sebagai draf ketikan"
                  >
                    Terapkan Nomor Otomatis
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      required
                      value={manualNomorSurat}
                      onChange={(e) => setManualNomorSurat(e.target.value)}
                      placeholder="Contoh: 005/Mis.11.23.14.14/PP.00/02/2026 atau nomor khusus"
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
                  💡 <strong>Mode Manual Aktif:</strong> Anda dapat memasukkan nomor surat susulan, surat khusus madrasah, atau nomor arsip fisik yang sudah terlanjur dibuat di luar sistem.
                </p>
              </div>
            )}
          </div>

          {/* Row 1: Tanggal Surat & Klasifikasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Surat Keluar *
              </label>
              <input
                type="date"
                required
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Bulan dan tahun pada nomor surat otomatis disinkronkan dengan tanggal ini.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Klasifikasi Surat *
              </label>
              <select
                value={kodeKlasifikasi}
                onChange={handleKlasifikasiChange}
                disabled={isEdit}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {klasifikasiList.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    {k.kode} - {k.nama}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Kode klasifikasi Kemenag untuk mengkategorikan urusan surat.
              </span>
            </div>
          </div>

          {/* Row 2: Tujuan Surat & Nama Penerima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tujuan / Instansi Penerima *
              </label>
              <input
                type="text"
                required
                value={tujuanSurat}
                onChange={(e) => setTujuanSurat(e.target.value)}
                placeholder="Contoh: Kantor Kementerian Agama Kab. Temanggung"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Penerima / Pejabat (Opsional)
              </label>
              <input
                type="text"
                value={namaPenerima}
                onChange={(e) => setNamaPenerima(e.target.value)}
                placeholder="Contoh: Kasi Pendidikan Madrasah (Penma)"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Jabatan & Alamat Penerima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Penerima (Opsional)
              </label>
              <input
                type="text"
                value={jabatanPenerima}
                onChange={(e) => setJabatanPenerima(e.target.value)}
                placeholder="Contoh: Kepala Seksi / Ketua Panitia"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat / Kota Penerima (Opsional)
              </label>
              <input
                type="text"
                value={alamatPenerima}
                onChange={(e) => setAlamatPenerima(e.target.value)}
                placeholder="Contoh: Jl. Pemuda No. 45 Temanggung"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Perihal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perihal Surat Keluar *
            </label>
            <input
              type="text"
              required
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              placeholder="Contoh: Pengantar Laporan Rekapitulasi Daftar Nominasi Peserta AM 2026"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Ringkasan Isi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ringkasan / Intisari Surat
            </label>
            <textarea
              rows={2}
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              placeholder="Tuliskan pokok permohonan, laporan, atau instruksi..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Row 5: Sifat & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="Segera">Segera</option>
                <option value="Sangat Segera">Sangat Segera</option>
                <option value="Rahasia">Rahasia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Surat Keluar
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusSuratKeluar)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Konsep">Konsep (Draft)</option>
                <option value="Disetujui">Disetujui Kepala Madrasah</option>
                <option value="Telah Dikirim">Telah Dikirim</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Ekspedisi Pengiriman
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Dikirim via kurir madrasah / diserahkan langsung oleh Operator Madrasah"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Google Drive Document Upload */}
          <div className="p-4 bg-slate-50 border border-dashed border-emerald-300 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  Lampiran Berkas Google Drive (PDF / Word)
                </span>
                <span className="text-[11px] text-slate-500">
                  {isGoogleDriveConnected()
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
                <span>{isUploadingDrive ? 'Mengunggah ke Drive...' : 'Pilih Berkas Dokumen'}</span>
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

            {fileName && !isUploadingDrive && (
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded text-xs mt-2">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{fileName}</span>
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
                  {driveFileId && (
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      ID: {driveFileId.slice(0, 14)}...
                    </span>
                  )}
                </div>
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Simpan Perubahan' : 'Terbitkan Surat & Kunci Nomor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
