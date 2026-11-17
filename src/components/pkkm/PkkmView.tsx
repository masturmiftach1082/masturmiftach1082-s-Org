import { useState, useMemo, useEffect } from 'react';
import {
  PkkmDokumen,
  PkkmKomponenId,
  MadrasahSettings,
  UserProfile,
} from '../../types';
import { getPkkmKomponenById, PkkmSubMenu } from '../../data/pkkmStructure';
import {
  formatDateIndo,
  formatDateTimeIndo,
  formatFileSize,
  exportToCSV,
  exportToExcel,
} from '../../utils/formatters';
import ExportMenuButton from '../common/ExportMenuButton';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  HardDrive,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardCheck,
  Filter,
} from 'lucide-react';

interface PkkmViewProps {
  komponenId: PkkmKomponenId;
  dokumenList: PkkmDokumen[];
  settings: MadrasahSettings;
  currentUser: UserProfile;
  onAddNew: (komponenId: PkkmKomponenId, subMenuId: string, subItemId?: string) => void;
  onEdit: (dok: PkkmDokumen) => void;
  onDelete: (id: string) => void;
  onViewDocument: (dok: PkkmDokumen) => void;
  onEditBerkas: (dok: PkkmDokumen) => void;
  onOpenLoginModal: () => void;
}

