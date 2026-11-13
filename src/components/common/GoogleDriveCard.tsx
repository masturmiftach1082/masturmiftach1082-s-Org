import { useState, useEffect } from 'react';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  isGoogleDriveConnected,
  getConnectedGoogleUser,
} from '../../services/googleAuthService';
import {
  getDriveStorageInfo,
  GOOGLE_APPS_SCRIPT_CODE,
  testAppsScriptConnection,
  AppsScriptPingResult,
} from '../../services/googleDriveService';
import { storageService } from '../../services/storageService';
import { MadrasahSettings } from '../../types';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ExternalLink,
  Loader2,
  FolderSync,
  Sparkles,
  Link2,
  FolderOpen,
  Save,
  KeyRound,
  Code2,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleDriveCardProps {
  onStatusChanged?: (connected: boolean) => void;
  compact?: boolean;
  settings?: MadrasahSettings;
  onUpdateSettings?: (cfg: Partial<MadrasahSettings['googleDriveConfig']>) => void;
}

export default function GoogleDriveCard({
  onStatusChanged,
  compact = false,
  settings: propSettings,
  onUpdateSettings,
}: GoogleDriveCardProps) {
  const currentSettings = propSettings || storageService.getSettings();
  const driveConfig = currentSettings.googleDriveConfig || {
    folderIdSuratMasuk: '',
    folderIdSuratKeluar: '',
    folderIdSK: '',
    folderIdArsip: '',
    serviceAccountEmail: 'masturmiftach@gmail.com',
    isConnected: true,
    driveFolderUrl: 'https://drive.google.com/drive/folders/1sipas_mimaarif_alihsan_soborejo_2026',
    appsScriptUrl: '',
    activeMode: 'folder-link',
  };

  // Determine initial mode
  const initialMode: 'apps-script' | 'folder-link' | 'api-login' =
    driveConfig.activeMode || (driveConfig.appsScriptUrl ? 'apps-script' : 'folder-link');

  // State
  const [activeTabMode, setActiveTabMode] = useState<'apps-script' | 'folder-link' | 'api-login'>(initialMode);
  const [appsScriptUrl, setAppsScriptUrl] = useState(driveConfig.appsScriptUrl || '');
  const [folderUrl, setFolderUrl] = useState(
    driveConfig.driveFolderUrl || 'https://drive.google.com/drive/folders/1sipas_mimaarif_alihsan_soborejo_2026'
  );
  const [accountEmail, setAccountEmail] = useState(
    driveConfig.serviceAccountEmail || 'masturmiftach@gmail.com'
  );
  const [urlMasuk, setUrlMasuk] = useState(driveConfig.urlSuratMasuk || '');
  const [urlKeluar, setUrlKeluar] = useState(driveConfig.urlSuratKeluar || '');
  const [urlSK, setUrlSK] = useState(driveConfig.urlSK || '');
  const [urlArsip, setUrlArsip] = useState(driveConfig.urlArsip || '');
  const [showSubFolders, setShowSubFolders] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Apps Script test & UI state
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [scriptTestResult, setScriptTestResult] = useState<AppsScriptPingResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  // Firebase auth state
  const [connected, setConnected] = useState<boolean>(isGoogleDriveConnected());
  const [googleUser, setGoogleUser] = useState<User | null>(getConnectedGoogleUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<{ usageBytes?: number; limitBytes?: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState<boolean>(false);

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

  const persistDriveConfig = (partial: Partial<MadrasahSettings['googleDriveConfig']>) => {
    const latest = storageService.getSettings();
    const updatedDriveConfig: MadrasahSettings['googleDriveConfig'] = {
      ...latest.googleDriveConfig,
      ...partial,
      isConnected: true,
    };

    const newSettings: MadrasahSettings = {
      ...latest,
      googleDriveConfig: updatedDriveConfig,
    };

    storageService.saveSettings(newSettings, storageService.getActiveUser());
    if (onUpdateSettings) {
      onUpdateSettings(updatedDriveConfig);
    }
  };

  const handleSaveAppsScriptConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = appsScriptUrl.trim();
    persistDriveConfig({
      appsScriptUrl: cleanUrl,
      serviceAccountEmail: accountEmail.trim(),
      driveFolderUrl: folderUrl.trim(),
      urlSuratMasuk: urlMasuk.trim(),
      urlSuratKeluar: urlKeluar.trim(),
      urlSK: urlSK.trim(),
      urlArsip: urlArsip.trim(),
      activeMode: 'apps-script',
    });
    if (onStatusChanged) onStatusChanged(Boolean(cleanUrl));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestAppsScript = async () => {
    const cleanUrl = appsScriptUrl.trim();
    if (!cleanUrl) {
      setScriptTestResult({
        success: false,
        message: 'Silakan tempel URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsTestingScript(true);
    setScriptTestResult(null);
    const res = await testAppsScriptConnection(cleanUrl);
    setScriptTestResult(res);
    setIsTestingScript(false);

    if (res.success) {
      const newFolderUrl = res.rootFolderUrl || folderUrl;
      const newMasuk = res.subfolders?.['Surat Masuk']?.url || urlMasuk;
      const newKeluar = res.subfolders?.['Surat Keluar']?.url || urlKeluar;
      const newSK = res.subfolders?.['Surat Keputusan']?.url || urlSK;
      const newArsip = res.subfolders?.['Arsip Digital']?.url || urlArsip;
      const resolvedEmail = res.ownerEmail || accountEmail;

      setFolderUrl(newFolderUrl);
      setUrlMasuk(newMasuk);
      setUrlKeluar(newKeluar);
      setUrlSK(newSK);
      setUrlArsip(newArsip);
      if (resolvedEmail) setAccountEmail(resolvedEmail);

      persistDriveConfig({
        appsScriptUrl: cleanUrl,
        serviceAccountEmail: resolvedEmail,
        driveFolderUrl: newFolderUrl,
        urlSuratMasuk: newMasuk,
        urlSuratKeluar: newKeluar,
        urlSK: newSK,
        urlArsip: newArsip,
        folderIdSuratMasuk: res.subfolders?.['Surat Masuk']?.id || driveConfig.folderIdSuratMasuk,
        folderIdSuratKeluar: res.subfolders?.['Surat Keluar']?.id || driveConfig.folderIdSuratKeluar,
        folderIdSK: res.subfolders?.['Surat Keputusan']?.id || driveConfig.folderIdSK,
        folderIdArsip: res.subfolders?.['Arsip Digital']?.id || driveConfig.folderIdArsip,
        activeMode: 'apps-script',
      });

      if (onStatusChanged) onStatusChanged(true);
    }
  };

  const handleCopyScriptCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setShowScriptCode(true);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsDomainError(false);
    try {
      const res = await signInWithGoogle();
      setConnected(true);
      setGoogleUser(res.user);
      if (onStatusChanged) onStatusChanged(true);
      await loadStorageInfo();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const msg = err.message || '';
      if (msg.includes('unauthorized-domain') || msg.includes('auth/unauthorized-domain') || msg.includes('popup-blocked')) {
        setIsDomainError(true);
        setErrorMessage(
          'Autentikasi Firebase ditolak karena domain web ini belum terdaftar di Authorized Domains Firebase Console. Gunakan Mode Google Apps Script atau Mode Tautan Folder di samping (tanpa login Firebase) yang 100% bebas blokir domain.'
        );
      } else {
        setErrorMessage(err.message || 'Gagal menghubungkan Google Drive via Firebase.');
      }
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

  const handleSaveDriveFolderConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    persistDriveConfig({
      driveFolderUrl: folderUrl.trim(),
      serviceAccountEmail: accountEmail.trim(),
      urlSuratMasuk: urlMasuk.trim(),
      urlSuratKeluar: urlKeluar.trim(),
      urlSK: urlSK.trim(),
      urlArsip: urlArsip.trim(),
      activeMode: 'folder-link',
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const isAppsScriptActive = Boolean(appsScriptUrl.trim().startsWith('https://script.google.com/'));

  // Compact rendering for headers / widget bars
  if (compact) {
    const isFolderActive = Boolean(folderUrl);
    return (
      <div className="flex items-center justify-between p-2.5 bg-emerald-50/90 rounded-lg border border-emerald-200 text-xs">
        <div className="flex items-center gap-2 truncate">
          <HardDrive className={`w-4 h-4 shrink-0 ${isAppsScriptActive || isFolderActive ? 'text-emerald-700' : 'text-slate-400'}`} />
          <div className="truncate">
            <span className="font-semibold text-emerald-950 block truncate">
              {isAppsScriptActive
                ? 'Apps Script Drive Aktif'
                : isFolderActive
                ? 'Google Drive Madrasah Aktif'
                : 'Google Drive Belum Diatur'}
            </span>
            <span className="text-[10px] text-emerald-700 truncate block">
              {accountEmail || 'masturmiftach@gmail.com'}
            </span>
          </div>
        </div>

        {folderUrl ? (
          <a
            href={folderUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 shadow-2xs"
          >
            <FolderOpen className="w-3 h-3 text-emerald-700" /> Buka
          </a>
        ) : null}
      </div>
    );
  }

  // Full card rendering in Settings
  return (
    <div className="p-5 rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white space-y-4 shadow-sm border-t-4 border-t-amber-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
            <HardDrive className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
              Penyimpanan Google Drive Madrasah
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                Multi-Perangkat
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Integrasi arsip digital dan surat dinas MI Ma'arif Al Ihsan Soborejo ke Google Drive.
            </p>
          </div>
        </div>

        {isAppsScriptActive ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Apps Script Otomatis Aktif
          </span>
        ) : activeTabMode === 'folder-link' ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Mode Folder Aktif
          </span>
        ) : connected ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> API Drive Terhubung
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Menunggu URL / Koneksi
          </span>
        )}
      </div>

      {/* Mode Switcher Tabs (3 Modes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 p-1 bg-emerald-100/60 rounded-xl border border-emerald-200 text-xs">
        <button
          type="button"
          onClick={() => setActiveTabMode('apps-script')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            activeTabMode === 'apps-script'
              ? 'bg-[#023126] text-amber-300 shadow-sm'
              : 'text-slate-700 hover:text-emerald-950'
          }`}
        >
          <Code2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Google Apps Script (Otomatis)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode('folder-link')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            activeTabMode === 'folder-link'
              ? 'bg-[#023126] text-amber-300 shadow-sm'
              : 'text-slate-700 hover:text-emerald-950'
          }`}
        >
          <FolderSync className="w-4 h-4 shrink-0" />
          <span className="truncate">Tautan Folder (Manual)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode('api-login')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            activeTabMode === 'api-login'
              ? 'bg-[#023126] text-amber-300 shadow-sm'
              : 'text-slate-700 hover:text-emerald-950'
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span className="truncate">API Login Firebase (Opsional)</span>
        </button>
      </div>

      {/* TAB 1: GOOGLE APPS SCRIPT BRIDGE (REKOMENDASI UNTUK UNGGAH OTOMATIS TANPA FIREBASE) */}
      {activeTabMode === 'apps-script' && (
        <form onSubmit={handleSaveAppsScriptConfig} className="space-y-4 text-xs animate-in fade-in duration-150">
          {/* Benefit Box */}
          <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2.5">
            <div className="flex items-start gap-2.5 text-emerald-950">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">
                  Unggah Otomatis Langsung ke Google Drive via Google Apps Script (Bebas Error Firebase)
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Google Apps Script bertindak sebagai jembatan resmi di dalam akun Google madrasah Anda (
                  <span className="font-mono text-emerald-800">{accountEmail || 'masturmiftach@gmail.com'}</span>). Tanpa perlu login popup atau pengaturan domain Firebase, setiap surat masuk, surat keluar, SK, dan arsip digital yang Anda unggah di SIPAS akan langsung masuk ke Google Drive dan otomatis dibuatkan folder per kategori.
                </p>
              </div>
            </div>

            {/* 4-Step Quick Setup */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">1. Salin Kode Script</span>
                <span className="text-slate-600">Klik tombol "Salin Kode Code.gs" di bawah ini.</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">2. Buka Apps Script</span>
                <span className="text-slate-600">
                  Kunjungi{' '}
                  <a
                    href="https://script.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-700 font-semibold"
                  >
                    script.google.com
                  </a>{' '}
                  &rarr; Project Baru &rarr; Tempel kode.
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">3. Deploy Aplikasi Web</span>
                <span className="text-slate-600">
                  Klik <strong>Terapkan &rarr; Deployment Baru &rarr; Aplikasi Web</strong>. Akses: <strong>Siapa saja (Anyone)</strong>.
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">4. Tempel URL /exec</span>
                <span className="text-slate-600">Salin URL Web App berakhiran <code className="bg-slate-200 px-1 rounded">/exec</code> lalu klik Uji Koneksi.</span>
              </div>
            </div>

            {/* Script Copy & Preview Controls */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyScriptCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#023126] hover:bg-[#034436] rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                <span>{copiedCode ? 'Kode Code.gs Berhasil Disalin!' : 'Salin Kode Script (Code.gs)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showScriptCode ? 'Sembunyikan Kode' : 'Lihat Kode Code.gs'}</span>
                {showScriptCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <a
                href="https://script.google.com/home/start"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka script.google.com
              </a>
            </div>

            {showScriptCode && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 text-slate-100">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[11px] font-mono text-amber-300">
                  <span>Code.gs — Jembatan Google Drive SIPAS</span>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="text-xs text-white hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            )}
          </div>

          {/* Apps Script Endpoint Form */}
          <div className="space-y-3 p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                URL Web App Google Apps Script (berakhiran /exec) *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs bg-slate-50/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestAppsScript}
                  disabled={isTestingScript || !appsScriptUrl.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isTestingScript ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-800" />
                      <span>Uji Koneksi &amp; Buat Folder</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pastikan menggunakan URL <strong>Web App</strong> yang berakhiran <code className="bg-slate-100 px-1 rounded">/exec</code> (bukan link editor script).
              </span>
            </div>

            {scriptTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  scriptTestResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {scriptTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">{scriptTestResult.message}</p>
                  {scriptTestResult.success && scriptTestResult.rootFolderUrl && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={scriptTestResult.rootFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded font-semibold hover:bg-emerald-100 text-[11px]"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Buka Folder Utama Drive
                      </a>
                      {scriptTestResult.ownerEmail && (
                        <span className="text-[11px] text-emerald-800 font-mono">
                          Akun: {scriptTestResult.ownerEmail}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Folder Access if folderUrl exists */}
            {folderUrl && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                <span className="text-[11px] text-slate-500 font-semibold self-center mr-1">
                  Folder Drive Terhubung:
                </span>
                <a
                  href={urlMasuk || folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
                >
                  <FolderOpen className="w-3 h-3 text-emerald-700" /> Surat Masuk
                </a>
                <a
                  href={urlKeluar || folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
                >
                  <FolderOpen className="w-3 h-3 text-emerald-700" /> Surat Keluar
                </a>
                <a
                  href={urlSK || folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
                >
                  <FolderOpen className="w-3 h-3 text-emerald-700" /> SK Madrasah
                </a>
                <a
                  href={urlArsip || folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
                >
                  <FolderOpen className="w-3 h-3 text-emerald-700" /> Arsip Digital
                </a>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> URL Google Apps Script berhasil disimpan!
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">
                  URL tersinkron ke Supabase agar seluruh perangkat dapat langsung mengunggah ke Drive.
                </span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" /> Simpan URL Apps Script
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: MODE TAUTAN FOLDER */}
      {activeTabMode === 'folder-link' && (
        <form onSubmit={handleSaveDriveFolderConfig} className="space-y-4 text-xs animate-in fade-in duration-150">
          {/* Explanation Box */}
          <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-start gap-2.5 text-emerald-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">
                  Mode Tautan Folder (Tanpa Script &amp; Tanpa Login Firebase)
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Cukup tempel tautan folder Google Drive madrasah (
                  <span className="font-mono text-emerald-800">{accountEmail}</span>) di bawah sebagai pintasan cepat. Jika Anda ingin unggahan berkas masuk otomatis ke Google Drive saat memilih file di SIPAS, gunakan tab <strong>Google Apps Script (Otomatis)</strong> di sebelah kiri.
                </p>
              </div>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">1. Buat Folder di Drive</span>
                <span className="text-slate-500">Buka drive.google.com, buat folder "SIPAS MI Ma'arif Al Ihsan Soborejo".</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">2. Salin Tautan Folder</span>
                <span className="text-slate-500">Klik kanan folder &gt; Bagikan &gt; Siapa saja yang memiliki link dapat melihat.</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-900 block">3. Tempel di SIPAS</span>
                <span className="text-slate-500">Tempel URL di bawah lalu klik Simpan. Folder langsung terhubung!</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Tautan / URL Folder Utama Google Drive Madrasah *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    required
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs bg-slate-50/50"
                  />
                </div>
                {folderUrl && (
                  <a
                    href={folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shrink-0"
                  >
                    <FolderOpen className="w-4 h-4 text-emerald-800" /> Buka Folder
                  </a>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tautan ini akan terbuka ketika tombol "Folder Drive Madrasah" diklik pada header atau daftar persuratan.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Email Akun Google Madrasah (Pemilik Drive)
              </label>
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="masturmiftach@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
              />
            </div>

            {/* Toggle subfolder URLs */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubFolders(!showSubFolders)}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>{showSubFolders ? '▼ Sembunyikan Tautan Sub-Folder' : '▶ Atur Tautan Sub-Folder Per Kategori (Surat Masuk, Surat Keluar, SK, Arsip)'}</span>
              </button>

              {showSubFolders && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      URL Folder Surat Masuk
                    </label>
                    <input
                      type="url"
                      value={urlMasuk}
                      onChange={(e) => setUrlMasuk(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      URL Folder Surat Keluar
                    </label>
                    <input
                      type="url"
                      value={urlKeluar}
                      onChange={(e) => setUrlKeluar(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      URL Folder Surat Keputusan (SK)
                    </label>
                    <input
                      type="url"
                      value={urlSK}
                      onChange={(e) => setUrlSK(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      URL Folder Arsip Digital
                    </label>
                    <input
                      type="url"
                      value={urlArsip}
                      onChange={(e) => setUrlArsip(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Folder Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
              <span className="text-[11px] text-slate-500 font-semibold self-center mr-1">
                Pintasan Buka Folder:
              </span>
              <a
                href={urlMasuk || folderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
              >
                <FolderOpen className="w-3 h-3 text-emerald-700" /> Surat Masuk
              </a>
              <a
                href={urlKeluar || folderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
              >
                <FolderOpen className="w-3 h-3 text-emerald-700" /> Surat Keluar
              </a>
              <a
                href={urlSK || folderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
              >
                <FolderOpen className="w-3 h-3 text-emerald-700" /> SK Madrasah
              </a>
              <a
                href={urlArsip || folderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
              >
                <FolderOpen className="w-3 h-3 text-emerald-700" /> Arsip Digital
              </a>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tautan folder berhasil disimpan!
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Data langsung disinkronkan ke Supabase &amp; dapat dibuka seluruh perangkat.
                </span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Konfigurasi Tautan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: MODE API LOGIN FIREBASE (OPSIONAL / TINGKAT LANJUT) */}
      {activeTabMode === 'api-login' && (
        <div className="space-y-4 text-xs animate-in fade-in duration-150">
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Mode ini menggunakan Google OAuth Popup melalui Firebase Authentication. Jika terjadi kendala domain atau gagal login Firebase, sangat disarankan menggunakan tab <strong>Google Apps Script (Otomatis)</strong> yang bekerja 100% tanpa Firebase.
          </p>

          {/* Error notice if domain authorization failed */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
              {isDomainError && (
                <div className="pt-2 border-t border-red-200/80 text-[11px] text-red-800 space-y-2">
                  <p>
                    <strong>Solusi Paling Praktis:</strong> Beralih ke <strong>Google Apps Script (Otomatis)</strong> untuk unggah langsung ke Google Drive tanpa autentikasi Firebase.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('apps-script')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#023126] text-amber-300 rounded font-bold hover:bg-[#034436] transition-colors cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5" /> Gunakan Google Apps Script
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('folder-link')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      <FolderSync className="w-3.5 h-3.5" /> Atau Mode Tautan Folder
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {connected ? (
            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    Akun Google Drive API Aktif
                  </span>
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {googleUser?.email || accountEmail || 'Akun Madrasah'}
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
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <p className="text-[11px] text-slate-600">
                Klik tombol di bawah untuk masuk menggunakan akun Google madrasah:
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-60"
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
                <span>Masuk dengan Google (Google Drive API)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
