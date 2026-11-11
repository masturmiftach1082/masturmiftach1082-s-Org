import { useState } from 'react';
import { storageService } from '../../services/storageService';
import { MadrasahSettings, UserProfile } from '../../types';
import {
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface LoginAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminUser: UserProfile) => void;
  settings: MadrasahSettings;
}

export default function LoginAdminModal({
  isOpen,
  onClose,
  onSuccess,
  settings,
}: LoginAdminModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = storageService.loginAdmin(password);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        onSuccess(storageService.getActiveUser());
        onClose();
      }, 700);
    } else {
      setError(result.message || 'Kata sandi tidak sesuai.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Madrasah Branding */}
        <div className="bg-gradient-to-br from-[#023126] via-[#034436] to-[#01221b] border-b-2 border-amber-400/70 p-6 text-white text-center relative shadow-sm">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-500/25 to-amber-300/10 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            <Lock className="w-7 h-7 text-amber-300" />
          </div>

          <h3 className="text-base font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
            Masuk Hak Administrator
          </h3>
          <p className="text-xs text-amber-100/90 mt-1">
            {settings.namaMadrasah}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Secara bawaan, situs berada dalam <strong>Mode Hanya Lihat</strong>. Masukkan kata sandi Administrator untuk mengaktifkan izin kelola (pencatatan surat, penomoran, disposisi, dan pengaturan).
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-amber-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Kata sandi benar! Membuka mode Administrator...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Kata Sandi Administrator</span>
              <span className="text-[11px] font-normal text-slate-400">
                Bawaan: <code className="bg-amber-50 border border-amber-200 px-1 py-0.5 rounded text-amber-900 font-mono font-bold">admin123</code>
              </span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-amber-600" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl border border-amber-300 shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-950" />
              Masuk Administrator
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          Kata sandi dapat diganti sewaktu-waktu pada menu Pengaturan Sistem.
        </div>
      </div>
    </div>
  );
}
