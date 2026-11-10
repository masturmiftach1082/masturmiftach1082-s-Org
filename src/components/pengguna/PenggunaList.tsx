import { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit,
  UserCheck,
  X,
  Save,
} from 'lucide-react';

interface PenggunaListProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onUsersUpdated: () => void;
  onSwitchUser: (user: UserProfile) => void;
}

const ROLE_LABELS: Record<UserRole, { label: string; desc: string }> = {
  admin: {
    label: 'Administrator IT',
    desc: 'Akses penuh ke seluruh modul, manajemen sistem, dan pengaturan database.',
  },
  operator: {
    label: 'Operator Madrasah',
    desc: 'Pengelolaan surat masuk, penerbitan nomor surat keluar, SK, dan arsip.',
  },
  kepala_madrasah: {
    label: 'Kepala Madrasah',
    desc: 'Pemberian disposisi surat, persetujuan surat keluar & penetapan SK.',
  },
  guru: {
    label: 'Guru / Tenaga Pendidik',
    desc: 'Melihat arsip persuratan, kurikulum, dan pencarian berkas.',
  },
};

export default function PenggunaList({
  users,
  currentUser,
  onUsersUpdated,
  onSwitchUser,
}: PenggunaListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [isActive, setIsActive] = useState(true);

  const canManage = currentUser.role === 'admin';

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('operator');
    setNip('');
    setJabatan('Operator Madrasah');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setNip(user.nip || '');
    setJabatan(user.jabatan);
    setIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Nama dan email wajib diisi.');
      return;
    }

    const currentList = storageService.getUsers();

    if (editingUser) {
      const updated = currentList.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: name.trim(),
              email: email.trim(),
              role,
              nip: nip.trim() || undefined,
              jabatan: jabatan.trim(),
              isActive,
            }
          : u
      );
      storageService.saveUsers(updated);
    } else {
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        nip: nip.trim() || undefined,
        jabatan: jabatan.trim(),
        isActive,
      };
      currentList.push(newUser);
      storageService.saveUsers(currentList);
    }

    onUsersUpdated();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna & Hak Akses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan akun staf madrasah, hak akses role (Kepala Madrasah, Operator TU, Guru, Administrator).
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Tambah Pengguna Baru
          </button>
        )}
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <div key={r} className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-emerald-950 block">{ROLE_LABELS[r].label}</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">{ROLE_LABELS[r].desc}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-4">Jabatan & NIP</th>
                <th className="py-3 px-4 w-44">Peran (Role)</th>
                <th className="py-3 px-4 w-28 text-center">Status Akun</th>
                <th className="py-3 px-4 w-48 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.2 rounded">
                                Akun Anda
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{u.jabatan}</p>
                      {u.nip && <p className="text-[11px] text-slate-500 font-mono">NIP: {u.nip}</p>}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block text-[11px]">
                        {ROLE_LABELS[u.role].label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> Non-Aktif
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrent && (
                          <button
                            onClick={() => onSwitchUser(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                          >
                            <UserCheck className="w-3 h-3" /> Masuk Sebagai
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-900 text-white">
              <h3 className="text-base font-semibold">
                {editingUser ? 'Ubah Akun Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: H. Mastur Miftach, M.Pd.I"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Pengguna *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@mimaarifsoborejo.sch.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hak Akses (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="operator">Operator Madrasah</option>
                    <option value="kepala_madrasah">Kepala Madrasah</option>
                    <option value="admin">Administrator IT</option>
                    <option value="guru">Guru / Tenaga Pendidik</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19780512 200501..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan di Madrasah</label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Operator Madrasah"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="isActiveCheck" className="text-slate-700 font-medium">
                  Akun aktif dan diizinkan mengakses SIPAS
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  <Save className="w-4 h-4" /> Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
