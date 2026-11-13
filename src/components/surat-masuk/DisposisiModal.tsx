import { useState, useEffect, useRef } from 'react';
import { SuratMasuk, Disposisi, UserProfile } from '../../types';
import { X, SendHorizontal, Clock, CheckSquare } from 'lucide-react';

interface DisposisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  surat: SuratMasuk | null;
  currentUser: UserProfile;
  onSave: (suratId: string, disposisiData: Omit<Disposisi, 'id' | 'suratMasukId'>) => void;
}

const TUJUAN_OPTIONS = [
  'Waka Kurikulum (Nurul Hidayah, S.Pd.I)',
  'Waka Kesiswaan & Ekstra',
  'Operator Madrasah (Siti Aminah, S.Pd.)',
  'Bendahara Madrasah / BOS',
  'Tim Sarpras & Kebersihan',
  'Dewan Guru Kelas I - VI',
  'Guru Pembina UKS / Olahraga',
];

const INSTRUKSI_OPTIONS = [
  'Untuk dipedomani & diketahui',
  'Tindak lanjuti & selesaikan segera',
  'Siapkan bahan / laporan / jawaban',
  'Hadiri / Wakili Kepala Madrasah',
  'Koordinasikan dengan Dewan Guru / Wali Santri',
  'Jadwalkan kegiatan internal madrasah',
  'Arsipkan dalam map dokumen terkait',
];

export default function DisposisiModal({
  isOpen,
  onClose,
  surat,
  currentUser,
  onSave,
}: DisposisiModalProps) {
  const [sifat, setSifat] = useState<'Biasa' | 'Penting' | 'Segera' | 'Sangat Segera' | 'Rahasia'>('Segera');
  const [batasWaktu, setBatasWaktu] = useState('');
  const [selectedTujuan, setSelectedTujuan] = useState<string[]>([]);
  const [selectedInstruksi, setSelectedInstruksi] = useState<string[]>([]);
  const [catatanKepala, setCatatanKepala] = useState('');

  const wasOpenRef = useRef(false);
  const prevSuratIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !surat) {
      wasOpenRef.current = false;
      prevSuratIdRef.current = null;
      return;
    }

    if (wasOpenRef.current && prevSuratIdRef.current === surat.id) {
      return;
    }
    wasOpenRef.current = true;
    prevSuratIdRef.current = surat.id;

    if (surat.disposisi) {
      setSifat(surat.disposisi.sifat);
      setBatasWaktu(surat.disposisi.batasWaktu || '');
      setSelectedTujuan(surat.disposisi.tujuanDisposisi || []);
      setSelectedInstruksi(surat.disposisi.instruksi || []);
      setCatatanKepala(surat.disposisi.catatanKepala || '');
    } else {
      setSifat('Segera');
      setBatasWaktu('');
      setSelectedTujuan(['Waka Kurikulum (Nurul Hidayah, S.Pd.I)']);
      setSelectedInstruksi(['Tindak lanjuti & selesaikan segera']);
      setCatatanKepala('');
    }
  }, [isOpen, surat]);

  if (!isOpen || !surat) return null;

  const toggleTujuan = (item: string) => {
    setSelectedTujuan((prev) =>
      prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]
    );
  };

  const toggleInstruksi = (item: string) => {
    setSelectedInstruksi((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTujuan.length === 0) {
      alert('Pilih minimal satu penerima disposisi.');
      return;
    }
    onSave(surat.id, {
      tanggalDisposisi: new Date().toISOString().split('T')[0],
      sifat,
      batasWaktu: batasWaktu || undefined,
      tujuanDisposisi: selectedTujuan,
      instruksi: selectedInstruksi,
      catatanKepala: catatanKepala.trim(),
      diberikanOleh: currentUser.name,
      status: 'Menunggu',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400/60 bg-gradient-to-r from-[#023126] via-[#034436] to-[#01221b] text-white">
          <div>
            <h3 className="text-base font-semibold leading-tight text-white">
              Lembar Disposisi Kepala Madrasah
            </h3>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Agenda #{surat.nomorAgenda} · {surat.perihal}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Info Surat */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor & Tanggal Surat:</span>
              <span className="font-semibold text-slate-800">{surat.nomorSuratPengirim} ({surat.tanggalSurat})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pengirim Surat:</span>
              <span className="font-medium text-slate-800">{surat.pengirim}</span>
            </div>
          </div>

          {/* Sifat & Batas Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sifat Disposisi
              </label>
              <select
                value={sifat}
                onChange={(e) => setSifat(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
                <option value="Segera">Segera</option>
                <option value="Sangat Segera">Sangat Segera</option>
                <option value="Rahasia">Rahasia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Batas Waktu Penyelesaian
              </label>
              <input
                type="date"
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Diteruskan Kepada */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Diteruskan Kepada (Pilih Pejabat / Staf Madrasah):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {TUJUAN_OPTIONS.map((item) => {
                const checked = selectedTujuan.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleTujuan(item)}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-colors ${
                      checked
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CheckSquare className={`w-4 h-4 shrink-0 mt-0.5 ${checked ? 'text-emerald-700' : 'text-slate-300'}`} />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Petunjuk / Instruksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Petunjuk / Instruksi Kepala Madrasah:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {INSTRUKSI_OPTIONS.map((item) => {
                const checked = selectedInstruksi.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInstruksi(item)}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-colors ${
                      checked
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CheckSquare className={`w-4 h-4 shrink-0 mt-0.5 ${checked ? 'text-emerald-700' : 'text-slate-300'}`} />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan Khusus */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Khusus / Pesan Tambahan:
            </label>
            <textarea
              rows={3}
              value={catatanKepala}
              onChange={(e) => setCatatanKepala(e.target.value)}
              placeholder="Contoh: Mohon koordinasikan dengan pihak komite terkait ketersediaan tempat wudhu santri..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-400/80 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <SendHorizontal className="w-3.5 h-3.5" /> Simpan & Berikan Disposisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
