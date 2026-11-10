import { useState } from 'react';
import { MadrasahSettings, UserProfile } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  Menu,
  User,
  ChevronDown,
  Shield,
  CheckCircle2,
  Calendar,
  LogOut,
  Building,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenMobileSidebar: () => void;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Utama', subtitle: 'Ringkasan & Statistik Persuratan' },
  'surat-masuk': { title: 'Surat Masuk', subtitle: 'Buku Agenda & Disposisi Digital' },
  'surat-keluar': { title: 'Surat Keluar', subtitle: 'Penomoran Otomatis Resmi 0xx/Mis.11.23.14.14/...' },
  'surat-keputusan': { title: 'Surat Keputusan', subtitle: 'Ketetapan & Regulasi Kepala Madrasah' },
  arsip: { title: 'Arsip Digital', subtitle: 'Penyimpanan Google Drive Madrasah' },
  laporan: { title: 'Laporan & Agenda', subtitle: 'Buku Register & Lembar Cetak Dinas' },
  pengguna: { title: 'Pengguna & Role', subtitle: 'Manajemen Staf & Hak Akses' },
  pengaturan: { title: 'Pengaturan Sistem', subtitle: 'Identitas, Penomoran, & Integrasi' },
};

export default function Header({
  currentTab,
  onOpenMobileSidebar,
  settings,
  currentUser,
  allUsers,
  onSwitchUser,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const info = TAB_TITLES[currentTab] || { title: 'SIPAS', subtitle: settings.namaMadrasah };
  const todayFormatted = formatDateIndo(new Date().toISOString().split('T')[0]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>SIPAS</span>
            <span>/</span>
            <span className="text-emerald-800 font-semibold">{info.title}</span>
          </div>
          <h2 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
            {info.subtitle}
          </h2>
        </div>
      </div>

      {/* Right: Date, School Name, User Switcher */}
      <div className="flex items-center gap-3">
        {/* Date indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          <span>{todayFormatted}</span>
        </div>

        {/* User Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 md:px-3 md:py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500/60 transition-colors bg-white shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left text-xs leading-tight">
              <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-800 font-medium">
                {currentUser.jabatan}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Switcher Dropdown */}
          {isDropdownOpen && (
            <>
              <div
                onClick={() => setIsDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900">
                    Role: {currentUser.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="py-2">
                  <span className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Ganti Profil Staf Madrasah:
                  </span>
                  <div className="space-y-1">
                    {allUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-50 text-emerald-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate text-xs font-semibold">{u.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{u.jabatan}</p>
                          </div>
                          {isCurrent && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  SIPAS · MI Ma'arif Al Ihsan Soborejo
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
