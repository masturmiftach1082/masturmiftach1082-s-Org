import { useState, useEffect, useCallback } from 'react';
import {
  MadrasahSettings,
  UserProfile,
  SuratMasuk,
  SuratKeluar,
  SuratKeputusan,
  ArsipDigital,
  ActivityLog,
  GoogleDriveMetadata,
} from './types';
import { storageService } from './services/storageService';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Views
import DashboardView from './components/dashboard/DashboardView';
import SuratMasukList from './components/surat-masuk/SuratMasukList';
import SuratKeluarList from './components/surat-keluar/SuratKeluarList';
import SuratKeputusanList from './components/surat-keputusan/SuratKeputusanList';
import ArsipDigitalList from './components/arsip/ArsipDigitalList';
import LaporanView from './components/laporan/LaporanView';
import PenggunaList from './components/pengguna/PenggunaList';
import PengaturanView from './components/pengaturan/PengaturanView';

// Modals
import SuratMasukModal from './components/surat-masuk/SuratMasukModal';
import SuratMasukDetailModal from './components/surat-masuk/SuratMasukDetailModal';
import DisposisiModal from './components/surat-masuk/DisposisiModal';
import PrintDisposisi from './components/surat-masuk/PrintDisposisi';
import SuratKeluarModal from './components/surat-keluar/SuratKeluarModal';
import SuratKeluarDetailModal from './components/surat-keluar/SuratKeluarDetailModal';
import SuratKeputusanModal from './components/surat-keputusan/SuratKeputusanModal';
import ArsipDigitalModal from './components/arsip/ArsipDigitalModal';
import DocumentViewerModal from './components/common/DocumentViewerModal';
import LoginAdminModal from './components/auth/LoginAdminModal';

