import { useState, useEffect, useMemo } from 'react';
import { SuratKeluar, SifatSurat, StatusSuratKeluar, MadrasahSettings, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { X, Save, UploadCloud, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

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

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('application/pdf');
  const [driveFileId, setDriveFileId] = useState('');

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

      if (suratToEdit.fileDoc) {
        setFileName(suratToEdit.fileDoc.fileName);
        setFileSize(suratToEdit.fileDoc.fileSize);
        setFileType(suratToEdit.fileDoc.fileType);
        setDriveFileId(suratToEdit.fileDoc.fileId);
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
    }
  }, [suratToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type || 'application/pdf');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tujuanSurat.trim() || !perihal.trim() || !tanggalSurat) {
      alert('Mohon lengkapi Tujuan Surat, Tanggal Surat, dan Perihal.');
      return;
    }

    const fileDoc = fileName
      ? {
          fileId: driveFileId || `1gdrive-out-${Date.now()}`,
          folderId: '1-GDRIVE-OUTGOING-SOBOREJO-2026',
          fileName,
          fileSize: fileSize || 620000,
          fileType,
          driveUrl: `https://drive.google.com/file/d/${driveFileId || 'default'}/view`,
          downloadUrl: `https://drive.google.com/uc?id=${driveFileId || 'default'}&export=download`,
          uploadedAt: new Date().toISOString(),
          textContent: ringkasan || perihal,
        }
      : undefined;

    if (isEdit && suratToEdit) {
      storageService.updateSuratKeluar(
        suratToEdit.id,
        {
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
                MI Ma'arif Al Ihsan Soborejo · Penomoran Otomatis Sesuai Format Resmi
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
          {/* Automatic Number Generator Display */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Nomor Surat Keluar Resmi (Otomatis & Terjamin Unik)
              </span>
              <span className="text-[11px] text-emerald-800 italic">
                {isEdit ? 'Nomor permanen (tidak berubah saat edit)' : 'Sistem Penomoran Kemenag / Madrasah'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-emerald-300 flex items-center justify-between">
              <span className="font-mono text-sm md:text-base font-extrabold text-emerald-900 tracking-wide">
                {generatedNumber}
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                Format: 0xx/Mis.11.23.14.14/Klasifikasi/Bulan/Tahun
              </span>
            </div>
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
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Lampiran Berkas Google Drive (PDF / Word)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dokumen fisik/digital disimpan pada Google Drive madrasah.
                </span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Pilih Berkas Dokumen</span>
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
