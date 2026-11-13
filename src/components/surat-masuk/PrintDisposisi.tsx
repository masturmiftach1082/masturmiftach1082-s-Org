import { SuratMasuk, MadrasahSettings } from '../../types';
import MadrasahKop from '../common/MadrasahKop';
import { formatDateIndo } from '../../utils/formatters';
import { Printer, X } from 'lucide-react';

interface PrintDisposisiProps {
  isOpen: boolean;
  onClose: () => void;
  surat: SuratMasuk | null;
  settings: MadrasahSettings;
}

export default function PrintDisposisi({
  isOpen,
  onClose,
  surat,
  settings,
}: PrintDisposisiProps) {
  if (!isOpen || !surat) return null;

  const handlePrint = () => {
    window.print();
  };

  const disp = surat.disposisi;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto preview-scrollbar">
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Floating Print Action Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Pratinjau Lembar Disposisi Resmi</span>
            <span className="text-xs text-slate-400">· Agenda #{surat.nomorAgenda}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Lembar Disposisi
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Page Area */}
        <div className="p-8 md:p-12 text-slate-900 bg-white min-h-[700px] text-xs">
          {/* Official Kop Madrasah */}
          <MadrasahKop settings={settings} subTitle="LEMBAR DISPOSISI KEPALA MADRASAH" />

          {/* Table Surat Masuk Info */}
          <table className="w-full border-collapse border border-slate-900 mb-4 text-xs">
            <tbody>
              <tr>
                <td className="w-36 p-2 border border-slate-900 font-semibold bg-slate-50">Surat Dari</td>
                <td className="p-2 border border-slate-900" colSpan={3}>{surat.pengirim}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Nomor Surat</td>
                <td className="p-2 border border-slate-900 font-mono">{surat.nomorSuratPengirim}</td>
                <td className="w-32 p-2 border border-slate-900 font-semibold bg-slate-50">Tgl. Surat</td>
                <td className="w-40 p-2 border border-slate-900">{formatDateIndo(surat.tanggalSurat)}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Tanggal Diterima</td>
                <td className="p-2 border border-slate-900">{formatDateIndo(surat.tanggalDiterima)}</td>
                <td className="p-2 border border-slate-900 font-semibold bg-slate-50">No. Agenda</td>
                <td className="p-2 border border-slate-900 font-mono font-bold text-emerald-900 text-sm">
                  {surat.nomorAgenda} / {surat.tahunAgenda}
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Sifat Surat</td>
                <td className="p-2 border border-slate-900 font-medium">
                  {disp?.sifat || surat.sifat} {disp?.batasWaktu ? `(Batas Waktu: ${formatDateIndo(disp.batasWaktu)})` : ''}
                </td>
                <td className="p-2 border border-slate-900 font-semibold bg-slate-50">Kategori</td>
                <td className="p-2 border border-slate-900">{surat.kategori}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold bg-slate-50 align-top">Perihal</td>
                <td className="p-2 border border-slate-900 font-medium" colSpan={3}>
                  {surat.perihal}
                  {surat.ringkasan && (
                    <p className="mt-1 text-[11px] text-slate-600 font-normal italic">
                      Ringkasan: {surat.ringkasan}
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Disposition Routing & Instruction Grid */}
          <div className="grid grid-cols-2 border border-slate-900 mb-6">
            {/* Left: Diteruskan Kepada */}
            <div className="p-3 border-r border-slate-900">
              <p className="font-bold uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-300">
                DITERUSKAN KEPADA SDR :
              </p>
              <ul className="space-y-1.5 text-xs">
                {disp?.tujuanDisposisi && disp.tujuanDisposisi.length > 0 ? (
                  disp.tujuanDisposisi.map((t, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-[10px]">✓</span>
                      <span className="font-medium">{t}</span>
                    </li>
                  ))
                ) : (
                  <li className="italic text-slate-500">Belum didisposisikan</li>
                )}
              </ul>
            </div>

            {/* Right: Instruksi / Petunjuk */}
            <div className="p-3">
              <p className="font-bold uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-300">
                DISPOSISI / PETUNJUK KEPALA :
              </p>
              <ul className="space-y-1.5 text-xs">
                {disp?.instruksi && disp.instruksi.length > 0 ? (
                  disp.instruksi.map((ins, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-[10px]">✓</span>
                      <span>{ins}</span>
                    </li>
                  ))
                ) : (
                  <li className="italic text-slate-500">-</li>
                )}
              </ul>
            </div>
          </div>

          {/* Catatan Khusus Kepala Madrasah */}
          <div className="border border-slate-900 p-3 mb-8 min-h-[90px]">
            <p className="font-bold uppercase tracking-wider text-[11px] mb-1">
              CATATAN KHUSUS KEPALA MADRASAH :
            </p>
            <p className="text-xs leading-relaxed italic text-slate-800">
              {disp?.catatanKepala || '(Tidak ada catatan khusus. Selesaikan sesuai petunjuk dan ketentuan yang berlaku.)'}
            </p>
          </div>

          {/* Signature Box */}
          <div className="flex justify-between items-end pt-4">
            <div className="text-left text-[11px] text-slate-600 space-y-1">
              <p>Lembar ini harus dikembalikan ke Operator Madrasah</p>
              <p>setelah dilaksanakan / ditindaklanjuti.</p>
              <p className="font-mono text-[10px] text-slate-400 mt-2">SIPAS MI Ma'arif Al Ihsan Soborejo</p>
            </div>

            <div className="text-center text-xs">
              <p>Soborejo, {formatDateIndo(disp?.tanggalDisposisi || surat.tanggalDiterima)}</p>
              <p className="font-bold mt-0.5">Kepala Madrasah,</p>
              <div className="h-16" /> {/* Stamp / sign space */}
              <p className="font-bold underline text-sm">{settings.kepalaMadrasah}</p>
              <p className="text-[11px] text-slate-700">NIP. {settings.nipKepalaMadrasah}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
