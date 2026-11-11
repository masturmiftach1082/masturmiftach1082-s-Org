import {
  SuratMasuk,
  SuratKeluar,
  SuratKeputusan,
  ArsipDigital,
  MadrasahSettings,
  KlasifikasiSurat,
  UserProfile,
  ActivityLog,
  Disposisi,
} from '../types';
import {
  initialMadrasahSettings,
  initialKlasifikasiSurat,
  initialUsers,
  singleAdministrator,
  guestViewerProfile,
  initialSuratMasuk,
  initialSuratKeluar,
  initialSuratKeputusan,
  initialArsipDigital,
  initialActivityLogs,
} from '../data/initialData';
import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  SETTINGS: 'sipas_settings',
  KLASIFIKASI: 'sipas_klasifikasi',
  USERS: 'sipas_users',
  ACTIVE_USER: 'sipas_active_user',
  SURAT_MASUK: 'sipas_surat_masuk',
  SURAT_KELUAR: 'sipas_surat_keluar',
  SURAT_KEPUTUSAN: 'sipas_surat_keputusan',
  ARSIP: 'sipas_arsip',
  ACTIVITY_LOGS: 'sipas_activity_logs',
  COUNTER_MASUK: 'sipas_counter_masuk_',
  COUNTER_KELUAR: 'sipas_counter_keluar_',
  COUNTER_SK: 'sipas_counter_sk_',
};

const SIPAS_DATA_VERSION_KEY = 'sipas_data_version';
const CURRENT_CLEAN_VERSION = 'v3_admin_password_read_only';

class StorageService {
  constructor() {
    this.ensureCleanProductionData();
  }

  // Wipes all former dummy records & sets up 1 Administrator and Mode Hanya Lihat default
  private ensureCleanProductionData(): void {
    try {
      const ver = localStorage.getItem(SIPAS_DATA_VERSION_KEY);
      if (ver !== CURRENT_CLEAN_VERSION) {
        localStorage.removeItem(STORAGE_KEYS.SURAT_MASUK);
        localStorage.removeItem(STORAGE_KEYS.SURAT_KELUAR);
        localStorage.removeItem(STORAGE_KEYS.SURAT_KEPUTUSAN);
        localStorage.removeItem(STORAGE_KEYS.ARSIP);
        localStorage.removeItem(`${STORAGE_KEYS.COUNTER_MASUK}2025`);
        localStorage.removeItem(`${STORAGE_KEYS.COUNTER_MASUK}2026`);
        localStorage.removeItem(`${STORAGE_KEYS.COUNTER_KELUAR}2025`);
        localStorage.removeItem(`${STORAGE_KEYS.COUNTER_KELUAR}2026`);
        localStorage.removeItem(`${STORAGE_KEYS.COUNTER_SK}2025`);
        localStorage.removeItem(`${STORAGE_KEYS.COUNTER_SK}2026`);

        // Set users list strictly to only 1 Administrator
        this.set(STORAGE_KEYS.USERS, [singleAdministrator]);
        
        // Default to guest/viewer (Mode Hanya Lihat)
        this.set(STORAGE_KEYS.ACTIVE_USER, guestViewerProfile);

        // Force update settings to new Supabase credentials and Administrator password defaults
        const currentSettings = this.get<MadrasahSettings | null>(STORAGE_KEYS.SETTINGS, null);
        if (currentSettings) {
          currentSettings.supabaseConfig = initialMadrasahSettings.supabaseConfig;
          currentSettings.operatorMadrasah = currentSettings.operatorMadrasah || initialMadrasahSettings.operatorMadrasah;
          currentSettings.nipOperatorMadrasah = currentSettings.nipOperatorMadrasah || initialMadrasahSettings.nipOperatorMadrasah;
          currentSettings.formatPenomoranSK = currentSettings.formatPenomoranSK || initialMadrasahSettings.formatPenomoranSK;
          currentSettings.adminPassword = currentSettings.adminPassword || initialMadrasahSettings.adminPassword || 'admin123';
          this.set(STORAGE_KEYS.SETTINGS, currentSettings);
        } else {
          this.set(STORAGE_KEYS.SETTINGS, initialMadrasahSettings);
        }

        this.set(STORAGE_KEYS.ACTIVITY_LOGS, initialActivityLogs);
        localStorage.setItem(SIPAS_DATA_VERSION_KEY, CURRENT_CLEAN_VERSION);
      }
    } catch (e) {
      console.warn('Storage migration notice:', e);
    }
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- SETTINGS ---
  getSettings(): MadrasahSettings {
    const saved = this.get<MadrasahSettings>(STORAGE_KEYS.SETTINGS, initialMadrasahSettings);
    return {
      ...initialMadrasahSettings,
      ...saved,
      operatorMadrasah: saved.operatorMadrasah || initialMadrasahSettings.operatorMadrasah,
      nipOperatorMadrasah: saved.nipOperatorMadrasah || initialMadrasahSettings.nipOperatorMadrasah,
      formatPenomoranSK: saved.formatPenomoranSK || initialMadrasahSettings.formatPenomoranSK || 'XXX Tahun YYYY',
      adminPassword: saved.adminPassword || initialMadrasahSettings.adminPassword || 'admin123',
      supabaseConfig: {
        ...initialMadrasahSettings.supabaseConfig,
        ...(saved.supabaseConfig || {}),
        url: saved.supabaseConfig?.url || initialMadrasahSettings.supabaseConfig.url,
        anonKey: saved.supabaseConfig?.anonKey || initialMadrasahSettings.supabaseConfig.anonKey,
        isConnected: true,
      },
    };
  }

  saveSettings(settings: MadrasahSettings, user?: UserProfile): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    if (user) {
      this.logActivity(user, 'Perubahan Pengaturan', 'Pengaturan', undefined, 'Memperbarui identitas madrasah atau konfigurasi sistem.');
    }

    // Sync to Supabase if connected
    if (supabase) {
      supabase
        .from('pengaturan_madrasah')
        .upsert({ id: 'default_setting', data: settings, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.info('Supabase settings sync notice:', error.message);
        });
    }
  }

