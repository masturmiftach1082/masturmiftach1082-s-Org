import { useState } from 'react';
import { UserProfile, MadrasahSettings } from '../../types';
import { storageService } from '../../services/storageService';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Info,
} from 'lucide-react';

interface PenggunaListProps {
  users: UserProfile[];
  currentUser: UserProfile;
  settings: MadrasahSettings;
  onOpenLoginModal: () => void;
  onPasswordChanged: () => void;
}

export default function PenggunaList({
  users,
  currentUser,
  settings,
  onOpenLoginModal,
  onPasswordChanged,
}: PenggunaListProps) {
  const isAdmin = currentUser.role === 'admin';
  const adminUser = users[0] || {
    id: 'admin-1',
    name: 'Administrator SIPAS',
    email: 'admin@mimaarifsoborejo.sch.id',
    role: 'admin',
    jabatan: 'Administrator Sistem SIPAS',
    isActive: true,
  };

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!storageService.verifyAdminPassword(currentPassword)) {
      setErrorMsg('Kata sandi saat ini tidak sesuai.');
      return;
    }

    if (newPassword.length < 5) {
      setErrorMsg('Kata sandi baru minimal 5 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    storageService.setAdminPassword(newPassword, currentUser);
    setSuccessMsg('Kata sandi Administrator berhasil diperbarui!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onPasswordChanged();
  };

  return (
    <div className="space-y-6">
      {/* Policy Explanation Banner */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-amber-200">
            Kebijakan Hak Akses & Keamanan SIPAS
          </h4>
          <p className="text-emerald-100/90 leading-relaxed">
            Sistem informasi persuratan MI Ma'arif Al Ihsan Soborejo dikonfigurasi dengan <strong className="text-amber-300">1 akun Administrator resmi</strong> yang dilindungi kata sandi. 
            Semua pengguna di luar Administrator berada dalam <strong className="text-amber-200">Mode Hanya Lihat (Read-Only)</strong> guna menjamin keaslian agenda dan nomor surat dinas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Administrator Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 border-t-2 border-t-amber-500">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Akun Administrator Tunggal</h3>
          </div>

          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-500 text-slate-950 font-extrabold text-xl flex items-center justify-center shadow-md border-2 border-amber-300">
              A
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-3">{adminUser.name}</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{adminUser.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-400">
              Hak Akses: Administrator Penuh
            </span>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Jabatan:</span>
              <span className="font-semibold text-slate-800">{adminUser.jabatan}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status Akun:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Metode Masuk:</span>
              <span className="font-semibold text-slate-800">Autentikasi Kata Sandi</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status Sesi Saat Ini:</span>
              <span className={`font-bold ${isAdmin ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isAdmin ? 'Terautentikasi (Admin Aktif)' : 'Mode Tamu (Hanya Lihat)'}
              </span>
            </div>
          </div>

          {!isAdmin && (
            <button
              onClick={onOpenLoginModal}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer mt-2"
            >
              <Lock className="w-3.5 h-3.5" /> Masuk sebagai Administrator
            </button>
          )}
        </div>

        {/* Password Management Form or Guest Notice */}
        <div className="lg:col-span-2 space-y-6">
          {isAdmin ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Ganti Kata Sandi Administrator
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Default bawaan: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-bold">admin123</code>
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi Saat Ini *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama..."
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 5 karakter..."
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ulangi Kata Sandi Baru *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" /> Perbarui Kata Sandi Administrator
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 border-t-2 border-t-amber-500">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Anda Sedang Menggunakan Mode Hanya Lihat
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Pengunjung umum dapat menelusuri surat masuk, surat keluar, ketetapan SK, berkas arsip, serta mencetak lembar agenda. 
                  Untuk mengubah berkas atau mengelola keamanan, silakan masuk dengan kata sandi Administrator.
                </p>
              </div>

              <div>
                <button
                  onClick={onOpenLoginModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Lock className="w-4 h-4" /> Masuk Hak Administrator
                </button>
              </div>
            </div>
          )}

          {/* Role matrix explanation card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-700" /> Panduan Matriks Hak Akses
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2 px-3 font-semibold">Tindakan / Modul</th>
                    <th className="py-2 px-3 font-semibold">Administrator (Login Password)</th>
                    <th className="py-2 px-3 font-semibold">Mode Tamu / Publik (Hanya Lihat)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3">Lihat Surat Masuk, Keluar, SK, & Arsip</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Cari, Filter, & Pratinjau Dokumen Google Drive</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Cetak Laporan, Buku Agenda & Disposisi</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Catat & Buat Nomor Surat Masuk / Keluar / SK Baru</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan Penuh</td>
                    <td className="py-2 px-3 text-red-600 font-semibold">✗ Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Edit & Hapus Data Dokumen Persuratan</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan Penuh</td>
                    <td className="py-2 px-3 text-red-600 font-semibold">✗ Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Buat / Ubah Lembar Disposisi Kepala Madrasah</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan Penuh</td>
                    <td className="py-2 px-3 text-red-600 font-semibold">✗ Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Ubah Pengaturan Madrasah & Koneksi Supabase</td>
                    <td className="py-2 px-3 text-emerald-700 font-semibold">✓ Diizinkan Penuh</td>
                    <td className="py-2 px-3 text-red-600 font-semibold">✗ Hanya Lihat</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
