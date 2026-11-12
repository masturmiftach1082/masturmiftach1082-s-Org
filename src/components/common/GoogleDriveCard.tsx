import { useState, useEffect } from 'react';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  isGoogleDriveConnected,
  getConnectedGoogleUser,
} from '../../services/googleAuthService';
import { getDriveStorageInfo } from '../../services/googleDriveService';
import { HardDrive, CheckCircle2, AlertCircle, LogOut, ExternalLink, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleDriveCardProps {
  onStatusChanged?: (connected: boolean) => void;
  compact?: boolean;
}

export default function GoogleDriveCard({ onStatusChanged, compact = false }: GoogleDriveCardProps) {
  const [connected, setConnected] = useState<boolean>(isGoogleDriveConnected());
  const [googleUser, setGoogleUser] = useState<User | null>(getConnectedGoogleUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<{ usageBytes?: number; limitBytes?: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initGoogleAuth(
      (user) => {
        setConnected(true);
        setGoogleUser(user);
        if (onStatusChanged) onStatusChanged(true);
        loadStorageInfo();
      },
      () => {
        setConnected(false);
        setGoogleUser(null);
        setStorageInfo(null);
        if (onStatusChanged) onStatusChanged(false);
      }
    );

    return () => unsub();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await getDriveStorageInfo();
      if (info.connected) {
        setStorageInfo({
          usageBytes: info.usageBytes,
          limitBytes: info.limitBytes,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      setConnected(true);
      setGoogleUser(res.user);
      if (onStatusChanged) onStatusChanged(true);
      await loadStorageInfo();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(err.message || 'Gagal menghubungkan Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!confirm('Apakah Anda yakin ingin memutuskan sambungan akun Google Drive?')) return;
    setIsLoading(true);
    try {
      await signOutGoogle();
      setConnected(false);
      setGoogleUser(null);
      setStorageInfo(null);
      if (onStatusChanged) onStatusChanged(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200 text-xs">
        <div className="flex items-center gap-2 truncate">
          <HardDrive className={`w-4 h-4 shrink-0 ${connected ? 'text-emerald-700' : 'text-slate-400'}`} />
          {connected ? (
            <div className="truncate">
              <span className="font-semibold text-emerald-950 block truncate">
                Google Drive Terhubung
              </span>
              <span className="text-[10px] text-emerald-700 truncate block">
                {googleUser?.email || 'Akun Madrasah'}
              </span>
            </div>
          ) : (
            <span className="text-slate-600 text-[11px]">
              Google Drive belum tersambung
            </span>
          )}
        </div>

        <div>
          {connected ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[10px] font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
            >
              Putus
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 shadow-2xs cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Hubungkan
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-950 flex items-center gap-2 text-xs md:text-sm">
          <HardDrive className="w-4 h-4 text-emerald-700" />
          Penyimpanan Berkas Google Drive Madrasah
        </span>
        {connected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Terhubung Otomatis
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Belum Terhubung
          </span>
        )}
      </div>

      <p className="text-slate-600 text-[11px] leading-relaxed">
        Saat terhubung, setiap berkas surat masuk, surat keluar, SK, dan arsip digital yang Anda unggah akan otomatis diunggah langsung ke Google Drive madrasah (folder <strong>SIPAS MI Ma'arif Al Ihsan Soborejo</strong>) dan tersinkronisasi di semua perangkat.
      </p>

      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {connected ? (
        <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                Akun Google Drive Aktif
              </span>
              <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {googleUser?.email || 'Akun Madrasah'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Buka Google Drive
              </a>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" /> Putuskan
              </button>
            </div>
          </div>

          {storageInfo?.limitBytes ? (
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Penggunaan Ruang Google Drive:</span>
              <span className="font-mono font-medium text-slate-700">
                {formatBytes(storageInfo.usageBytes)} dari {formatBytes(storageInfo.limitBytes)}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="pt-1">
          {/* Official Sign in with Google Button as mandated by Google Workspace guidelines */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span>Hubungkan Google Drive Madrasah (Masuk dengan Google)</span>
          </button>
        </div>
      )}
    </div>
  );
}