  // --- KLASIFIKASI SURAT ---
  getKlasifikasi(): KlasifikasiSurat[] {
    return this.get<KlasifikasiSurat[]>(STORAGE_KEYS.KLASIFIKASI, initialKlasifikasiSurat);
  }

  saveKlasifikasi(list: KlasifikasiSurat[]): void {
    this.set(STORAGE_KEYS.KLASIFIKASI, list);
  }

  // --- USERS & AUTHENTICATION (1 ADMINISTRATOR + READ-ONLY VIEWERS) ---
  getUsers(): UserProfile[] {
    return this.get<UserProfile[]>(STORAGE_KEYS.USERS, [singleAdministrator]);
  }

  saveUsers(users: UserProfile[]): void {
    this.set(STORAGE_KEYS.USERS, users);
  }

  getActiveUser(): UserProfile {
    const saved = this.get<UserProfile | null>(STORAGE_KEYS.ACTIVE_USER, null);
    if (saved) return saved;
    return guestViewerProfile;
  }

  setActiveUser(user: UserProfile): void {
    this.set(STORAGE_KEYS.ACTIVE_USER, user);
  }

  isAdmin(): boolean {
    const current = this.getActiveUser();
    return current.role === 'admin';
  }

  verifyAdminPassword(password: string): boolean {
    const settings = this.getSettings();
    const correct = settings.adminPassword || 'admin123';
    return password.trim() === correct.trim();
  }

  loginAdmin(password: string): { success: boolean; message?: string } {
    if (this.verifyAdminPassword(password)) {
      this.setActiveUser(singleAdministrator);
      this.logActivity(
        singleAdministrator,
        'Masuk Hak Administrator',
        'Auth',
        singleAdministrator.id,
        'Administrator berhasil masuk menggunakan kata sandi. Mode kelola aktif.'
      );
      return { success: true };
    }
    return {
      success: false,
      message: 'Kata sandi Administrator salah. Silakan coba kembali.',
    };
  }

  logoutToViewer(): void {
    const admin = singleAdministrator;
    this.setActiveUser(guestViewerProfile);
    this.logActivity(
      admin,
      'Keluar dari Administrator',
      'Auth',
      undefined,
      'Kembali ke Mode Hanya Lihat (Guest / Tamu).'
    );
  }

  setAdminPassword(newPassword: string, user: UserProfile): void {
    const settings = this.getSettings();
    settings.adminPassword = newPassword;
    this.saveSettings(settings, user);
    this.logActivity(user, 'Ganti Kata Sandi', 'Auth', user.id, 'Kata sandi Administrator berhasil diperbarui.');
  }