export default function App() {
  // Navigation & Layout
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data State
  const [settings, setSettings] = useState<MadrasahSettings>(() => storageService.getSettings());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storageService.getActiveUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => storageService.getUsers());
  const [suratMasukList, setSuratMasukList] = useState<SuratMasuk[]>(() => storageService.getSuratMasuk());
  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>(() => storageService.getSuratKeluar());
  const [skList, setSKList] = useState<SuratKeputusan[]>(() => storageService.getSuratKeputusan());
  const [arsipList, setArsipList] = useState<ArsipDigital[]>(() => storageService.getArsipDigital());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => storageService.getActivityLogs());

  // Modal States - Surat Masuk
  const [isSuratMasukModalOpen, setIsSuratMasukModalOpen] = useState(false);
  const [suratMasukToEdit, setSuratMasukToEdit] = useState<SuratMasuk | null>(null);
  const [isSuratMasukDetailOpen, setIsSuratMasukDetailOpen] = useState(false);
  const [selectedSuratMasuk, setSelectedSuratMasuk] = useState<SuratMasuk | null>(null);
  const [isDisposisiModalOpen, setIsDisposisiModalOpen] = useState(false);
  const [suratForDisposisi, setSuratForDisposisi] = useState<SuratMasuk | null>(null);
  const [isPrintDisposisiOpen, setIsPrintDisposisiOpen] = useState(false);
  const [suratForPrintDisposisi, setSuratForPrintDisposisi] = useState<SuratMasuk | null>(null);

  // Modal States - Surat Keluar
  const [isSuratKeluarModalOpen, setIsSuratKeluarModalOpen] = useState(false);
  const [suratKeluarToEdit, setSuratKeluarToEdit] = useState<SuratKeluar | null>(null);
  const [isSuratKeluarDetailOpen, setIsSuratKeluarDetailOpen] = useState(false);
  const [selectedSuratKeluar, setSelectedSuratKeluar] = useState<SuratKeluar | null>(null);

  // Modal States - SK & Arsip
  const [isSKModalOpen, setIsSKModalOpen] = useState(false);
  const [skToEdit, setSKToEdit] = useState<SuratKeputusan | null>(null);
  const [isArsipModalOpen, setIsArsipModalOpen] = useState(false);

  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<GoogleDriveMetadata | undefined>(undefined);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewNomor, setPreviewNomor] = useState('');

  // Administrator Login Modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Cloud Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh all state from storage
  const refreshData = useCallback(() => {
    setSettings(storageService.getSettings());
    setAllUsers(storageService.getUsers());
    setSuratMasukList(storageService.getSuratMasuk());
    setSuratKeluarList(storageService.getSuratKeluar());
    setSKList(storageService.getSuratKeputusan());
    setArsipList(storageService.getArsipDigital());
    setActivityLogs(storageService.getActivityLogs());
  }, []);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    await storageService.syncFromSupabase();
    refreshData();
    setTimeout(() => setIsSyncing(false), 600);
  }, [refreshData]);

  // Real-time Cloud Synchronization (Multi-Device Engine)
  useEffect(() => {
    // 1. Initial background sync
    setIsSyncing(true);
    storageService.syncFromSupabase().then(() => {
      refreshData();
      setIsSyncing(false);
    });

    // 2. Realtime listener: triggers whenever another device modifies data in Supabase
    const unsubscribeRealtime = storageService.subscribeToRealtime(() => {
      refreshData();
    });

    // 3. Multi-tab synchronization on the same browser
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.startsWith('sipas_')) {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Focus & visibility sync: when device turns on or tab is active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        storageService.syncFromSupabase().then(() => {
          refreshData();
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener('storage', handleStorageEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [refreshData]);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    storageService.logoutToViewer();
    setCurrentUser(storageService.getActiveUser());
    refreshData();
  };

  const handleLoginSuccess = (adminUser: UserProfile) => {
    setCurrentUser(adminUser);
    refreshData();
  };

  // Surat Masuk Handlers
  const handleOpenAddSuratMasuk = () => {
    setSuratMasukToEdit(null);
    setIsSuratMasukModalOpen(true);
  };

  const handleEditSuratMasuk = (surat: SuratMasuk) => {
    setSuratMasukToEdit(surat);
    setIsSuratMasukModalOpen(true);
  };

  const handleDeleteSuratMasuk = (id: string) => {
    storageService.deleteSuratMasuk(id, currentUser);
    refreshData();
  };

  const handleViewSuratMasukDetail = (surat: SuratMasuk) => {
    setSelectedSuratMasuk(surat);
    setIsSuratMasukDetailOpen(true);
  };

  const handleOpenDisposisi = (surat: SuratMasuk) => {
    setSuratForDisposisi(surat);
    setIsDisposisiModalOpen(true);
  };

  const handleSaveDisposisi = (suratId: string, disposisiData: any) => {
    storageService.saveDisposisi(suratId, disposisiData, currentUser);
    refreshData();
  };

  const handlePrintDisposisi = (surat: SuratMasuk) => {
    setSuratForPrintDisposisi(surat);
    setIsPrintDisposisiOpen(true);
  };

  // Surat Keluar Handlers
  const handleOpenAddSuratKeluar = () => {
    setSuratKeluarToEdit(null);
    setIsSuratKeluarModalOpen(true);
  };

  const handleEditSuratKeluar = (surat: SuratKeluar) => {
    setSuratKeluarToEdit(surat);
    setIsSuratKeluarModalOpen(true);
  };

  const handleDeleteSuratKeluar = (id: string) => {
    storageService.deleteSuratKeluar(id, currentUser);
    refreshData();
  };

  const handleViewSuratKeluarDetail = (surat: SuratKeluar) => {
    setSelectedSuratKeluar(surat);
    setIsSuratKeluarDetailOpen(true);
  };

  // SK Handlers
  const handleOpenAddSK = () => {
    setSKToEdit(null);
    setIsSKModalOpen(true);
  };

  const handleEditSK = (sk: SuratKeputusan) => {
    setSKToEdit(sk);
    setIsSKModalOpen(true);
  };

  const handleDeleteSK = (id: string) => {
    storageService.deleteSuratKeputusan(id, currentUser);
    refreshData();
  };

  // Arsip Handlers
  const handleDeleteArsip = (id: string) => {
    storageService.deleteArsipDigital(id, currentUser);
    refreshData();
  };

  // Generic Document Preview in Google Drive Modal
  const handleOpenDocViewer = (fileDoc: GoogleDriveMetadata, title: string, nomor?: string) => {
    setDocToPreview(fileDoc);
    setPreviewTitle(title);
    setPreviewNomor(nomor || '');
    setIsDocViewerOpen(true);
  };

  // Pending letters for notification
  const pendingMasukCount = suratMasukList.filter(
    (s) => s.status === 'Baru Diterima' || !s.disposisi
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Sidebar Component */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        settings={settings}
        currentUser={currentUser}
        pendingMasukCount={pendingMasukCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {/* Header Component */}
        <Header
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          settings={settings}
          currentUser={currentUser}
          onOpenLoginModal={handleOpenLoginModal}
          onLogout={handleLogout}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              suratMasukList={suratMasukList}
              suratKeluarList={suratKeluarList}
              skList={skList}
              arsipList={arsipList}
              activityLogs={activityLogs}
              settings={settings}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onAddSuratMasuk={handleOpenAddSuratMasuk}
              onAddSuratKeluar={handleOpenAddSuratKeluar}
              onAddSK={handleOpenAddSK}
              onViewSuratMasuk={handleViewSuratMasukDetail}
              onViewSuratKeluar={handleViewSuratKeluarDetail}
            />
          )}

          {currentTab === 'surat-masuk' && (
            <SuratMasukList
              suratList={suratMasukList}
              settings={settings}
              currentUser={currentUser}
              onAddNew={handleOpenAddSuratMasuk}
              onEdit={handleEditSuratMasuk}
              onDelete={handleDeleteSuratMasuk}
              onViewDetail={handleViewSuratMasukDetail}
              onOpenDisposisi={handleOpenDisposisi}
              onPrintDisposisi={handlePrintDisposisi}
              onPrintAgendaBook={() => setCurrentTab('laporan')}
            />
          )}

          {currentTab === 'surat-keluar' && (
            <SuratKeluarList
              suratList={suratKeluarList}
              settings={settings}
              currentUser={currentUser}
              onAddNew={handleOpenAddSuratKeluar}
              onEdit={handleEditSuratKeluar}
              onDelete={handleDeleteSuratKeluar}
              onViewDetail={handleViewSuratKeluarDetail}
              onPrintAgendaBook={() => setCurrentTab('laporan')}
            />
          )}

          {currentTab === 'surat-keputusan' && (
            <SuratKeputusanList
              skList={skList}
              settings={settings}
              currentUser={currentUser}
              onAddNew={handleOpenAddSK}
              onEdit={handleEditSK}
              onDelete={handleDeleteSK}
              onViewDocument={(sk) => {
                if (sk.fileDoc) handleOpenDocViewer(sk.fileDoc, sk.judul, sk.nomorSK);
              }}
            />
          )}

          {currentTab === 'arsip' && (
            <ArsipDigitalList
              arsipList={arsipList}
              settings={settings}
              currentUser={currentUser}
              onAddNew={() => setIsArsipModalOpen(true)}
              onDelete={handleDeleteArsip}
              onViewDocument={(arsip) => {
                handleOpenDocViewer(arsip.fileDoc, arsip.judulArsip, arsip.kodeArsip);
              }}
            />
          )}

          {currentTab === 'laporan' && (
            <LaporanView
              suratMasukList={suratMasukList}
              suratKeluarList={suratKeluarList}
              skList={skList}
              settings={settings}
            />
          )}

          {currentTab === 'pengguna' && (
            <PenggunaList
              users={allUsers}
              currentUser={currentUser}
              settings={settings}
              onOpenLoginModal={handleOpenLoginModal}
              onPasswordChanged={refreshData}
            />
          )}

          {currentTab === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              currentUser={currentUser}
              onSettingsSaved={(newSettings) => {
                setSettings(newSettings);
                refreshData();
              }}
            />
          )}
        </main>

        {/* Global Footer (Hidden on print) */}
        <footer className="no-print mt-auto py-4 px-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-900">SIPAS</span>
            <span>·</span>
            <span>{settings.namaMadrasah}</span>
            <span>·</span>
            <span>NSM: {settings.nsm}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Terintegrasi Google Drive Cloud & Supabase
          </div>
        </footer>
      </div>

      {/* --- ALL MODALS --- */}
      {/* 1. Surat Masuk Add/Edit Modal */}
      <SuratMasukModal
        isOpen={isSuratMasukModalOpen}
        onClose={() => setIsSuratMasukModalOpen(false)}
        suratToEdit={suratMasukToEdit}
        currentUser={currentUser}
        onSaved={refreshData}
      />

      {/* 2. Surat Masuk Detail Modal */}
      <SuratMasukDetailModal
        isOpen={isSuratMasukDetailOpen}
        onClose={() => setIsSuratMasukDetailOpen(false)}
        surat={selectedSuratMasuk}
        settings={settings}
        currentUser={currentUser}
        onEdit={handleEditSuratMasuk}
        onDelete={handleDeleteSuratMasuk}
        onOpenDisposisi={handleOpenDisposisi}
        onPrintDisposisi={handlePrintDisposisi}
        onViewDocument={(s) => {
          if (s.fileDoc) handleOpenDocViewer(s.fileDoc, s.perihal, s.nomorSuratPengirim);
        }}
      />

      {/* 3. Disposisi Modal */}
      <DisposisiModal
        isOpen={isDisposisiModalOpen}
        onClose={() => setIsDisposisiModalOpen(false)}
        surat={suratForDisposisi}
        currentUser={currentUser}
        onSave={handleSaveDisposisi}
      />

      {/* 4. Print Disposisi Modal */}
      <PrintDisposisi
        isOpen={isPrintDisposisiOpen}
        onClose={() => setIsPrintDisposisiOpen(false)}
        surat={suratForPrintDisposisi}
        settings={settings}
      />

      {/* 5. Surat Keluar Add/Edit Modal */}
      <SuratKeluarModal
        isOpen={isSuratKeluarModalOpen}
        onClose={() => setIsSuratKeluarModalOpen(false)}
        suratToEdit={suratKeluarToEdit}
        settings={settings}
        currentUser={currentUser}
        onSaved={refreshData}
      />

      {/* 6. Surat Keluar Detail Modal */}
      <SuratKeluarDetailModal
        isOpen={isSuratKeluarDetailOpen}
        onClose={() => setIsSuratKeluarDetailOpen(false)}
        surat={selectedSuratKeluar}
        settings={settings}
        currentUser={currentUser}
        onEdit={handleEditSuratKeluar}
        onDelete={handleDeleteSuratKeluar}
        onViewDocument={(s) => {
          if (s.fileDoc) handleOpenDocViewer(s.fileDoc, s.perihal, s.nomorSuratLengkap);
        }}
      />

      {/* 7. Surat Keputusan Add/Edit Modal */}
      <SuratKeputusanModal
        isOpen={isSKModalOpen}
        onClose={() => setIsSKModalOpen(false)}
        skToEdit={skToEdit}
        settings={settings}
        currentUser={currentUser}
        onSaved={refreshData}
      />

      {/* 8. Arsip Digital Modal */}
      <ArsipDigitalModal
        isOpen={isArsipModalOpen}
        onClose={() => setIsArsipModalOpen(false)}
        currentUser={currentUser}
        onSaved={refreshData}
      />

      {/* 9. Google Drive Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        fileDoc={docToPreview}
        title={previewTitle}
        nomorSurat={previewNomor}
        settings={settings}
      />

      {/* 10. Administrator Password Login Modal */}
      <LoginAdminModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        settings={settings}
      />
    </div>
  );
}
