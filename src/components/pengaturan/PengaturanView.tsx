import { useState } from 'react';
import { MadrasahSettings, KlasifikasiSurat, UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../../services/supabaseClient';
import {
  Settings,
  Building,
  Key,
  Database,
  HardDrive,
  Save,
  Download,
  Upload,
  RefreshCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Terminal,
  Activity,
  Lock,
} from 'lucide-react';

interface PengaturanViewProps {
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onSettingsSaved: (newSettings: MadrasahSettings) => void;
}

export default function PengaturanView({
  settings,
  currentUser,
  onSettingsSaved,
}: PengaturanViewProps) {
  const [activeTab, setActiveTab] = useState<'madrasah' | 'penomoran' | 'integrasi' | 'backup'>('madrasah');
  const [formData, setFormData] = useState<MadrasahSettings>({ ...settings });
  const [klasifikasiList, setKlasifikasiList] = useState<KlasifikasiSurat[]>(storageService.getKlasifikasi());
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [showSQLSchema, setShowSQLSchema] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const canEdit = currentUser.role === 'admin';

  const handleTestSupabase = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    const res = await testSupabaseConnection();
    setConnectionResult(res);
    setTestingConnection(false);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleSyncSupabase = async () => {
    setSyncingData(true);
    setSyncResult(null);
    const res = await storageService.syncFromSupabase();
    setSyncingData(false);
    if (res.success) {
      setSyncResult(
        `Sinkronisasi berhasil: ${res.counts.suratMasuk} surat masuk, ${res.counts.suratKeluar} surat keluar, ${res.counts.suratKeputusan} SK, ${res.counts.arsip} arsip.`
      );
    } else {
      setSyncResult(res.message || 'Gagal sinkronisasi data dari Supabase.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData, currentUser);
    onSettingsSaved(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddKlasifikasi = () => {
    if (!newKode.trim() || !newNama.trim()) {
      alert('Kode dan nama klasifikasi wajib diisi.');
      return;
    }
    const updated = [...klasifikasiList, { kode: newKode.trim(), nama: newNama.trim(), deskripsi: newDesc.trim() }];
    setKlasifikasiList(updated);
    storageService.saveKlasifikasi(updated);
    setNewKode('');
    setNewNama('');
    setNewDesc('');
  };

  const handleDeleteKlasifikasi = (kode: string) => {
    if (confirm(`Hapus kode klasifikasi ${kode}?`)) {
      const updated = klasifikasiList.filter((k) => k.kode !== kode);
      setKlasifikasiList(updated);
      storageService.saveKlasifikasi(updated);
    }
  };

  const handleExportBackup = () => {
    const json = storageService.exportAllDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SIPAS_Backup_${settings.namaMadrasah.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importAllDataJSON(content, currentUser);
      if (success) {
        alert('Basis data SIPAS berhasil dipulihkan dari cadangan JSON!');
        window.location.reload();
      } else {
        alert('Gagal memulihkan data. Format berkas cadangan JSON tidak sesuai.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mengembalikan seluruh data ke pengaturan awal madrasah?')) {
      storageService.resetToDefault(currentUser);
      alert('Data telah dikembalikan ke standar awal.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pengaturan Aplikasi SIPAS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas madrasah, format penomoran surat, integrasi Google Drive & Supabase, serta pencadangan data.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Pengaturan berhasil disimpan!
          </div>
        )}
      </div>

      {!canEdit && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Mode Hanya Lihat:</strong> Anda sedang meninjau konfigurasi madrasah dalam mode baca. Untuk menyimpan perubahan atau mengubah kredensial, silakan masuk sebagai Administrator menggunakan tombol di bilah atas.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('madrasah')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'madrasah'
              ? 'bg-[#023126] text-amber-300 border border-amber-400/60 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" /> Identitas Madrasah
        </button>

        <button
          onClick={() => setActiveTab('penomoran')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'penomoran'
              ? 'bg-[#023126] text-amber-300 border border-amber-400/60 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Key className="w-4 h-4" /> Format Penomoran Surat
        </button>

        <button
          onClick={() => setActiveTab('integrasi')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'integrasi'
              ? 'bg-[#023126] text-amber-300 border border-amber-400/60 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" /> Google Drive & Supabase
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#023126] text-amber-300 border border-amber-400/60 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Cadangan & Pemulihan
        </button>
      </div>

      {/* TAB 1: IDENTITAS MADRASAH */}
      {activeTab === 'madrasah' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Data Pokok Madrasah & Kepala Madrasah</h3>
              <p className="text-slate-500 text-[11px]">Digunakan otomatis pada kop surat, buku agenda, lembar disposisi, dan tanda tangan resmi.</p>
            </div>
            {canEdit && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Pengaturan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Madrasah *</label>
                <input
                  type="text"
                  required
                  value={formData.namaMadrasah}
                  onChange={(e) => setFormData({ ...formData, namaMadrasah: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Statistik Madrasah (NSM) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nsm}
                    onChange={(e) => setFormData({ ...formData, nsm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPSN *</label>
                  <input
                    type="text"
                    required
                    value={formData.npsn}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kabupaten</label>
                  <input
                    type="text"
                    value={formData.kabupaten}
                    onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={formData.kodePos}
                    onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Logo Preview & Kepala Madrasah */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-center">
                <span className="block font-semibold text-slate-700 mb-2">Logo Resmi Madrasah</span>
                <div className="w-24 h-24 mx-auto p-2 bg-white rounded-full border-2 border-emerald-500 shadow-sm flex items-center justify-center">
                  <img
                    src={formData.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg'}
                    alt="Logo Madrasah"
                    className="w-20 h-20 object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="URL atau Path Logo"
                  className="w-full mt-2 text-[11px] px-2 py-1 border border-slate-300 rounded text-center"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Madrasah</label>
                  <input
                    type="text"
                    value={formData.kepalaMadrasah}
                    onChange={(e) => setFormData({ ...formData, kepalaMadrasah: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Madrasah</label>
                  <input
                    type="text"
                    value={formData.nipKepalaMadrasah}
                    onChange={(e) => setFormData({ ...formData, nipKepalaMadrasah: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Operator Madrasah Section */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-950">Operator Madrasah</p>
                    <p className="text-[10px] text-slate-500">
                      Di MI tidak terdapat Kepala TU, administrasi dikelola oleh Operator Madrasah.
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Operator Madrasah *</label>
                    <input
                      type="text"
                      required
                      value={formData.operatorMadrasah}
                      onChange={(e) => setFormData({ ...formData, operatorMadrasah: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIP / NUPTK Operator Madrasah</label>
                    <input
                      type="text"
                      value={formData.nipOperatorMadrasah}
                      onChange={(e) => setFormData({ ...formData, nipOperatorMadrasah: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      placeholder="19850314... atau NUPTK"
                    />
                  </div>
                </div>

                {/* Kata Sandi Administrator Section */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                    <p className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-700" /> Kata Sandi Administrator
                    </p>
                    <p className="text-[10px] text-amber-800">
                      Digunakan untuk membuka izin kelola penuh persuratan. Pengunjung lain berada di Mode Hanya Lihat.
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Masuk Administrator</label>
                    <input
                      type="text"
                      value={formData.adminPassword || 'admin123'}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-emerald-950 font-bold bg-white"
                      placeholder="admin123"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: FORMAT PENOMORAN SURAT */}
      {activeTab === 'penomoran' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Format Penomoran Surat Keluar, SK, & Klasifikasi</h3>
              <p className="text-slate-500 text-[11px]">Sesuai pedoman tata persuratan dinas Kementerian Agama & Madrasah.</p>
            </div>
            {canEdit && (
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Format Penomoran
              </button>
            )}
          </div>

          {/* Numbering Surat Keluar Preview Card */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> Rumus Format Nomor Surat Keluar:
            </span>
            <div className="p-3 bg-white rounded-lg border border-emerald-300">
              <p className="font-mono text-base font-bold text-emerald-900">
                0xx/{formData.kodeMadrasah}/[KODE_KLASIFIKASI]/[BULAN_2_DIGIT]/[TAHUN_4_DIGIT]
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Contoh hasil: <strong className="font-mono text-slate-800">001/{formData.kodeMadrasah}/PP.00/01/2026</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Satuan Madrasah *</label>
              <input
                type="text"
                required
                value={formData.kodeMadrasah}
                onChange={(e) => setFormData({ ...formData, kodeMadrasah: e.target.value })}
                placeholder="Mis.11.23.14.14"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Kode registrasi madrasah resmi pada seksi Pendidikan Madrasah Kemenag.
              </span>
            </div>
          </div>

          {/* Format SK Setting Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Format Penomoran Surat Keputusan (SK) Madrasah</h4>
              <p className="text-slate-500 text-[11px]">Format standar penomoran SK adalah <strong>XXX Tahun YYYY</strong></p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" /> Rumus Format Nomor SK:
              </span>
              <div className="p-3 bg-white rounded-lg border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-emerald-900">
                  {formData.formatPenomoranSK || 'XXX Tahun YYYY'}
                </span>
                <span className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                  Contoh hasil: <strong className="font-mono text-emerald-900">001 Tahun {new Date().getFullYear()}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pola Penomoran SK *</label>
                <input
                  type="text"
                  required
                  value={formData.formatPenomoranSK || 'XXX Tahun YYYY'}
                  onChange={(e) => setFormData({ ...formData, formatPenomoranSK: e.target.value })}
                  placeholder="XXX Tahun YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Variabel <strong>XXX</strong> = nomor urut 3 digit (001, 002...), <strong>YYYY</strong> = tahun (2026).
                </span>
              </div>
            </div>
          </div>

          {/* Klasifikasi Surat Table */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-900">Daftar Kode Klasifikasi Surat Dinas Madrasah</h4>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 w-28 font-mono">Kode</th>
                    <th className="py-2.5 px-3 w-48">Nama Urusan</th>
                    <th className="py-2.5 px-3">Deskripsi Dokumen Terkait</th>
                    <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {klasifikasiList.map((k) => (
                    <tr key={k.kode} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-emerald-900">{k.kode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{k.nama}</td>
                      <td className="py-2 px-3 text-slate-600">{k.deskripsi}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleDeleteKlasifikasi(k.kode)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Klasifikasi Form */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kode Baru</label>
                <input
                  type="text"
                  placeholder="Mis: KD.01"
                  value={newKode}
                  onChange={(e) => setNewKode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Klasifikasi</label>
                <input
                  type="text"
                  placeholder="Nama urusan..."
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Keterangan..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddKlasifikasi}
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-700 text-white font-semibold rounded text-xs hover:bg-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRASI GOOGLE DRIVE & SUPABASE */}
      {activeTab === 'integrasi' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Arsitektur Penyimpanan Google Drive & Supabase</h3>
              <p className="text-slate-500 text-[11px]">
                Dokumen fisik/digital disimpan pada Google Drive madrasah, sedangkan metadata, relasi, dan penomoran tercatat pada basis data.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Konfigurasi
              </button>
            )}
          </div>

          {/* Architecture Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase status */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-700" /> Basis Data Supabase PostgreSQL
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung Aktif
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Menyimpan seluruh data surat masuk, surat keluar, penomoran sequence, dan metadata dokumen madrasah.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supabase API Endpoint</label>
                <input
                  type="text"
                  value={formData.supabaseConfig.url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supabaseConfig: { ...formData.supabaseConfig, url: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supabase Publishable Key</label>
                <input
                  type="text"
                  value={formData.supabaseConfig.anonKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supabaseConfig: { ...formData.supabaseConfig, anonKey: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white"
                />
              </div>

              {/* Action: Test Connection & Links */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
                >
                  <Activity className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  {testingConnection ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncSupabase}
                  disabled={syncingData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${syncingData ? 'animate-spin' : ''}`} />
                  {syncingData ? 'Sinkronisasi...' : 'Tarik Data Supabase'}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/emdjxbjhrlqsficqyors"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Dashboard Supabase
                </a>
              </div>

              {/* Connection result notice */}
              {connectionResult && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    connectionResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  {connectionResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{connectionResult.message}</span>
                </div>
              )}

              {/* Sync result notice */}
              {syncResult && (
                <div className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncResult}</span>
                </div>
              )}
            </div>

            {/* Google Drive status */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-700" /> Google Drive Cloud Storage
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Seluruh file PDF dan scan surat tersimpan di Google Drive madrasah tanpa membebani kuota Supabase.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Folder ID Surat Masuk</label>
                <input
                  type="text"
                  value={formData.googleDriveConfig.folderIdSuratMasuk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      googleDriveConfig: { ...formData.googleDriveConfig, folderIdSuratMasuk: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Folder ID Surat Keluar</label>
                <input
                  type="text"
                  value={formData.googleDriveConfig.folderIdSuratKeluar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      googleDriveConfig: { ...formData.googleDriveConfig, folderIdSuratKeluar: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Supabase SQL DDL Schema helper */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-900">Skrip SQL Schema Supabase (DDL)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSQL ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSQLSchema(!showSQLSchema)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  {showSQLSchema ? 'Sembunyikan SQL' : 'Lihat SQL Schema'}
                </button>
              </div>
            </div>

            <p className="text-slate-600 text-[11px]">
              Jika tabel di project Supabase <code className="bg-slate-200 px-1 py-0.5 rounded text-emerald-800 font-mono">emdjxbjhrlqsficqyors</code> belum dibuat,
              buka <strong>Supabase SQL Editor</strong> lalu tempel dan jalankan (Run) skrip SQL ini untuk membuat struktur tabel <code>surat_masuk</code>, <code>surat_keluar</code>, <code>surat_keputusan</code>, <code>arsip_digital</code>, <code>pengaturan_madrasah</code>, dan <code>activity_logs</code>.
            </p>

            {showSQLSchema && (
              <div className="relative mt-2">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CADANGAN & PEMULIHAN */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Cadangan & Pemulihan Basis Data (Disaster Recovery)</h3>
            <p className="text-slate-500 text-[11px]">
              Amankan seluruh berkas agenda, surat keluar, disposisi, dan pengaturan ke dalam format berkas JSON lokal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Backup */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50">
              <span className="font-bold text-slate-900 block">Unduh Cadangan JSON</span>
              <p className="text-slate-500 text-[11px]">
                Ekspor seluruh data SIPAS MI Ma'arif Al Ihsan Soborejo ke berkas cadangan offline yang dapat disimpan di flashdisk atau drive lokal.
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Cadangan Lengkap
              </button>
            </div>

            {/* Import Restore */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50">
              <span className="font-bold text-slate-900 block">Pulihkan Data dari JSON</span>
              <p className="text-slate-500 text-[11px]">
                Unggah berkas cadangan JSON yang pernah diunduh sebelumnya untuk memulihkan seluruh data madrasah.
              </p>
              <label className="cursor-pointer w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shadow-xs">
                <Upload className="w-3.5 h-3.5" /> Pilih Berkas Cadangan
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            {/* Reset */}
            <div className="p-4 rounded-xl border border-red-200 space-y-3 bg-red-50/30">
              <span className="font-bold text-red-900 block">Reset ke Pengaturan Awal</span>
              <p className="text-red-700 text-[11px]">
                Mengembalikan basis data ke contoh resmi MI Ma'arif Al Ihsan Soborejo.
              </p>
              <button
                onClick={handleResetData}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Reset Data Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