  // --- ACTIVITY LOGS ---
  getActivityLogs(): ActivityLog[] {
    return this.get<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, initialActivityLogs);
  }

  logActivity(
    user: UserProfile,
    action: string,
    entityType: ActivityLog['entityType'],
    entityId?: string,
    details: string = ''
  ): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    this.set(STORAGE_KEYS.ACTIVITY_LOGS, logs);

    // Sync activity log to Supabase
    if (supabase) {
      supabase.from('activity_logs').insert({
        id: newLog.id,
        user_id: newLog.userId,
        user_name: newLog.userName,
        action: newLog.action,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId,
        details: newLog.details,
        timestamp: newLog.timestamp,
      }).then(({ error }) => {
        if (error) console.info('Supabase log sync notice:', error.message);
      });
    }
  }

  // --- SEQUENCE COUNTER ENGINE ---
  getNextAgendaSuratMasuk(year: number): string {
    const counterKey = `${STORAGE_KEYS.COUNTER_MASUK}${year}`;
    const all = this.getSuratMasuk();
    const existingInYear = all.filter((s) => s.tahunAgenda === year);
    
    let maxExisting = 0;
    existingInYear.forEach((s) => {
      const num = parseInt(s.nomorAgenda, 10);
      if (!isNaN(num) && num > maxExisting) maxExisting = num;
    });

    const storedCounter = this.get<number>(counterKey, maxExisting);
    const nextVal = Math.max(maxExisting, storedCounter) + 1;
    return String(nextVal).padStart(3, '0');
  }

  commitAgendaSuratMasuk(year: number, agendaNumberStr: string): void {
    const counterKey = `${STORAGE_KEYS.COUNTER_MASUK}${year}`;
    const num = parseInt(agendaNumberStr, 10);
    const current = this.get<number>(counterKey, 0);
    if (num > current) {
      this.set(counterKey, num);
    }
  }

  getNextSuratKeluarInfo(year: number, monthStr: string, kodeKlasifikasi: string): { nomorUrut: number; nomorLengkap: string } {
    const settings = this.getSettings();
    const counterKey = `${STORAGE_KEYS.COUNTER_KELUAR}${year}`;
    const all = this.getSuratKeluar();
    const existingInYear = all.filter((s) => s.tahunSurat === year);

    let maxExisting = 0;
    existingInYear.forEach((s) => {
      if (s.nomorUrut > maxExisting) maxExisting = s.nomorUrut;
    });

    const storedCounter = this.get<number>(counterKey, maxExisting);
    const nextVal = Math.max(maxExisting, storedCounter) + 1;
    const formattedUrut = String(nextVal).padStart(3, '0');
    const kodeMadrasah = settings.kodeMadrasah || 'Mis.11.23.14.14';
    const monthFormatted = String(monthStr).padStart(2, '0');

    // Format: 0xx/Mis.11.23.14.14/PP.00/BB/TTTT
    const nomorLengkap = `${formattedUrut}/${kodeMadrasah}/${kodeKlasifikasi}/${monthFormatted}/${year}`;
    return {
      nomorUrut: nextVal,
      nomorLengkap,
    };
  }

  commitSuratKeluarNumber(year: number, nomorUrut: number): void {
    const counterKey = `${STORAGE_KEYS.COUNTER_KELUAR}${year}`;
    const current = this.get<number>(counterKey, 0);
    if (nomorUrut > current) {
      this.set(counterKey, nomorUrut);
    }
  }

  // Next SK Number
  getNextSKInfo(year: number, monthStr: string): { nomorUrut: number; nomorSK: string } {
    const settings = this.getSettings();
    const counterKey = `${STORAGE_KEYS.COUNTER_SK}${year}`;
    const all = this.getSuratKeputusan();
    const existingInYear = all.filter((s) => s.tahun === year);

    let maxExisting = 0;
    existingInYear.forEach((s) => {
      if (s.nomorUrut > maxExisting) maxExisting = s.nomorUrut;
    });

    const storedCounter = this.get<number>(counterKey, maxExisting);
    const nextVal = Math.max(maxExisting, storedCounter) + 1;
    const formattedUrut = String(nextVal).padStart(3, '0');
    const template = settings.formatPenomoranSK || 'XXX Tahun YYYY';
    const nomorSK = template
      .replace(/XXX/g, formattedUrut)
      .replace(/YYYY/g, String(year));

    return {
      nomorUrut: nextVal,
      nomorSK,
    };
  }

  commitSKNumber(year: number, nomorUrut: number): void {
    const counterKey = `${STORAGE_KEYS.COUNTER_SK}${year}`;
    const current = this.get<number>(counterKey, 0);
    if (nomorUrut > current) {
      this.set(counterKey, nomorUrut);
    }
  }

  // --- CRUD: SURAT MASUK ---
  getSuratMasuk(): SuratMasuk[] {
    return this.get<SuratMasuk[]>(STORAGE_KEYS.SURAT_MASUK, initialSuratMasuk);
  }

  getSuratMasukById(id: string): SuratMasuk | undefined {
    return this.getSuratMasuk().find((s) => s.id === id);
  }

  addSuratMasuk(
    item: Omit<SuratMasuk, 'id' | 'createdAt' | 'updatedAt' | 'nomorAgenda'> & {
      customNomorAgenda?: string;
    },
    user: UserProfile
  ): SuratMasuk {
    const all = this.getSuratMasuk();
    const agenda = item.customNomorAgenda?.trim() || this.getNextAgendaSuratMasuk(item.tahunAgenda);

    const newItem: SuratMasuk = {
      ...item,
      id: `sm-${item.tahunAgenda}-${agenda.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      nomorAgenda: agenda,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.name,
    };

    all.unshift(newItem);
    this.set(STORAGE_KEYS.SURAT_MASUK, all);
    this.commitAgendaSuratMasuk(item.tahunAgenda, agenda);

    this.logActivity(
      user,
      'Registrasi Surat Masuk',
      'Surat Masuk',
      newItem.id,
      `Nomor Agenda #${agenda}: "${newItem.perihal}" dari ${newItem.pengirim}`
    );

    // Sync to Supabase
    if (supabase) {
      supabase.from('surat_masuk').insert({
        id: newItem.id,
        nomor_agenda: newItem.nomorAgenda || '001',
        tahun_agenda: newItem.tahunAgenda || new Date().getFullYear(),
        nomor_surat_pengirim: newItem.nomorSuratPengirim || '-',
        tanggal_surat: newItem.tanggalSurat || new Date().toISOString().split('T')[0],
        tanggal_diterima: newItem.tanggalDiterima || new Date().toISOString().split('T')[0],
        pengirim: newItem.pengirim || '-',
        perihal: newItem.perihal || '-',
        ringkasan: newItem.ringkasan || '',
        kategori: newItem.kategori || 'Dinas / Resmi',
        sifat: newItem.sifat || 'Biasa',
        tujuan_internal: newItem.tujuanInternal || '',
        status: newItem.status || 'Baru Diterima',
        catatan: newItem.catatan || '',
        file_doc: newItem.fileDoc || null,
        disposisi: newItem.disposisi || null,
        created_at: newItem.createdAt || new Date().toISOString(),
        updated_at: newItem.updatedAt || new Date().toISOString(),
        created_by: newItem.createdBy || 'Administrator',
      }).then(({ error }) => {
        if (error) console.warn('Supabase insert notice in surat_masuk:', error.message);
      });
    }

    return newItem;
  }

  updateSuratMasuk(id: string, updates: Partial<SuratMasuk>, user: UserProfile): SuratMasuk {
    const all = this.getSuratMasuk();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Surat Masuk tidak ditemukan');

    const existing = all[idx];
    const updated: SuratMasuk = {
      ...existing,
      ...updates,
      id: existing.id,
      nomorAgenda: updates.nomorAgenda || existing.nomorAgenda,
      tahunAgenda: updates.tahunAgenda || existing.tahunAgenda,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    this.set(STORAGE_KEYS.SURAT_MASUK, all);

    this.logActivity(
      user,
      'Pembaruan Surat Masuk',
      'Surat Masuk',
      updated.id,
      `Memperbarui Agenda #${updated.nomorAgenda}: "${updated.perihal}"`
    );

    // Sync to Supabase
    if (supabase) {
      supabase.from('surat_masuk').update({
        nomor_agenda: updated.nomorAgenda || '001',
        nomor_surat_pengirim: updated.nomorSuratPengirim || '-',
        tanggal_surat: updated.tanggalSurat,
        tanggal_diterima: updated.tanggalDiterima,
        pengirim: updated.pengirim,
        perihal: updated.perihal,
        ringkasan: updated.ringkasan || '',
        kategori: updated.kategori || 'Dinas / Resmi',
        sifat: updated.sifat || 'Biasa',
        tujuan_internal: updated.tujuanInternal || '',
        status: updated.status || 'Baru Diterima',
        catatan: updated.catatan || '',
        file_doc: updated.fileDoc || null,
        disposisi: updated.disposisi || null,
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase update notice in surat_masuk:', error.message);
      });
    }

    return updated;
  }

  deleteSuratMasuk(id: string, user: UserProfile): void {
    const all = this.getSuratMasuk();
    const existing = all.find((s) => s.id === id);
    if (!existing) return;

    const filtered = all.filter((s) => s.id !== id);
    this.set(STORAGE_KEYS.SURAT_MASUK, filtered);

    this.logActivity(
      user,
      'Penghapusan Surat Masuk',
      'Surat Masuk',
      id,
      `Menghapus Agenda #${existing.nomorAgenda} (${existing.perihal}). Nomor agenda tidak digunakan kembali.`
    );

    if (supabase) {
      supabase.from('surat_masuk').delete().eq('id', id).then(({ error }) => {
        if (error) console.info('Supabase delete notice:', error.message);
      });
    }
  }

  saveDisposisi(suratMasukId: string, disposisiData: Omit<Disposisi, 'id' | 'suratMasukId'>, user: UserProfile): SuratMasuk {
    const all = this.getSuratMasuk();
    const idx = all.findIndex((s) => s.id === suratMasukId);
    if (idx === -1) throw new Error('Surat Masuk tidak ditemukan');

    const disp: Disposisi = {
      id: `disp-${Date.now()}`,
      suratMasukId,
      ...disposisiData,
      diberikanOleh: user.name,
    };

    all[idx].disposisi = disp;
    all[idx].status = 'Didisposisikan';
    all[idx].updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.SURAT_MASUK, all);

    this.logActivity(
      user,
      'Pemberian Disposisi',
      'Surat Masuk',
      suratMasukId,
      `Disposisi Agenda #${all[idx].nomorAgenda} kepada ${disp.tujuanDisposisi.join(', ')}: "${disp.catatanKepala}"`
    );

    if (supabase) {
      supabase.from('surat_masuk').update({
        disposisi: disp,
        status: 'Didisposisikan',
        updated_at: all[idx].updatedAt,
      }).eq('id', suratMasukId).then(({ error }) => {
        if (error) console.info('Supabase disposisi notice:', error.message);
      });
    }

    return all[idx];
  }

  // --- CRUD: SURAT KELUAR ---
  getSuratKeluar(): SuratKeluar[] {
    return this.get<SuratKeluar[]>(STORAGE_KEYS.SURAT_KELUAR, initialSuratKeluar);
  }

  getSuratKeluarById(id: string): SuratKeluar | undefined {
    return this.getSuratKeluar().find((s) => s.id === id);
  }

  addSuratKeluar(
    item: Omit<SuratKeluar, 'id' | 'createdAt' | 'updatedAt' | 'nomorUrut' | 'nomorSuratLengkap'> & {
      customNomorSurat?: string;
      customNomorUrut?: number;
    },
    user: UserProfile
  ): SuratKeluar {
    const all = this.getSuratKeluar();
    const dateObj = new Date(item.tanggalSurat || new Date().toISOString().split('T')[0]);
    const year = dateObj.getFullYear() || item.tahunSurat || 2026;
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');

    const nextInfo = this.getNextSuratKeluarInfo(year, monthStr, item.kodeKlasifikasi);

    const isManual = Boolean(item.customNomorSurat?.trim());
    const finalNomorLengkap = isManual ? item.customNomorSurat!.trim() : nextInfo.nomorLengkap;
    const finalNomorUrut = item.customNomorUrut || nextInfo.nomorUrut;

    const newItem: SuratKeluar = {
      ...item,
      id: `sk-${year}-${String(finalNomorUrut).padStart(3, '0')}-${Date.now().toString(36).substring(4, 7)}`,
      nomorUrut: finalNomorUrut,
      nomorSuratLengkap: finalNomorLengkap,
      tahunSurat: year,
      bulanSurat: monthStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.name,
    };

    all.unshift(newItem);
    this.set(STORAGE_KEYS.SURAT_KELUAR, all);
    this.commitSuratKeluarNumber(year, finalNomorUrut);

    this.logActivity(
      user,
      'Penerbitan Surat Keluar',
      'Surat Keluar',
      newItem.id,
      `Nomor Resmi ${newItem.nomorSuratLengkap} tujuan "${newItem.tujuanSurat}" (${newItem.perihal})`
    );

    // Sync to Supabase
    if (supabase) {
      supabase.from('surat_keluar').insert({
        id: newItem.id,
        nomor_urut: newItem.nomorUrut || 1,
        nomor_surat_lengkap: newItem.nomorSuratLengkap || '001/Mis.11.23.14.14/PP.00/01/2026',
        tahun_surat: newItem.tahunSurat || new Date().getFullYear(),
        bulan_surat: newItem.bulanSurat || '01',
        kode_klasifikasi: newItem.kodeKlasifikasi || 'PP.00',
        tanggal_surat: newItem.tanggalSurat || new Date().toISOString().split('T')[0],
        tujuan_surat: newItem.tujuanSurat || '-',
        nama_penerima: newItem.namaPenerima || '',
        jabatan_penerima: newItem.jabatanPenerima || '',
        alamat_penerima: newItem.alamatPenerima || '',
        perihal: newItem.perihal || '-',
        ringkasan: newItem.ringkasan || '',
        kategori: newItem.kategori || 'Kurikulum',
        sifat: newItem.sifat || 'Biasa',
        status: newItem.status || 'Terkirim',
        catatan: newItem.catatan || '',
        file_doc: newItem.fileDoc || null,
        created_at: newItem.createdAt || new Date().toISOString(),
        updated_at: newItem.updatedAt || new Date().toISOString(),
        created_by: newItem.createdBy || 'Administrator',
      }).then(({ error }) => {
        if (error) console.warn('Supabase surat keluar insert notice:', error.message);
      });
    }

    return newItem;
  }

  updateSuratKeluar(id: string, updates: Partial<SuratKeluar>, user: UserProfile): SuratKeluar {
    const all = this.getSuratKeluar();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Surat Keluar tidak ditemukan');

    const existing = all[idx];
    const updated: SuratKeluar = {
      ...existing,
      ...updates,
      id: existing.id,
      nomorUrut: updates.nomorUrut !== undefined ? updates.nomorUrut : existing.nomorUrut,
      nomorSuratLengkap: updates.nomorSuratLengkap || existing.nomorSuratLengkap,
      tahunSurat: existing.tahunSurat,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    this.set(STORAGE_KEYS.SURAT_KELUAR, all);

    this.logActivity(
      user,
      'Pembaruan Surat Keluar',
      'Surat Keluar',
      updated.id,
      `Memperbarui detail surat ${updated.nomorSuratLengkap}`
    );

    if (supabase) {
      supabase.from('surat_keluar').update({
        nomor_surat_lengkap: updated.nomorSuratLengkap,
        nomor_urut: updated.nomorUrut,
        tanggal_surat: updated.tanggalSurat,
        tujuan_surat: updated.tujuanSurat || '-',
        nama_penerima: updated.namaPenerima || '',
        jabatan_penerima: updated.jabatanPenerima || '',
        alamat_penerima: updated.alamatPenerima || '',
        perihal: updated.perihal || '-',
        ringkasan: updated.ringkasan || '',
        kategori: updated.kategori || 'Kurikulum',
        sifat: updated.sifat || 'Biasa',
        status: updated.status || 'Terkirim',
        catatan: updated.catatan || '',
        file_doc: updated.fileDoc || null,
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase update notice in surat_keluar:', error.message);
      });
    }

    return updated;
  }

  deleteSuratKeluar(id: string, user: UserProfile): void {
    const all = this.getSuratKeluar();
    const existing = all.find((s) => s.id === id);
    if (!existing) return;

    const filtered = all.filter((s) => s.id !== id);
    this.set(STORAGE_KEYS.SURAT_KELUAR, filtered);

    this.logActivity(
      user,
      'Penghapusan Surat Keluar',
      'Surat Keluar',
      id,
      `Menghapus surat ${existing.nomorSuratLengkap}. Nomor urut #${existing.nomorUrut} tidak digunakan kembali.`
    );

    if (supabase) {
      supabase.from('surat_keluar').delete().eq('id', id).then(({ error }) => {
        if (error) console.info('Supabase delete notice:', error.message);
      });
    }
  }

  // --- CRUD: SURAT KEPUTUSAN (SK) ---
  getSuratKeputusan(): SuratKeputusan[] {
    return this.get<SuratKeputusan[]>(STORAGE_KEYS.SURAT_KEPUTUSAN, initialSuratKeputusan);
  }

  addSuratKeputusan(
    item: Omit<SuratKeputusan, 'id' | 'createdAt' | 'updatedAt' | 'nomorUrut' | 'nomorSK'> & {
      customNomorSK?: string;
      customNomorUrut?: number;
    },
    user: UserProfile
  ): SuratKeputusan {
    const all = this.getSuratKeputusan();
    const dateObj = new Date(item.tanggalSK || new Date().toISOString().split('T')[0]);
    const year = dateObj.getFullYear() || item.tahun || 2026;
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');

    const nextInfo = this.getNextSKInfo(year, monthStr);

    const isManual = Boolean(item.customNomorSK?.trim());
    const finalNomorSK = isManual ? item.customNomorSK!.trim() : nextInfo.nomorSK;
    const finalNomorUrut = item.customNomorUrut || nextInfo.nomorUrut;

    const newItem: SuratKeputusan = {
      ...item,
      id: `skep-${year}-${String(finalNomorUrut).padStart(3, '0')}-${Date.now().toString(36).substring(4, 7)}`,
      nomorUrut: finalNomorUrut,
      nomorSK: finalNomorSK,
      tahun: year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.name,
    };

    all.unshift(newItem);
    this.set(STORAGE_KEYS.SURAT_KEPUTUSAN, all);
    this.commitSKNumber(year, finalNomorUrut);

    this.logActivity(
      user,
      'Penetapan Surat Keputusan',
      'Surat Keputusan',
      newItem.id,
      `SK Nomor ${newItem.nomorSK}: "${newItem.judul}"`
    );

    if (supabase) {
      supabase.from('surat_keputusan').insert({
        id: newItem.id,
        nomor_sk: newItem.nomorSK || '001 Tahun 2026',
        nomor_urut: newItem.nomorUrut || 1,
        tahun: newItem.tahun || new Date().getFullYear(),
        judul: newItem.judul || '-',
        tentang: newItem.tentang || '-',
        tanggal_sk: newItem.tanggalSK || new Date().toISOString().split('T')[0],
        tahun_pelajaran: newItem.tahunPelajaran || '2025/2026',
        penandatangan: newItem.penandatangan || 'Kepala Madrasah',
        jabatan_penandatangan: newItem.jabatanPenandatangan || 'Kepala Madrasah',
        status: newItem.status || 'Berlaku',
        ringkasan: newItem.ringkasan || '',
        file_doc: newItem.fileDoc || null,
        created_at: newItem.createdAt || new Date().toISOString(),
        updated_at: newItem.updatedAt || new Date().toISOString(),
        created_by: newItem.createdBy || 'Administrator',
      }).then(({ error }) => {
        if (error) console.warn('Supabase SK insert notice:', error.message);
      });
    }

    return newItem;
  }

  updateSuratKeputusan(id: string, updates: Partial<SuratKeputusan>, user: UserProfile): SuratKeputusan {
    const all = this.getSuratKeputusan();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('SK tidak ditemukan');

    const existing = all[idx];
    const updated: SuratKeputusan = {
      ...existing,
      ...updates,
      id: existing.id,
      nomorSK: updates.nomorSK || existing.nomorSK,
      nomorUrut: updates.nomorUrut !== undefined ? updates.nomorUrut : existing.nomorUrut,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    this.set(STORAGE_KEYS.SURAT_KEPUTUSAN, all);

    this.logActivity(
      user,
      'Pembaruan SK',
      'Surat Keputusan',
      updated.id,
      `Memperbarui ${updated.nomorSK}: "${updated.judul}"`
    );

    if (supabase) {
      supabase.from('surat_keputusan').update({
        nomor_sk: updated.nomorSK,
        nomor_urut: updated.nomorUrut,
        judul: updated.judul || '-',
        tentang: updated.tentang || '-',
        tanggal_sk: updated.tanggalSK,
        tahun_pelajaran: updated.tahunPelajaran || '2025/2026',
        penandatangan: updated.penandatangan || 'Kepala Madrasah',
        jabatan_penandatangan: updated.jabatanPenandatangan || 'Kepala Madrasah',
        status: updated.status || 'Berlaku',
        ringkasan: updated.ringkasan || '',
        file_doc: updated.fileDoc || null,
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase SK update notice:', error.message);
      });
    }

    return updated;
  }

  deleteSuratKeputusan(id: string, user: UserProfile): void {
    const all = this.getSuratKeputusan();
    const existing = all.find((s) => s.id === id);
    if (!existing) return;

    const filtered = all.filter((s) => s.id !== id);
    this.set(STORAGE_KEYS.SURAT_KEPUTUSAN, filtered);

    this.logActivity(
      user,
      'Penghapusan SK',
      'Surat Keputusan',
      id,
      `Menghapus ${existing.nomorSK}`
    );

    if (supabase) {
      supabase.from('surat_keputusan').delete().eq('id', id).then(({ error }) => {
        if (error) console.info('Supabase SK delete notice:', error.message);
      });
    }
  }

  // --- CRUD: ARSIP DIGITAL ---
  getArsipDigital(): ArsipDigital[] {
    return this.get<ArsipDigital[]>(STORAGE_KEYS.ARSIP, initialArsipDigital);
  }

  addArsipDigital(item: Omit<ArsipDigital, 'id' | 'createdAt' | 'updatedAt'>, user: UserProfile): ArsipDigital {
    const all = this.getArsipDigital();
    const newItem: ArsipDigital = {
      ...item,
      id: `arsip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.name,
    };

    all.unshift(newItem);
    this.set(STORAGE_KEYS.ARSIP, all);

    this.logActivity(
      user,
      'Pengarsipan Dokumen',
      'Arsip Digital',
      newItem.id,
      `Arsip "${newItem.judulArsip}" [${newItem.kategori}]`
    );

    if (supabase) {
      supabase.from('arsip_digital').insert({
        id: newItem.id,
        kode_arsip: newItem.kodeArsip || `ARS-${Date.now()}`,
        judul_arsip: newItem.judulArsip || '-',
        kategori: newItem.kategori || 'Umum',
        tahun: newItem.tahun || new Date().getFullYear(),
        nomor_dokumen_terkait: newItem.nomorDokumenTerait || '',
        deskripsi: newItem.deskripsi || '',
        tags: newItem.tags || [],
        file_doc: newItem.fileDoc || {
          fileName: 'Dokumen Arsip',
          fileType: 'application/pdf',
          fileSize: 0,
        },
        lokasi_fisik: newItem.lokasiFisik || '',
        created_at: newItem.createdAt || new Date().toISOString(),
        updated_at: newItem.updatedAt || new Date().toISOString(),
        created_by: newItem.createdBy || 'Administrator',
      }).then(({ error }) => {
        if (error) console.warn('Supabase arsip insert notice:', error.message);
      });
    }

    return newItem;
  }

  deleteArsipDigital(id: string, user: UserProfile): void {
    const all = this.getArsipDigital();
    const existing = all.find((a) => a.id === id);
    if (!existing) return;

    const filtered = all.filter((a) => a.id !== id);
    this.set(STORAGE_KEYS.ARSIP, filtered);

    this.logActivity(
      user,
      'Penghapusan Arsip',
      'Arsip Digital',
      id,
      `Menghapus arsip ${existing.judulArsip}`
    );

    if (supabase) {
      supabase.from('arsip_digital').delete().eq('id', id).then(({ error }) => {
        if (error) console.info('Supabase arsip delete notice:', error.message);
      });
    }
  }

  // --- BACKUP & RESTORE ALL DATA ---
  exportAllDataJSON(): string {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      institution: "MI Ma'arif Al Ihsan Soborejo",
      supabaseUrl: this.getSettings().supabaseConfig.url,
      settings: this.getSettings(),
      klasifikasi: this.getKlasifikasi(),
      users: this.getUsers(),
      suratMasuk: this.getSuratMasuk(),
      suratKeluar: this.getSuratKeluar(),
      suratKeputusan: this.getSuratKeputusan(),
      arsip: this.getArsipDigital(),
      activityLogs: this.getActivityLogs(),
    };
    return JSON.stringify(data, null, 2);
  }

  importAllDataJSON(jsonString: string, user: UserProfile): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.klasifikasi) this.set(STORAGE_KEYS.KLASIFIKASI, data.klasifikasi);
      if (data.users) this.set(STORAGE_KEYS.USERS, data.users);
      if (data.suratMasuk) this.set(STORAGE_KEYS.SURAT_MASUK, data.suratMasuk);
      if (data.suratKeluar) this.set(STORAGE_KEYS.SURAT_KELUAR, data.suratKeluar);
      if (data.suratKeputusan) this.set(STORAGE_KEYS.SURAT_KEPUTUSAN, data.suratKeputusan);
      if (data.arsip) this.set(STORAGE_KEYS.ARSIP, data.arsip);
      if (data.activityLogs) this.set(STORAGE_KEYS.ACTIVITY_LOGS, data.activityLogs);

      this.logActivity(user, 'Restore Basis Data', 'Pengaturan', undefined, 'Memulihkan basis data SIPAS dari berkas JSON.');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // --- REALTIME SYNC FROM SUPABASE ---
  async syncFromSupabase(): Promise<{
    success: boolean;
    counts: { suratMasuk: number; suratKeluar: number; suratKeputusan: number; arsip: number };
    message?: string;
  }> {
    if (!supabase) {
      return {
        success: false,
        counts: { suratMasuk: 0, suratKeluar: 0, suratKeputusan: 0, arsip: 0 },
        message: 'Klien Supabase tidak aktif',
      };
    }

    try {
      // 0. Fetch pengaturan_madrasah (Identitas Madrasah, Kepala Madrasah, Operator, Password, Logo)
      try {
        const { data: remoteSett } = await supabase
          .from('pengaturan_madrasah')
          .select('data')
          .eq('id', 'default_setting')
          .maybeSingle();

        if (remoteSett && remoteSett.data) {
          const current = this.getSettings();
          this.set(STORAGE_KEYS.SETTINGS, {
            ...current,
            ...remoteSett.data,
            supabaseConfig: remoteSett.data.supabaseConfig || current.supabaseConfig,
          });
        }
      } catch (settErr) {
        console.warn('Sync pengaturan notice:', settErr);
      }

      // 1. Fetch surat_masuk
      const { data: remoteSM, error: smErr } = await supabase
        .from('surat_masuk')
        .select('*')
        .order('created_at', { ascending: false });

      if (smErr && smErr.code !== '42P01') {
        console.warn('Sync surat_masuk notice:', smErr.message);
      }

      let countSM = 0;
      if (Array.isArray(remoteSM)) {
        const mappedSM: SuratMasuk[] = remoteSM.map((r: any) => ({
          id: r.id,
          nomorAgenda: r.nomor_agenda,
          tahunAgenda: r.tahun_agenda,
          nomorSuratPengirim: r.nomor_surat_pengirim,
          tanggalSurat: r.tanggal_surat,
          tanggalDiterima: r.tanggal_diterima,
          pengirim: r.pengirim,
          perihal: r.perihal,
          ringkasan: r.ringkasan || '',
          kategori: r.kategori,
          sifat: r.sifat,
          tujuanInternal: r.tujuan_internal || '',
          status: r.status,
          catatan: r.catatan || '',
          fileDoc: r.file_doc,
          disposisi: r.disposisi,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          createdBy: r.created_by,
        }));
        this.set(STORAGE_KEYS.SURAT_MASUK, mappedSM);
        countSM = mappedSM.length;

        // Sync highest agenda counter per year
        mappedSM.forEach((s) => {
          const num = parseInt(s.nomorAgenda, 10);
          if (!isNaN(num)) this.commitAgendaSuratMasuk(s.tahunAgenda, String(num));
        });
      }

      // 2. Fetch surat_keluar
      const { data: remoteSKel, error: skelErr } = await supabase
        .from('surat_keluar')
        .select('*')
        .order('created_at', { ascending: false });

      if (skelErr && skelErr.code !== '42P01') {
        console.warn('Sync surat_keluar notice:', skelErr.message);
      }

      let countSKel = 0;
      if (Array.isArray(remoteSKel)) {
        const mappedSKel: SuratKeluar[] = remoteSKel.map((r: any) => ({
          id: r.id,
          nomorUrut: r.nomor_urut,
          nomorSuratLengkap: r.nomor_surat_lengkap,
          tahunSurat: r.tahun_surat,
          bulanSurat: r.bulan_surat,
          kodeKlasifikasi: r.kode_klasifikasi,
          tanggalSurat: r.tanggal_surat,
          tujuanSurat: r.tujuan_surat,
          namaPenerima: r.nama_penerima || '',
          jabatanPenerima: r.jabatan_penerima || '',
          alamatPenerima: r.alamat_penerima || '',
          perihal: r.perihal,
          ringkasan: r.ringkasan || r.ringkasan_isi || '',
          kategori: r.kategori || '',
          sifat: r.sifat || r.sifat_surat || 'Biasa',
          status: r.status || 'Terkirim',
          catatan: r.catatan || '',
          fileDoc: r.file_doc,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          createdBy: r.created_by,
        }));
        this.set(STORAGE_KEYS.SURAT_KELUAR, mappedSKel);
        countSKel = mappedSKel.length;

        // Sync highest surat keluar counter per year
        mappedSKel.forEach((s) => {
          if (s.nomorUrut) this.commitSuratKeluarNumber(s.tahunSurat, s.nomorUrut);
        });
      }

      // 3. Fetch surat_keputusan
      const { data: remoteSK, error: skErr } = await supabase
        .from('surat_keputusan')
        .select('*')
        .order('created_at', { ascending: false });

      if (skErr && skErr.code !== '42P01') {
        console.warn('Sync surat_keputusan notice:', skErr.message);
      }

      let countSK = 0;
      if (Array.isArray(remoteSK)) {
        const mappedSK: SuratKeputusan[] = remoteSK.map((r: any) => ({
          id: r.id,
          nomorUrut: r.nomor_urut,
          nomorSK: r.nomor_sk,
          tahun: r.tahun,
          judul: r.judul || r.judul_sk || '',
          tentang: r.tentang || '',
          tanggalSK: r.tanggal_sk || r.tanggal_penetapan || '',
          tahunPelajaran: r.tahun_pelajaran || '',
          penandatangan: r.penandatangan || r.pejabat_penetap || '',
          jabatanPenandatangan: r.jabatan_penandatangan || 'Kepala Madrasah',
          status: r.status || r.status_sk || 'Berlaku',
          ringkasan: r.ringkasan || r.keterangan || '',
          fileDoc: r.file_doc,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          createdBy: r.created_by,
        }));
        this.set(STORAGE_KEYS.SURAT_KEPUTUSAN, mappedSK);
        countSK = mappedSK.length;

        // Sync highest SK counter per year
        mappedSK.forEach((s) => {
          if (s.nomorUrut) {
            const counterKey = `${STORAGE_KEYS.COUNTER_SK}${s.tahun}`;
            const current = this.get<number>(counterKey, 0);
            if (s.nomorUrut > current) this.set(counterKey, s.nomorUrut);
          }
        });
      }

      // 4. Fetch arsip_digital
      const { data: remoteArsip, error: arsipErr } = await supabase
        .from('arsip_digital')
        .select('*')
        .order('created_at', { ascending: false });

      if (arsipErr && arsipErr.code !== '42P01') {
        console.warn('Sync arsip_digital notice:', arsipErr.message);
      }

      let countArsip = 0;
      if (Array.isArray(remoteArsip)) {
        const mappedArsip: ArsipDigital[] = remoteArsip.map((r: any) => ({
          id: r.id,
          kodeArsip: r.kode_arsip || r.id,
          judulArsip: r.judul_arsip,
          kategori: r.kategori,
          tahun: r.tahun,
          nomorDokumenTerait: r.nomor_dokumen_terkait || r.nomor_dokumen || '',
          deskripsi: r.deskripsi || r.keterangan || '',
          tags: r.tags || [],
          fileDoc: r.file_doc || {
            id: 'doc-auto',
            fileName: 'Dokumen Arsip',
            fileType: 'application/pdf',
            size: 0,
            uploadDate: r.created_at || new Date().toISOString(),
            webViewLink: '#',
          },
          lokasiFisik: r.lokasi_fisik || '',
          createdAt: r.created_at,
          updatedAt: r.updated_at || r.created_at,
          createdBy: r.created_by,
        }));
        this.set(STORAGE_KEYS.ARSIP, mappedArsip);
        countArsip = mappedArsip.length;
      }

      // 5. Fetch activity_logs
      try {
        const { data: remoteLogs } = await supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (Array.isArray(remoteLogs) && remoteLogs.length > 0) {
          const mappedLogs: ActivityLog[] = remoteLogs.map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            userName: l.user_name,
            action: l.action,
            entityType: l.entity_type,
            entityId: l.entity_id,
            details: l.details,
            timestamp: l.timestamp,
          }));
          this.set(STORAGE_KEYS.ACTIVITY_LOGS, mappedLogs);
        }
      } catch (logErr) {
        console.warn('Sync activity logs notice:', logErr);
      }

      return {
        success: true,
        counts: {
          suratMasuk: countSM,
          suratKeluar: countSKel,
          suratKeputusan: countSK,
          arsip: countArsip,
        },
      };
    } catch (e: any) {
      return {
        success: false,
        counts: { suratMasuk: 0, suratKeluar: 0, suratKeputusan: 0, arsip: 0 },
        message: e?.message || 'Gagal sinkronisasi data dari Supabase',
      };
    }
  }

  // --- REALTIME MULTI-DEVICE SUBSCRIPTION ---
  subscribeToRealtime(onDataChanged: () => void): () => void {
    if (!supabase) return () => {};

    try {
      const channel = supabase
        .channel('sipas-multi-device-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          async (payload) => {
            console.info('[SIPAS Multi-Device Sync] Perubahan terdeteksi dari perangkat lain:', payload.table, payload.eventType);
            await this.syncFromSupabase();
            onDataChanged();
          }
        )
        .subscribe((status) => {
          console.info('[SIPAS Multi-Device Sync] Status channel:', status);
        });

      return () => {
        try {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        } catch (e) {
          console.warn('Error removing channel:', e);
        }
      };
    } catch (err) {
      console.warn('Realtime subscription not supported or errored:', err);
      return () => {};
    }
  }

  resetToDefault(user: UserProfile): void {
    localStorage.clear();
    localStorage.setItem(SIPAS_DATA_VERSION_KEY, CURRENT_CLEAN_VERSION);
    this.set(STORAGE_KEYS.SETTINGS, initialMadrasahSettings);
    this.set(STORAGE_KEYS.KLASIFIKASI, initialKlasifikasiSurat);
    this.set(STORAGE_KEYS.USERS, initialUsers);
    this.set(STORAGE_KEYS.SURAT_MASUK, initialSuratMasuk);
    this.set(STORAGE_KEYS.SURAT_KELUAR, initialSuratKeluar);
    this.set(STORAGE_KEYS.SURAT_KEPUTUSAN, initialSuratKeputusan);
    this.set(STORAGE_KEYS.ARSIP, initialArsipDigital);
    this.set(STORAGE_KEYS.ACTIVITY_LOGS, initialActivityLogs);
    this.set(STORAGE_KEYS.ACTIVE_USER, initialUsers[0]);

    this.logActivity(user, 'Bersihkan Data Dummy', 'Pengaturan', undefined, 'Membersihkan seluruh data dummy dan menghubungkan ke Supabase.');
  }
}

export const storageService = new StorageService();
