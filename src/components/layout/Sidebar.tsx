import { MadrasahSettings, UserProfile } from '../../types';
import {
  LayoutDashboard,
  Inbox,
  Send,
  Award,
  Archive,
  BookOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  settings: MadrasahSettings;
  currentUser: UserProfile;
  pendingMasukCount: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
  settings,
  currentUser,
  pendingMasukCount,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'surat-masuk',
      label: 'Surat Masuk',
      icon: Inbox,
      badge: pendingMasukCount > 0 ? pendingMasukCount : undefined,
    },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: Send },
    { id: 'surat-keputusan', label: 'Surat Keputusan', icon: Award },
    { id: 'arsip', label: 'Arsip Digital', icon: Archive },
    { id: 'laporan', label: 'Laporan & Agenda', icon: BookOpen },
    { id: 'pengguna', label: 'Hak Akses Admin', icon: Shield },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-gradient-to-b from-[#023126] via-[#034436] to-[#01221b] text-slate-100 flex flex-col transition-all duration-300 ease-in-out border-r border-amber-500/30 shadow-xl shadow-emerald-950/40 no-print ${
          isOpen ? 'w-64' : 'w-20'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-amber-500/25 bg-[#022a21]/90">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-500 shadow-sm shrink-0">
              <img
                src={settings.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg'}
                alt="Logo MI Ma'arif Al Ihsan Soborejo"
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
            {isOpen && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-base tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 drop-shadow-xs">
                  SIPAS
                </span>
                <p className="text-[10px] text-amber-100/90 font-medium truncate">
                  MI Ma'arif Al Ihsan Soborejo
                </p>
              </div>
            )}
          </div>

          {/* Close for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-800/90 to-[#065e4d] text-amber-300 border-l-3 border-amber-400 shadow-md shadow-emerald-950/30'
                    : 'text-emerald-100/75 hover:bg-emerald-900/40 hover:text-amber-200'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-amber-400 drop-shadow-xs' : 'text-amber-300/60 group-hover:text-amber-300'}`} />
                {isOpen && <span className="truncate flex-1 text-left">{item.label}</span>}

                {/* Badge */}
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isOpen
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 shadow-xs'
                        : 'absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400'
                    }`}
                  >
                    {isOpen ? item.badge : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Collapse Toggle */}
        <div className="p-3 border-t border-amber-500/20 bg-[#01221b]/95">
          {isOpen ? (
            <div className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
              currentUser.role === 'admin'
                ? 'bg-gradient-to-r from-[#033a2d] to-[#044c3c] border border-amber-500/40 shadow-xs'
                : 'bg-emerald-950/60 border border-emerald-900/50'
            }`}>
              <div className="flex items-center gap-2.5 truncate">
                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                  currentUser.role === 'admin'
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 border-amber-300 font-extrabold'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  {currentUser.role === 'admin' ? 'A' : 'T'}
                </div>
                <div className="truncate text-xs">
                  <p className="font-bold text-amber-100 truncate">{currentUser.name}</p>
                  <p className={`text-[10px] truncate ${currentUser.role === 'admin' ? 'text-amber-300/90 font-medium' : 'text-slate-400'}`}>
                    {currentUser.jabatan}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="hidden lg:flex p-1.5 text-amber-300/80 hover:text-amber-200 rounded hover:bg-emerald-800/60 transition-colors"
                title="Ciutkan Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onToggle}
                className="p-2 text-amber-300/80 hover:text-amber-200 rounded-lg hover:bg-emerald-900/60 transition-colors"
                title="Perluas Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