export default function PkkmView({
  komponenId,
  dokumenList,
  settings,
  currentUser,
  onAddNew,
  onEdit,
  onDelete,
  onViewDocument,
  onEditBerkas,
  onOpenLoginModal,
}: PkkmViewProps) {
  const komponen = getPkkmKomponenById(komponenId);
  const canManage = currentUser.role === 'admin';

  const [activeSubMenuTab, setActiveSubMenuTab] = useState<string>(komponen.subMenus[0].id);
  const [activeSubItemTab, setActiveSubItemTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Reset active submenu tab & sub-item filter when switching PKKM component in sidebar
  useEffect(() => {
    setActiveSubMenuTab(komponen.subMenus[0].id);
    setActiveSubItemTab('ALL');
    setSearchTerm('');
  }, [komponenId, komponen.subMenus]);

  // Reset sub-item filter when changing submenu tab
  const handleSelectSubMenuTab = (subMenuId: string) => {
    setActiveSubMenuTab(subMenuId);
    setActiveSubItemTab('ALL');
  };

  const activeSubMenuObj: PkkmSubMenu | undefined = useMemo(
    () => komponen.subMenus.find((sm) => sm.id === activeSubMenuTab),
    [komponen.subMenus, activeSubMenuTab]
  );

  // All docs belonging to this Komponen
  const komponenDocs = useMemo(
    () => dokumenList.filter((d) => d.komponenId === komponenId),
    [dokumenList, komponenId]
  );

  // Available years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(komponenDocs.map((d) => d.tahun)));
    if (!years.includes(2026)) years.push(2026);
    if (!years.includes(2025)) years.push(2025);
    return years.sort((a, b) => b - a);
  }, [komponenDocs]);

  // Count docs per submenu tab
  const subMenuCounts = useMemo(() => {
    const counts: Record<string, { total: number; lengkap: number }> = {};
    for (const sm of komponen.subMenus) {
      const matched = komponenDocs.filter((d) => d.subMenuId === sm.id);
      counts[sm.id] = {
        total: matched.length,
        lengkap: matched.filter((d) => d.statusVerifikasi === 'Lengkap').length,
      };
    }
    return counts;
  }, [komponen.subMenus, komponenDocs]);

  // Count docs per sub-item inside the currently selected submenu (for Komponen 4)
  const subItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!activeSubMenuObj?.subItems) return counts;
    for (const si of activeSubMenuObj.subItems) {
      counts[si.id] = komponenDocs.filter(
        (d) => d.subMenuId === activeSubMenuObj.id && d.subItemId === si.id
      ).length;
    }
    return counts;
  }, [activeSubMenuObj, komponenDocs]);

  const fulfilledSubMenusCount = useMemo(
    () => komponen.subMenus.filter((sm) => (subMenuCounts[sm.id]?.total || 0) > 0).length,
    [komponen.subMenus, subMenuCounts]
  );

  const lengkapCount = useMemo(
    () => komponenDocs.filter((d) => d.statusVerifikasi === 'Lengkap').length,
    [komponenDocs]
  );

  // Filtered table rows for current view (active tab / sub-tab / filters)
  const filteredDocs = useMemo(() => {
    return komponenDocs.filter((d) => {
      const matchSubMenu =
        activeSubMenuTab === 'ALL' || d.subMenuId === activeSubMenuTab;
      const matchSubItem =
        activeSubItemTab === 'ALL' || d.subItemId === activeSubItemTab;
      const matchYear = selectedYear === 'ALL' || String(d.tahun) === selectedYear;
      const matchStatus =
        selectedStatus === 'ALL' || d.statusVerifikasi === selectedStatus;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        d.judulDokumen.toLowerCase().includes(q) ||
        d.kodeDokumen.toLowerCase().includes(q) ||
        d.penanggungJawab.toLowerCase().includes(q) ||
        d.keterangan.toLowerCase().includes(q);

      return matchSubMenu && matchSubItem && matchYear && matchStatus && matchSearch;
    });
  }, [komponenDocs, activeSubMenuTab, activeSubItemTab, selectedYear, selectedStatus, searchTerm]);

  const resolveSubLabels = (dok: PkkmDokumen) => {
    const sm = komponen.subMenus.find((s) => s.id === dok.subMenuId);
    const si = sm?.subItems?.find((i) => i.id === dok.subItemId);
    return {
      subMenuText: sm ? `${sm.kode} ${sm.fullTitle}` : dok.subMenuId,
      subItemText: si ? `${si.kode} ${si.label}` : '-',
    };
  };

  // Excel / CSV Export
  const getExportData = () => {
    const headers = [
      'Kode Dokumen',
      'Komponen PKKM',
      'Sub-Menu',
      'Rincian Sub-Indikator',
      'Judul Dokumen / Bukti Fisik',
      'Tahun Pelajaran',
      'Tahun',
      'Tanggal Dokumen',
      'Penanggung Jawab',
      'Status Kelengkapan',
      'Keterangan',
      'Nama Berkas',
      'Tautan Google Drive',
      'Dicatat Oleh',
    ];

    const rows = filteredDocs.map((d) => {
      const { subMenuText, subItemText } = resolveSubLabels(d);
      return [
        d.kodeDokumen,
        `${komponen.nomor}. ${komponen.title}`,
        subMenuText,
        subItemText,
        d.judulDokumen,
        `TP ${d.tahunAjaran}`,
        d.tahun,
        d.tanggalDokumen,
        d.penanggungJawab,
        d.statusVerifikasi,
        d.keterangan || '-',
        d.fileDoc ? d.fileDoc.fileName : '-',
        d.fileDoc ? d.fileDoc.driveUrl || d.fileDoc.fileId : '-',
        d.createdBy || '-',
      ];
    });

    const activeTabLabel =
      activeSubMenuTab === 'ALL'
        ? 'Semua Sub-Menu'
        : activeSubMenuObj
        ? `${activeSubMenuObj.kode} ${activeSubMenuObj.fullTitle}`
        : activeSubMenuTab;

    const filterSummary = [
      `Sub-Menu: ${activeTabLabel}`,
      activeSubItemTab !== 'ALL' && activeSubMenuObj?.subItems
        ? `Rincian: ${activeSubMenuObj.subItems.find((i) => i.id === activeSubItemTab)?.label || activeSubItemTab}`
        : '',
      `Tahun: ${selectedYear === 'ALL' ? 'Semua' : selectedYear}`,
      `Status: ${selectedStatus === 'ALL' ? 'Semua' : selectedStatus}`,
      searchTerm.trim() ? `Pencarian: "${searchTerm.trim()}"` : '',
      `Total Tampil: ${filteredDocs.length} dokumen`,
    ]
      .filter(Boolean)
      .join(' · ');

    const baseFilename = `PKKM_${komponen.id}_${activeSubMenuTab}_${settings.namaMadrasah.replace(/\s+/g, '_')}`;
    return { headers, rows, filterSummary, baseFilename };
  };

  const handleExportCSV = () => {
    const { baseFilename, headers, rows } = getExportData();
    exportToCSV(baseFilename, headers, rows);
  };

  const handleExportExcel = () => {
    const { baseFilename, headers, rows, filterSummary } = getExportData();
    exportToExcel({
      filename: baseFilename,
      sheetName: `PKKM ${komponen.title}`.slice(0, 31),
      title: `PKKM ${komponen.nomor}. ${komponen.title.toUpperCase()} - ${settings.namaMadrasah.toUpperCase()}`,
      subtitle: `${settings.alamat} · NSM: ${settings.nsm} · NPSN: ${settings.npsn}`,
      metaLines: [
        `Filter Tampilan: ${filterSummary}`,
        `Diekspor pada: ${formatDateTimeIndo(new Date().toISOString())}`,
      ],
      headers,
      rows,
    });
  };

  const handleAddClick = () => {
    const defaultSub =
      activeSubMenuTab === 'ALL' ? komponen.subMenus[0].id : activeSubMenuTab;
    const defaultItem =
      activeSubItemTab === 'ALL' ? undefined : activeSubItemTab;
    onAddNew(komponenId, defaultSub, defaultItem);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span>PKKM Madrasah</span>
            <span aria-hidden="true">·</span>
            <span>Komponen {komponen.nomor} dari 4</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {komponen.nomor}. {komponen.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{komponen.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ExportMenuButton
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            recordCount={filteredDocs.length}
          />
          {canManage ? (
            <button
              type="button"
              onClick={handleAddClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bukti Fisik</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Masuk Admin untuk Kelola</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Total Bukti Fisik</p>
          <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {komponenDocs.length} <span className="text-xs font-sans font-normal text-slate-500">dokumen</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Cakupan Sub-Menu</p>
          <p className="text-lg font-bold font-mono tabular-nums text-emerald-800 mt-0.5">
            {fulfilledSubMenusCount} / {komponen.subMenus.length}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">terisi</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Status Lengkap</p>
          <p className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {lengkapCount}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">terverifikasi</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">Tampil Saat Ini</p>
          <p className="text-lg font-bold font-mono tabular-nums text-amber-700 mt-0.5">
            {filteredDocs.length}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">baris data</span>
          </p>
        </div>
      </div>

      {/* Submenu Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 px-3 pt-2.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-0 preview-scrollbar">
            <button
              type="button"
              onClick={() => handleSelectSubMenuTab('ALL')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeSubMenuTab === 'ALL'
                  ? 'bg-white text-emerald-950 border-emerald-700 shadow-2xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Semua Sub-Menu</span>
              <span className="font-mono tabular-nums text-[11px] text-slate-400">
                ({komponenDocs.length})
              </span>
            </button>

            {komponen.subMenus.map((sm) => {
              const count = subMenuCounts[sm.id]?.total || 0;
              const isSelected = activeSubMenuTab === sm.id;
              return (
                <button
                  key={sm.id}
                  type="button"
                  onClick={() => handleSelectSubMenuTab(sm.id)}
                  title={sm.fullTitle}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-emerald-950 border-emerald-700 shadow-2xs'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {count > 0 && (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-emerald-700' : 'text-emerald-600'
                      }`}
                    />
                  )}
                  <span>{sm.tabLabel}</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Context & Secondary Sub-Item Tabs (for Komponen 4) */}
        {activeSubMenuObj && (
          <div className="px-4 py-3 bg-emerald-50/40 border-b border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-emerald-800">
                  Indikator Sub-Menu {activeSubMenuObj.kode}
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeSubMenuObj.fullTitle}
                </h3>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() =>
                    onAddNew(
                      komponenId,
                      activeSubMenuObj.id,
                      activeSubItemTab !== 'ALL' ? activeSubItemTab : undefined
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Unggah ke Sub-Menu {activeSubMenuObj.kode}</span>
                </button>
              )}
            </div>

            {activeSubMenuObj.subItems && activeSubMenuObj.subItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={() => setActiveSubItemTab('ALL')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSubItemTab === 'ALL'
                      ? 'bg-[#023126] text-amber-300 shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua Rincian ({subMenuCounts[activeSubMenuObj.id]?.total || 0})
                </button>
                {activeSubMenuObj.subItems.map((si) => {
                  const itemCount = subItemCounts[si.id] || 0;
                  const isSiActive = activeSubItemTab === si.id;
                  return (
                    <button
                      key={si.id}
                      type="button"
                      onClick={() => setActiveSubItemTab(si.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSiActive
                          ? 'bg-[#023126] text-amber-300 shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {si.kode} {si.label} ({itemCount})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Filters Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul dokumen, kode, penanggung jawab..."
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="ALL">Semua Status</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Proses">Proses</option>
            <option value="Revisi">Revisi</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-32">Kode</th>
                <th className="py-2.5 px-3">Judul Dokumen &amp; Sub-Indikator</th>
                <th className="py-2.5 px-3 w-32">Tahun / Tanggal</th>
                <th className="py-2.5 px-3 w-40">Penanggung Jawab</th>
                <th className="py-2.5 px-3 w-28">Status</th>
                <th className="py-2.5 px-3 w-44">Berkas Lampiran</th>
                <th className="py-2.5 px-3 w-36 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((dok) => {
                  const { subMenuText, subItemText } = resolveSubLabels(dok);
                  return (
                    <tr key={dok.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-3 align-top font-mono font-semibold text-emerald-950 whitespace-nowrap">
                        {dok.kodeDokumen}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <p className="font-semibold text-slate-900">{dok.judulDokumen}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {subMenuText}
                          {subItemText !== '-' ? ` · ${subItemText}` : ''}
                        </p>
                        {dok.keterangan && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                            {dok.keterangan}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <p className="font-medium text-slate-800 font-mono tabular-nums">
                          TP {dok.tahunAjaran}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatDateIndo(dok.tanggalDokumen)}
                        </p>
                      </td>
                      <td className="py-3 px-3 align-top text-slate-700">
                        {dok.penanggungJawab}
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {dok.statusVerifikasi === 'Lengkap' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lengkap</span>
                          </span>
                        )}
                        {dok.statusVerifikasi === 'Proses' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Proses</span>
                          </span>
                        )}
                        {dok.statusVerifikasi === 'Revisi' && (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Revisi</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top">
                        {dok.fileDoc ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => onViewDocument(dok)}
                              className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-medium underline cursor-pointer text-left max-w-[165px]"
                              title={`Pratinjau ${dok.fileDoc.fileName}`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{dok.fileDoc.fileName}</span>
                            </button>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                              <span>{formatFileSize(dok.fileDoc.fileSize)}</span>
                              {dok.fileDoc.driveUrl && (
                                <a
                                  href={dok.fileDoc.driveUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 text-emerald-700 hover:underline font-sans"
                                >
                                  <HardDrive className="w-2.5 h-2.5" /> Drive
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada berkas</span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          {dok.fileDoc && (
                            <button
                              type="button"
                              onClick={() => onViewDocument(dok)}
                              title="Pratinjau Dokumen"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Pratinjau</span>
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditBerkas(dok)}
                                title="Ganti / Koreksi Berkas"
                                className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEdit(dok)}
                                title="Edit Metadata Dokumen"
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Hapus bukti fisik "${dok.judulDokumen}"?`)) {
                                    onDelete(dok.id);
                                  }
                                }}
                                title="Hapus Dokumen"
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      Belum ada bukti fisik untuk sub-menu ini
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {activeSubMenuObj
                        ? `Tambahkan dokumen pendukung untuk indikator "${activeSubMenuObj.fullTitle}".`
                        : `Tambahkan dokumen pendukung untuk ${komponen.title}.`}
                    </p>
                    {canManage && (
                      <button
                        type="button"
                        onClick={handleAddClick}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Bukti Fisik Pertama</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
