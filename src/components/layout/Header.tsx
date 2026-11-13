import { MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  Menu,
  Calendar,
  Lock,
  LogOut,
  ShieldCheck,
  Eye,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenMobileSidebar: () => void;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Utama', subtitle: 'Ringkasan & Statistik Persuratan' },
  'surat-masuk': { title: 'Surat Masuk', subtitle: 'Buku Agenda & Disposisi Digital' },
  'surat-keluar': { title: 'Surat Keluar', subtitle: 'Penomoran Otomatis Resmi 0xx/Mis.11.23.14.14/...' },
  'surat-keputusan': { title: 'Surat Keputusan', subtitle: 'Ketetapan & Regulasi Kepala Madrasah' },
  arsip: { title: 'Arsip Digital', subtitle: 'Penyimpanan Google Drive Madrasah' },
  laporan: { title: 'Laporan & Agenda', subtitle: 'Buku Register & Lembar Cetak Dinas' },
  pengguna: { title: 'Administrator & Keamanan', subtitle: 'Autentikasi & Hak Akses Persuratan' },
  pengaturan: { title: 'Pengaturan Sistem', subtitle: 'Identitas, Penomoran, & Integrasi' },
};

export default function Header({
  currentTab,
  onOpenMobileSidebar,
  settings,
  currentUser,
  onOpenLoginModal,
  onLogout,
  isSyncing = false,
  onManualSync,
}: HeaderProps) {
  const info = TAB_TITLES[currentTab] || { title: 'SIPAS', subtitle: settings.namaMadrasah };
  const todayFormatted = formatDateIndo(new Date().toISOString().split('T')[0]);
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-amber-500/20 shadow-xs px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 lg:hidden"
        >
          <Menu className="w-5 h-5 text-emerald-900" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="text-emerald-950 font-semibold">SIPAS</span>
            <span className="text-amber-500">/</span>
            <span className="text-amber-700 font-bold">{info.title}</span>
          </div>
          <h2 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
            {info.subtitle}
          </h2>
        </div>
      </div>

      {/* Right: Date, Mode Status & Admin Login/Logout */}
      <div className="flex items-center gap-3">
        {/* Date indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-500/30">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-medium">{todayFormatted}</span>
        </div>

        {/* Quick Google Drive Folder Access */}
        {settings.googleDriveConfig?.driveFolderUrl && (
          <a
            href={settings.googleDriveConfig.driveFolderUrl}
            target="_blank"
            rel="noreferrer"
            title="Buka Folder Google Drive MI Ma'arif Al Ihsan Soborejo (Tanpa Autentikasi Firebase)"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-300 shadow-2xs transition-all active:scale-95"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xl:inline">Folder Drive Madrasah</span>
            <span className="xl:hidden">Drive</span>
          </a>
        )}

        {/* Live Multi-Device Cloud Sync Indicator */}
        <button
          type="button"
          onClick={onManualSync}
          title="Sinkronisasi Cloud Supabase Multi-Perangkat Aktif. Klik untuk memuat ulang data terbaru."
          className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 transition-all cursor-pointer shadow-2xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-[11px]">Multi-Perangkat Tersinkron</span>
        </button>

        {/* Mode Indicator & Auth Action */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50/40 border border-amber-500/40 text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-left leading-tight">
                <span className="font-bold text-emerald-950 block">Administrator</span>
                <span className="text-[10px] text-amber-800 font-semibold">Mode Kelola Penuh</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
              title="Keluar ke Mode Hanya Lihat"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-[11px]">Mode Hanya Lihat</span>
            </div>

            <button
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xs border border-amber-400/80 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-950" />
              <span>Masuk Admin</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
