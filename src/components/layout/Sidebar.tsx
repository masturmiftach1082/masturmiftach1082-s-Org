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
    { id: 'pengguna', label: 'Pengguna & Role', icon: Users },
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
        className={`fixed top-0 bottom-0 left-0 z-40 bg-emerald-950 text-slate-200 flex flex-col transition-all duration-300 ease-in-out border-r border-emerald-900/60 no-print ${
          isOpen ? 'w-64' : 'w-20'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-emerald-900/80 bg-emerald-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={settings.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg'}
              alt="Logo MI Ma'arif Al Ihsan Soborejo"
              className="w-10 h-10 object-contain rounded-full border border-emerald-400/30 shrink-0"
              referrerPolicy="no-referrer"
            />
            {isOpen && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-white text-base tracking-tight font-sans">
                  SIPAS
                </span>
                <p className="text-[10px] text-emerald-300/90 font-medium truncate">
                  MI Ma'arif Al Ihsan Soborejo
                </p>
              </div>
            )}
          </div>

          {/* Close for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer group relative ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-300/60'}`} />
                {isOpen && <span className="truncate flex-1 text-left">{item.label}</span>}

                {/* Badge */}
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isOpen
                        ? 'bg-emerald-500 text-emerald-950'
                        : 'absolute top-1.5 right-2 w-2 h-2 rounded-full bg-emerald-400'
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
        <div className="p-3 border-t border-emerald-900/80 bg-emerald-950/80">
          {isOpen ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-900/40">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="truncate text-xs">
                  <p className="font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-300 truncate">{currentUser.jabatan}</p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="hidden lg:flex p-1.5 text-emerald-300 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                title="Ciutkan Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onToggle}
                className="p-2 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
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
