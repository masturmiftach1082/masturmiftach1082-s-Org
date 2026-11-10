import { MadrasahSettings } from '../../types';

interface MadrasahKopProps {
  settings: MadrasahSettings;
  subTitle?: string;
}

export default function MadrasahKop({ settings, subTitle }: MadrasahKopProps) {
  return (
    <div className="w-full pb-3 mb-6 border-b-4 border-double border-slate-900 text-center relative select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Logo Madrasah */}
        <div className="w-20 h-20 shrink-0 flex items-center justify-center">
          <img
            src={settings.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg'}
            alt="Logo MI Ma'arif Al Ihsan Soborejo"
            className="w-18 h-18 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Institution Text */}
        <div className="flex-1 text-center">
          <p className="text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-800">
            Lembaga Pendidikan Ma'arif NU Kabupaten Temanggung
          </p>
          <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-emerald-900 my-0.5">
            {settings.namaMadrasah}
          </h2>
          <p className="text-[11px] font-medium text-slate-700 tracking-wide">
            STATUS: TERAKREDITASI "A" (UNGGUL) · NSM: {settings.nsm} · NPSN: {settings.npsn}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Alamat: {settings.alamat}, Kec. {settings.kecamatan}, Kab. {settings.kabupaten} {settings.kodePos}
          </p>
          <p className="text-[10px] text-slate-600">
            Telp: {settings.telepon} · Email: {settings.email} · Website: {settings.website}
          </p>
        </div>

        {/* Balance spacer for print centering */}
        <div className="w-20 shrink-0 hidden md:block" />
      </div>

      {subTitle && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            {subTitle}
          </h3>
        </div>
      )}
    </div>
  );
}
