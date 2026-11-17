import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';

interface ExportMenuButtonProps {
  onExportExcel: () => void;
  onExportCSV: () => void;
  recordCount: number;
  label?: string;
}

export default function ExportMenuButton({
  onExportExcel,
  onExportCSV,
  recordCount,
  label = 'Ekspor Excel / CSV',
}: ExportMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<'xlsx' | 'csv' | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const triggerExport = (format: 'xlsx' | 'csv') => {
    if (format === 'xlsx') {
      onExportExcel();
    } else {
      onExportCSV();
    }
    setOpen(false);
    setExportedFormat(format);
    setTimeout(() => setExportedFormat(null), 2200);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={`Ekspor ${recordCount} data tampilan saat ini ke Excel (.xlsx) atau CSV`}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
      >
        {exportedFormat ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-800 font-semibold">
              {exportedFormat === 'xlsx' ? 'Excel Diunduh' : 'CSV Diunduh'}
            </span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>{label}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 rounded">
              {recordCount}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-40 py-1.5 animate-in fade-in duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-800">Ekspor Tampilan Saat Ini</p>
            <p className="text-[10px] text-slate-500">
              {recordCount} baris sesuai filter &amp; pencarian aktif
            </p>
          </div>

          <button
            type="button"
            onClick={() => triggerExport('xlsx')}
            className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-emerald-50/80 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Excel Workbook (.xlsx)</p>
              <p className="text-[10px] text-slate-500">
                Lengkap kop madrasah, kolom rapi, siap cetak &amp; pelaporan
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => triggerExport('csv')}
            className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Data CSV (.csv)</p>
              <p className="text-[10px] text-slate-500">
                Format UTF-8 BOM untuk Excel &amp; pertukaran basis data
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
