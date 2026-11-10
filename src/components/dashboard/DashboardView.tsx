import { useMemo } from 'react';
import {
  SuratMasuk,
  SuratKeluar,
  SuratKeputusan,
  ArsipDigital,
  ActivityLog,
  MadrasahSettings,
  UserProfile,
} from '../../types';
import { formatDateIndo, formatDateTimeIndo } from '../../utils/formatters';
import {
  Inbox,
  Send,
  Award,
  Archive,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileSignature,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface DashboardViewProps {
  suratMasukList: SuratMasuk[];
  suratKeluarList: SuratKeluar[];
  skList: SuratKeputusan[];
  arsipList: ArsipDigital[];
  activityLogs: ActivityLog[];
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onAddSuratMasuk: () => void;
  onAddSuratKeluar: () => void;
  onAddSK: () => void;
  onViewSuratMasuk: (surat: SuratMasuk) => void;
  onViewSuratKeluar: (surat: SuratKeluar) => void;
}

export default function DashboardView({
  suratMasukList,
  suratKeluarList,
  skList,
  arsipList,
  activityLogs,
  settings,
  currentUser,
  onNavigate,
  onAddSuratMasuk,
  onAddSuratKeluar,
  onAddSK,
  onViewSuratMasuk,
  onViewSuratKeluar,
}: DashboardViewProps) {
  const currentYear = new Date().getFullYear();

  // Yearly counts
  const countMasukTahunIni = useMemo(
    () => suratMasukList.filter((s) => s.tahunAgenda === currentYear).length,
    [suratMasukList, currentYear]
  );
  const countKeluarTahunIni = useMemo(
    () => suratKeluarList.filter((s) => s.tahunSurat === currentYear).length,
    [suratKeluarList, currentYear]
  );
  const countSKTahunIni = useMemo(
    () => skList.filter((s) => s.tahun === currentYear).length,
    [skList, currentYear]
  );

  // Pending disposisi count
  const pendingDisposisi = useMemo(
    () => suratMasukList.filter((s) => s.status === 'Baru Diterima' || !s.disposisi).length,
    [suratMasukList]
  );

  // Monthly breakdown for bar chart (Jan - Des)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = months.map((m, idx) => {
      const monthNum = idx + 1;
      const masuk = suratMasukList.filter((s) => {
        if (s.tahunAgenda !== currentYear) return false;
        const d = new Date(s.tanggalDiterima);
        return d.getMonth() + 1 === monthNum;
      }).length;

      const keluar = suratKeluarList.filter((s) => {
        if (s.tahunSurat !== currentYear) return false;
        const d = new Date(s.tanggalSurat);
        return d.getMonth() + 1 === monthNum;
      }).length;

      return { month: m, masuk, keluar };
    });
    return counts;
  }, [suratMasukList, suratKeluarList, currentYear]);

  // Max value for scaling
  const maxMonthlyVal = useMemo(() => {
    let max = 4;
    monthlyData.forEach((d) => {
      if (d.masuk > max) max = d.masuk;
      if (d.keluar > max) max = d.keluar;
    });
    return max;
  }, [monthlyData]);

  // Recent combined letters
  const recentMasuk = useMemo(() => suratMasukList.slice(0, 4), [suratMasukList]);
  const recentKeluar = useMemo(() => suratKeluarList.slice(0, 4), [suratKeluarList]);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white relative overflow-hidden shadow-sm">
        {/* Subtle patterned backdrop */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <img
            src={settings.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg'}
            alt=""
            className="w-64 h-64 object-contain filter invert"
          />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Tahun Ajaran Aktif 2025/2026 · Tahun Administrasi {currentYear}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Selamat Datang di SIPAS
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
            Sistem Informasi Pengelolaan Arsip dan Surat Terpadu <strong>{settings.namaMadrasah}</strong>.
            Kendalikan penomoran otomatis, buku agenda, disposisi digital, dan arsip dokumen madrasah secara terintegrasi.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onAddSuratMasuk}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-900 font-bold text-xs rounded-lg hover:bg-emerald-50 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" /> Catat Surat Masuk
            </button>
            <button
              onClick={onAddSuratKeluar}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg border border-emerald-500/50 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Terbitkan Surat Keluar
            </button>
            <button
              onClick={onAddSK}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg border border-emerald-500/50 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" /> Tetapkan SK Baru
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Surat Masuk */}
        <div
          onClick={() => onNavigate('surat-masuk')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Surat Masuk</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {suratMasukList.length}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {countMasukTahunIni} tahun {currentYear}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Perlu Disposisi: <strong>{pendingDisposisi}</strong></span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
          </div>
        </div>

        {/* Card 2: Surat Keluar */}
        <div
          onClick={() => onNavigate('surat-keluar')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Surat Keluar</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {suratKeluarList.length}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {countKeluarTahunIni} tahun {currentYear}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Nomor Terakhir: <strong>#{String(countKeluarTahunIni).padStart(3, '0')}</strong></span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
          </div>
        </div>

        {/* Card 3: Surat Keputusan */}
        <div
          onClick={() => onNavigate('surat-keputusan')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Surat Keputusan (SK)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {skList.length}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {countSKTahunIni} tahun {currentYear}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status Berlaku: <strong>{skList.filter((s) => s.status === 'Berlaku').length}</strong></span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
          </div>
        </div>

        {/* Card 4: Arsip Digital */}
        <div
          onClick={() => onNavigate('arsip')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/60 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Arsip Digital Google Drive</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {arsipList.length}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              Tersinkron Cloud
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Dokumen: <strong>{suratMasukList.length + suratKeluarList.length + arsipList.length}</strong></span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Middle Row: Monthly Bar Chart & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Aktivitas Surat Masuk & Keluar per Bulan ({currentYear})
              </h3>
              <p className="text-[11px] text-slate-500">
                Perbandingan volume persuratan resmi MI Ma'arif Al Ihsan Soborejo
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700" /> Surat Masuk
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" /> Surat Keluar
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-1 border-b border-slate-200 pb-1">
              {monthlyData.map((d, i) => {
                const masukHeight = Math.max((d.masuk / maxMonthlyVal) * 100, 4);
                const keluarHeight = Math.max((d.keluar / maxMonthlyVal) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-36">
                      {/* Surat Masuk Bar */}
                      <div
                        style={{ height: `${d.masuk > 0 ? masukHeight : 4}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          d.masuk > 0 ? 'bg-emerald-700 group-hover:bg-emerald-800' : 'bg-slate-100'
                        }`}
                        title={`Surat Masuk ${d.month}: ${d.masuk}`}
                      />
                      {/* Surat Keluar Bar */}
                      <div
                        style={{ height: `${d.keluar > 0 ? keluarHeight : 4}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          d.keluar > 0 ? 'bg-teal-400 group-hover:bg-teal-500' : 'bg-slate-100'
                        }`}
                        title={`Surat Keluar ${d.month}: ${d.keluar}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-800">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
              <span>Bulan Januari s.d. Desember {currentYear}</span>
              <span>Data bersumber dari database register SIPAS</span>
            </div>
          </div>
        </div>

        {/* Quick Identity & System Health (1 col) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <img
              src={settings.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg'}
              alt="Logo"
              className="w-12 h-12 object-contain rounded-full border border-emerald-500/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="text-xs font-bold uppercase text-emerald-950 leading-tight">
                {settings.namaMadrasah}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                NSM: {settings.nsm} · NPSN: {settings.npsn}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Kode Penomoran Madrasah:</span>
              <span className="font-mono font-bold text-emerald-900">{settings.kodeMadrasah}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Kepala Madrasah:</span>
              <span className="font-semibold text-slate-800">{settings.kepalaMadrasah}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Status Google Drive:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Basis Data:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Aktif
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('pengaturan')}
            className="w-full text-center py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            Buka Pengaturan Sistem
          </button>
        </div>
      </div>

      {/* Bottom Row: Recent Surat Masuk & Recent Surat Keluar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Surat Masuk Terbaru */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Surat Masuk Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('surat-masuk')}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentMasuk.map((surat) => (
              <div
                key={surat.id}
                onClick={() => onViewSuratMasuk(surat)}
                className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px]">
                      #{surat.nomorAgenda}
                    </span>
                    <span className="font-semibold text-slate-900 line-clamp-1">{surat.pengirim}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-1 text-[11px]">{surat.perihal}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">{formatDateIndo(surat.tanggalDiterima)}</span>
                  <span className="text-[10px] font-semibold text-emerald-800">{surat.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surat Keluar Terbaru */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Surat Keluar Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('surat-keluar')}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentKeluar.map((surat) => (
              <div
                key={surat.id}
                onClick={() => onViewSuratKeluar(surat)}
                className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-900 text-[11px]">
                      {surat.nomorSuratLengkap}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-1 text-[11px]">
                    Tujuan: <strong>{surat.tujuanSurat}</strong> · {surat.perihal}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">{formatDateIndo(surat.tanggalSurat)}</span>
                  <span className="text-[10px] font-semibold text-emerald-800">{surat.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Logs Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" /> Riwayat Aktivitas & Audit Administrasi
          </h4>
          <span className="text-[11px] text-slate-400">Pencatatan waktu nyata</span>
        </div>
        <div className="divide-y divide-slate-100">
          {activityLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="py-2 flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-slate-800">{log.userName}:</span>
                <span className="text-slate-600 truncate">{log.details || log.action}</span>
              </div>
              <span className="font-mono text-slate-400 text-[10px] shrink-0">
                {formatDateTimeIndo(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
