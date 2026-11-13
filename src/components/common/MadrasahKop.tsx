import { MadrasahSettings, KopSuratConfig } from '../../types';

interface MadrasahKopProps {
  settings: MadrasahSettings;
  subTitle?: string;
}

const TITLE_COLOR_MAP: Record<KopSuratConfig['warnaJudul'], string> = {
  emerald: 'text-emerald-900',
  slate: 'text-slate-900',
  blue: 'text-blue-900',
  green: 'text-green-900',
  amber: 'text-amber-900',
};

const BORDER_COLOR_MAP: Record<KopSuratConfig['warnaGarisBawah'], string> = {
  slate: 'border-slate-900',
  emerald: 'border-emerald-900',
  blue: 'border-blue-900',
  green: 'border-green-900',
  amber: 'border-amber-800',
};

const LOGO_BOX_SIZE: Record<KopSuratConfig['ukuranLogo'], string> = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

const LOGO_IMG_SIZE: Record<KopSuratConfig['ukuranLogo'], string> = {
  sm: 'w-14 h-14',
  md: 'w-18 h-18',
  lg: 'w-22 h-22',
};

export default function MadrasahKop({ settings, subTitle }: MadrasahKopProps) {
  const defaultKop: KopSuratConfig = {
    baris1Instansi: "Lembaga Pendidikan Ma'arif NU Kabupaten Temanggung",
    baris2Judul: settings.namaMadrasah,
    baris3Status: `STATUS: TERAKREDITASI "A" (UNGGUL) · NSM: ${settings.nsm} · NPSN: ${settings.npsn}`,
    baris4Alamat: `Alamat: ${settings.alamat}, Kec. ${settings.kecamatan}, Kab. ${settings.kabupaten} ${settings.kodePos}`,
    baris5Kontak: `Telp: ${settings.telepon} · Email: ${settings.email} · Website: ${settings.website}`,
    baris6Tambahan: '',
    tampilkanLogo: true,
    posisiLogo: 'left',
    logoKananUrl: '',
    ukuranLogo: 'md',
    perataanTeks: 'center',
    warnaJudul: 'emerald',
    gayaGarisBawah: 'double',
    warnaGarisBawah: 'slate',
  };

  const kop: KopSuratConfig = {
    ...defaultKop,
    ...(settings.kopSurat || {}),
  };

  const primaryLogoSrc = settings.logoUrl || '/src/assets/images/madrasah_logo_1794281106438.jpg';
  const secondaryLogoSrc = kop.logoKananUrl || primaryLogoSrc;

  const titleColorClass = TITLE_COLOR_MAP[kop.warnaJudul] || TITLE_COLOR_MAP.emerald;
  const borderColorClass = BORDER_COLOR_MAP[kop.warnaGarisBawah] || BORDER_COLOR_MAP.slate;
  const boxSizeClass = LOGO_BOX_SIZE[kop.ukuranLogo] || LOGO_BOX_SIZE.md;
  const imgSizeClass = LOGO_IMG_SIZE[kop.ukuranLogo] || LOGO_IMG_SIZE.md;

  const showLeftLogo = kop.tampilkanLogo && (kop.posisiLogo === 'left' || kop.posisiLogo === 'both');
  const showRightLogo = kop.tampilkanLogo && (kop.posisiLogo === 'right' || kop.posisiLogo === 'both');
  const textAlignClass = kop.perataanTeks === 'left' ? 'text-left' : 'text-center';

  return (
    <div className="w-full mb-6 select-none">
      <div className="flex items-center justify-between gap-4 pb-3">
        {/* Left Logo */}
        {showLeftLogo && (
          <div className={`${boxSizeClass} shrink-0 flex items-center justify-center`}>
            <img
              src={primaryLogoSrc}
              alt={kop.baris2Judul || settings.namaMadrasah}
              className={`${imgSizeClass} object-contain`}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Balance left spacer if text is centered & logo is only on the right */}
        {!showLeftLogo && showRightLogo && kop.perataanTeks === 'center' && (
          <div className={`${boxSizeClass} shrink-0 hidden md:block`} />
        )}

        {/* Institution Text */}
        <div className={`flex-1 ${textAlignClass}`}>
          {kop.baris1Instansi.trim() && (
            <p className="text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-800">
              {kop.baris1Instansi}
            </p>
          )}
          {(kop.baris2Judul.trim() || settings.namaMadrasah) && (
            <h2 className={`text-lg md:text-xl font-extrabold uppercase tracking-wide my-0.5 ${titleColorClass}`}>
              {kop.baris2Judul.trim() || settings.namaMadrasah}
            </h2>
          )}
          {kop.baris3Status.trim() && (
            <p className="text-[11px] font-medium text-slate-700 tracking-wide">
              {kop.baris3Status}
            </p>
          )}
          {kop.baris4Alamat.trim() && (
            <p className="text-[10px] text-slate-600 mt-0.5">
              {kop.baris4Alamat}
            </p>
          )}
          {kop.baris5Kontak.trim() && (
            <p className="text-[10px] text-slate-600">
              {kop.baris5Kontak}
            </p>
          )}
          {kop.baris6Tambahan?.trim() && (
            <p className="text-[10px] italic text-slate-500 mt-0.5">
              {kop.baris6Tambahan}
            </p>
          )}
        </div>

        {/* Right Logo */}
        {showRightLogo && (
          <div className={`${boxSizeClass} shrink-0 flex items-center justify-center`}>
            <img
              src={kop.posisiLogo === 'right' ? primaryLogoSrc : secondaryLogoSrc}
              alt={kop.baris2Judul || settings.namaMadrasah}
              className={`${imgSizeClass} object-contain`}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Balance right spacer for centering when logo is only on the left */}
        {showLeftLogo && !showRightLogo && kop.perataanTeks === 'center' && (
          <div className={`${boxSizeClass} shrink-0 hidden md:block`} />
        )}
      </div>

      {/* Bottom Separator Line */}
      {kop.gayaGarisBawah === 'double' && (
        <div className={`border-b-4 border-double ${borderColorClass}`} />
      )}
      {kop.gayaGarisBawah === 'thick-thin' && (
        <div>
          <div className={`border-b-[3px] ${borderColorClass}`} />
          <div className={`mt-[2px] border-b ${borderColorClass}`} />
        </div>
      )}
      {kop.gayaGarisBawah === 'solid' && (
        <div className={`border-b-2 ${borderColorClass}`} />
      )}

      {subTitle && (
        <div className="mt-3 pt-2 text-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            {subTitle}
          </h3>
        </div>
      )}
    </div>
  );
}
