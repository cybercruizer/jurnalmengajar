import React, { useState } from 'react';
import { 
  User, Jurusan, Mapel, Kelas, Siswa, Guru, GuruMengampu, Sekolah, UserRole, Jurnal 
} from '../types';
import { 
  Users, Layers, BookOpen, Calendar, UserCheck, ShieldAlert, 
  School, Plus, Trash2, Edit2, Check, X, Shield, Key, Sparkles, Phone, HelpCircle,
  ClipboardList, Search, FileText, Printer, CheckCircle, RefreshCw, AlertCircle, Upload, Download
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onUpdateUsers: (u: User[]) => void;
  jurusan: Jurusan[];
  onUpdateJurusan: (j: Jurusan[]) => void;
  mapel: Mapel[];
  onUpdateMapel: (m: Mapel[]) => void;
  kelas: Kelas[];
  onUpdateKelas: (k: Kelas[]) => void;
  siswa: Siswa[];
  onUpdateSiswa: (s: Siswa[]) => void;
  guru: Guru[];
  onUpdateGuru: (g: Guru[]) => void;
  guruMengampu: GuruMengampu[];
  onUpdateGuruMengampu: (gm: GuruMengampu[]) => void;
  schoolInfo: Sekolah;
  onUpdateSchoolInfo: (s: Sekolah) => void;
  activeSubTab: string; // which subtab is selected from the sidebar
  jurnals?: Jurnal[];
  onAddJurnal?: (newEntry: Omit<Jurnal, 'id' | 'createdAt' | 'diinputOleh'>) => void;
  onDeleteJurnal?: (id: string) => void;
  onOpenPrintModal?: (type: 'harian' | 'mingguan' | 'bulanan' | 'monitoring', classId: string | null, filterDate?: string) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function AdminPanel({
  users, onUpdateUsers,
  jurusan, onUpdateJurusan,
  mapel, onUpdateMapel,
  kelas, onUpdateKelas,
  siswa, onUpdateSiswa,
  guru, onUpdateGuru,
  guruMengampu, onUpdateGuruMengampu,
  schoolInfo, onUpdateSchoolInfo,
  activeSubTab,
  jurnals = [],
  onAddJurnal,
  onDeleteJurnal,
  onOpenPrintModal,
  showToast
}: AdminPanelProps) {

  // Notification states
  const [adminNotification, setAdminNotification] = useState<string>('');

  // Database environment config state
  const [dbConfig, setDbConfig] = useState<any>(null);

  React.useEffect(() => {
    fetch('/api/env-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setDbConfig(data.config);
        }
      })
      .catch(err => {
        console.error('Gagal mengambil konfigurasi database:', err);
      });
  }, []);

  // Editing structures
  const [editingId, setEditingId] = useState<string | null>(null);

  // Curriculum Monitoring Rekap States
  const [rekapDate, setRekapDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [rekapSearchKelas, setRekapSearchKelas] = useState('');
  const [selectedRekapJurnal, setSelectedRekapJurnal] = useState<any | null>(null);
  const [monitoringStatusFilter, setMonitoringStatusFilter] = useState<'semua' | 'belum' | 'sudah'>('semua');

  // Form states depending on currently selected master audit module
  // 1. Users form
  const [userUsername, setUserUsername] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('guru');
  const [userRefId, setUserRefId] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // 2. Jurusan form
  const [jurusanNama, setJurusanNama] = useState('');
  const [jurusanSingkatan, setJurusanSingkatan] = useState('');

  // 3. Kelas form
  const [kelasNama, setKelasNama] = useState('');
  const [kelasJurusanId, setKelasJurusanId] = useState('');

  // 4. Mapel form
  const [mapelKode, setMapelKode] = useState('');
  const [mapelNama, setMapelNama] = useState('');

  // 5. Siswa form
  const [siswaNama, setSiswaNama] = useState('');
  const [siswaNis, setSiswaNis] = useState('');
  const [siswaKelasId, setSiswaKelasId] = useState('');
  const [siswaIsKetua, setSiswaIsKetua] = useState(false);

  // 6. Guru form
  const [guruNama, setGuruNama] = useState('');
  const [guruKode, setGuruKode] = useState('');

  // 7. Guru Mengampu form
  const [ampuGuruId, setAmpuGuruId] = useState('');
  const [ampuMapelId, setAmpuMapelId] = useState('');
  const [ampuKelasIds, setAmpuKelasIds] = useState<string[]>([]);

  // 8. Admin input jurnal states
  const [showInputJurnalModal, setShowInputJurnalModal] = useState(false);
  const [inputJurnalDate, setInputJurnalDate] = useState('');
  const [inputJurnalHari, setInputJurnalHari] = useState('Senin');
  const [inputJurnalKelasId, setInputJurnalKelasId] = useState('');
  const [inputJurnalMapelId, setInputJurnalMapelId] = useState('');
  const [inputJurnalGuruIds, setInputJurnalGuruIds] = useState<string[]>([]);
  const [inputJurnalJamMulai, setInputJurnalJamMulai] = useState<number>(1);
  const [inputJurnalJamSelesai, setInputJurnalJamSelesai] = useState<number>(2);
  const [inputJurnalStatus, setInputJurnalStatus] = useState<'hadir' | 'tidak' | 'tugas'>('hadir');
  const [inputJurnalCatatan, setInputJurnalCatatan] = useState('');

  // Auto infer day of week when input date changes
  React.useEffect(() => {
    if (inputJurnalDate) {
      const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const d = new Date(inputJurnalDate);
      const dayName = indonesianDays[d.getDay()];
      if (dayName) {
        setInputJurnalHari(dayName);
      }
    }
  }, [inputJurnalDate]);

  // Smart suggestion for teacher mapping based on selected mapel and kelas
  React.useEffect(() => {
    if (!inputJurnalMapelId || !inputJurnalKelasId) return;
    const match = guruMengampu.find(
      gm => gm.mapelId === inputJurnalMapelId && gm.kelasId === inputJurnalKelasId
    );
    if (match) {
      const ids = match.guruId.split(',').map(id => id.trim()).filter(Boolean);
      setInputJurnalGuruIds(ids);
    } else {
      setInputJurnalGuruIds([]);
    }
  }, [inputJurnalMapelId, inputJurnalKelasId, guruMengampu]);

  const handleOpenInputJurnal = (preferredKelasId: string = '') => {
    setInputJurnalDate(rekapDate);
    
    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(rekapDate);
    const dayName = indonesianDays[d.getDay()] || 'Senin';
    setInputJurnalHari(dayName);
    
    setInputJurnalKelasId(preferredKelasId || (kelas.length > 0 ? kelas[0].id : ''));
    setInputJurnalMapelId(mapel.length > 0 ? mapel[0].id : '');
    setInputJurnalGuruIds([]);
    setInputJurnalJamMulai(1);
    setInputJurnalJamSelesai(2);
    setInputJurnalStatus('hadir');
    setInputJurnalCatatan('');
    setShowInputJurnalModal(true);
  };

  const handleAdminSubmitJurnal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputJurnalKelasId) {
      showError('Silakan pilih kelas.');
      return;
    }
    if (!inputJurnalMapelId) {
      showError('Silakan pilih mata pelajaran.');
      return;
    }
    if (inputJurnalGuruIds.length === 0) {
      showError('Silakan pilih minimal 1 guru pengampu.');
      return;
    }
    if (!inputJurnalCatatan.trim()) {
      showError('Silakan isi ringkasan materi/catatan KBM.');
      return;
    }

    const jamKeStr = inputJurnalJamMulai === inputJurnalJamSelesai 
      ? `${inputJurnalJamMulai}` 
      : `${inputJurnalJamMulai}-${inputJurnalJamSelesai}`;

    if (onAddJurnal) {
      onAddJurnal({
        hari: inputJurnalHari,
        tanggal: inputJurnalDate,
        jamKe: jamKeStr,
        kelasId: inputJurnalKelasId,
        mapelId: inputJurnalMapelId,
        guruId: inputJurnalGuruIds.join(','),
        statusKehadiran: inputJurnalStatus,
        catatan: inputJurnalCatatan.trim()
      });
      
      setShowInputJurnalModal(false);
      showBannerNotice('Jurnal kelas berhasil diinput secara manual oleh Admin!');
    } else {
      showError('Fungsi tambah jurnal belum tersedia.');
    }
  };

  // Helper trigger
  const showBannerNotice = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => setAdminNotification(''), 4000);
    if (showToast) {
      showToast(msg, 'success');
    }
  };

  const showError = (msg: string) => {
    if (showToast) {
      showToast(msg, 'error');
    } else {
      alert(msg);
    }
  };

  // Reset helper
  const resetFormValues = () => {
    setEditingId(null);
    setUserUsername('');
    setUserName('');
    setUserRole('siswa');
    setUserRefId('');
    setUserPassword('');
    setJurusanNama('');
    setJurusanSingkatan('');
    setKelasNama('');
    setKelasJurusanId(jurusan[0]?.id || '');
    setMapelKode('');
    setMapelNama('');
    setSiswaNama('');
    setSiswaNis('');
    setSiswaKelasId(kelas[0]?.id || '');
    setSiswaIsKetua(false);
    setGuruNama('');
    setGuruKode('');
    setAmpuGuruId(guru[0]?.id || '');
    setAmpuMapelId(mapel[0]?.id || '');
    setAmpuKelasIds([]);
  };

  // CRUD ACTIONS
  // 1. USERS
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUsername) return;
    
    // Check duplication
    if (users.some(u => u.username.toLowerCase() === userUsername.toLowerCase())) {
      showError('Username sudah terpakai!');
      return;
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      username: userUsername.trim(),
      role: userRole,
      name: userName.trim(),
      password: userPassword.trim() || 'pass123',
      referenceId: userRefId || undefined
    };

    onUpdateUsers([...users, newUser]);
    showBannerNotice(`Akun user @${newUser.username} berhasil ditambahkan!`);
    resetFormValues();
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (id === 'user-admin' || (targetUser && targetUser.role === 'admin')) {
      showError('Akun admin utama atau administrator sistem tidak boleh dihapus!');
      return;
    }
    onUpdateUsers(users.filter(u => u.id !== id));
    showBannerNotice('User berhasil dihapus.');
  };

  // 2. JURUSAN
  const handleAddJurusan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jurusanNama || !jurusanSingkatan) return;

    if (editingId) {
      // Edit mode
      onUpdateJurusan(jurusan.map(j => j.id === editingId ? { ...j, nama: jurusanNama, singkatan: jurusanSingkatan } : j));
      showBannerNotice('Data jurusan berhasil diperbarui.');
    } else {
      // Add mode
      const newJur: Jurusan = {
        id: 'jur-' + Date.now(),
        nama: jurusanNama.trim(),
        singkatan: jurusanSingkatan.toUpperCase().trim()
      };
      onUpdateJurusan([...jurusan, newJur]);
      showBannerNotice('Jurusan baru berhasil ditambahkan.');
    }
    resetFormValues();
  };

  const handleDeleteJurusan = (id: string) => {
    onUpdateJurusan(jurusan.filter(j => j.id !== id));
    showBannerNotice('Jurusan berhasil dihapus.');
  };

  // 3. KELAS
  const handleAddKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasNama || !kelasJurusanId) return;

    if (editingId) {
      onUpdateKelas(kelas.map(k => k.id === editingId ? { ...k, nama: kelasNama, jurusanId: kelasJurusanId } : k));
      showBannerNotice('Data struktur kelas berhasil diperbarui.');
    } else {
      const newKls: Kelas = {
        id: 'kls-' + Date.now(),
        nama: kelasNama.trim(),
        jurusanId: kelasJurusanId
      };
      onUpdateKelas([...kelas, newKls]);
      showBannerNotice('Kelas baru berhasil terdaftar.');
    }
    resetFormValues();
  };

  const handleDeleteKelas = (id: string) => {
    onUpdateKelas(kelas.filter(k => k.id !== id));
    showBannerNotice('Kelas berhasil dihapus.');
  };

  // 4. MAPEL
  const handleAddMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelKode || !mapelNama) return;

    if (editingId) {
      onUpdateMapel(mapel.map(m => m.id === editingId ? { ...m, kode: mapelKode, nama: mapelNama } : m));
      showBannerNotice('Mata Pelajaran berhasil diperbarui.');
    } else {
      const newMap: Mapel = {
        id: 'mapel-' + Date.now(),
        kode: mapelKode.toUpperCase().trim(),
        nama: mapelNama.trim()
      };
      onUpdateMapel([...mapel, newMap]);
      showBannerNotice('Mata Pelajaran berhasil didaftarkan.');
    }
    resetFormValues();
  };

  const handleDeleteMapel = (id: string) => {
    onUpdateMapel(mapel.filter(m => m.id !== id));
    showBannerNotice('Mata Pelajaran berhasil dihapus.');
  };

  // 5. SISWA
  const handleAddSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaNama || !siswaNis || !siswaKelasId) return;

    if (editingId) {
      onUpdateSiswa(siswa.map(s => s.id === editingId ? { ...s, nama: siswaNama, nis: siswaNis, kelasId: siswaKelasId, isKetuaKelas: siswaIsKetua } : s));
      showBannerNotice('Biodata Siswa diperbarui.');
    } else {
      const newSis: Siswa = {
        id: 'sis-' + Date.now(),
        nama: siswaNama.trim(),
        nis: siswaNis.trim(),
        kelasId: siswaKelasId,
        isKetuaKelas: siswaIsKetua
      };
      onUpdateSiswa([...siswa, newSis]);
      
      // Auto-create standard Siswa account if isKetuaKelas is true
      if (siswaIsKetua) {
        const cleanNis = siswaNis.trim().padStart(5, '0');
        const usernameSiswa = 'S-' + cleanNis;
        const autoUser: User = {
          id: 'usr-' + Date.now(),
          username: usernameSiswa,
          role: 'siswa',
          name: siswaNama.trim(),
          password: 'siswa123',
          referenceId: newSis.id
        };
        onUpdateUsers([...users, autoUser]);
        showBannerNotice(`Siswa & akun Ketua Kelas baru @${usernameSiswa} (pass: siswa123) berhasil dibuat!`);
      } else {
        showBannerNotice('Siswa baru berhasil terdaftar.');
      }
    }
    resetFormValues();
  };

  const handleDeleteSiswa = (id: string) => {
    onUpdateSiswa(siswa.filter(s => s.id !== id));
    // Also remove their linked user reference if any
    onUpdateUsers(users.filter(u => u.referenceId !== id));
    showBannerNotice('Data Siswa & akun terkait berhasil dihapus.');
  };

  // 6. GURU
  const handleAddGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruNama) return;

    if (editingId) {
      onUpdateGuru(guru.map(g => g.id === editingId ? { ...g, nama: guruNama, kodeGuru: guruKode } : g));
      showBannerNotice('Informasi Guru diperbarui.');
    } else {
      const newGur: Guru = {
        id: 'gur-' + Date.now(),
        nama: guruNama.trim(),
        kodeGuru: guruKode.trim()
      };
      onUpdateGuru([...guru, newGur]);
      
      // Auto-create Guru account
      const usernameGuru = guruNama.split(' ')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const autoUser: User = {
        id: 'usr-' + Date.now(),
        username: usernameGuru,
        role: 'guru',
        name: guruNama.trim(),
        password: 'guru123',
        referenceId: newGur.id
      };
      onUpdateUsers([...users, autoUser]);
      showBannerNotice(`Guru & akun login @${usernameGuru} (pass: guru123) berhasil dibuat!`);
    }
    resetFormValues();
  };

  const handleDeleteGuru = (id: string) => {
    onUpdateGuru(guru.filter(g => g.id !== id));
    onUpdateUsers(users.filter(u => u.referenceId !== id));
    showBannerNotice('Guru & akun terkait dihapus.');
  };

  // 7. GURU MENGAMPU (SUBJECT MAPPINGS)
  const handleAddMengampu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ampuGuruId || !ampuMapelId || ampuKelasIds.length === 0) {
      showError('Silakan pilih Guru, Mata Pelajaran, dan minimal 1 Kelas.');
      return;
    }

    const newAllocations: GuruMengampu[] = [];
    const duplicatedClasses: string[] = [];

    ampuKelasIds.forEach((kelasId, index) => {
      const isDuplicated = guruMengampu.some(
        gm => gm.guruId === ampuGuruId && gm.mapelId === ampuMapelId && gm.kelasId === kelasId
      );
      if (isDuplicated) {
        const kelasNama = kelas.find(k => k.id === kelasId)?.nama || kelasId;
        duplicatedClasses.push(kelasNama);
      } else {
        newAllocations.push({
          id: 'amp-' + (Date.now() + index),
          guruId: ampuGuruId,
          mapelId: ampuMapelId,
          kelasId: kelasId
        });
      }
    });

    if (duplicatedClasses.length > 0 && newAllocations.length === 0) {
      showError(`Mapping Guru Mengampu untuk kelas (${duplicatedClasses.join(', ')}) sudah terdaftar sebelumnya!`);
      return;
    }

    onUpdateGuruMengampu([...guruMengampu, ...newAllocations]);
    if (duplicatedClasses.length > 0) {
      showBannerNotice(`Alokasi berhasil dipetakan untuk ${newAllocations.length} kelas. Kelas (${duplicatedClasses.join(', ')}) dilewati karena sudah terdaftar.`);
    } else {
      showBannerNotice('Alokasi Guru Mengampu berhasil dipetakan.');
    }
    resetFormValues();
  };

  const handleDeleteMengampu = (id: string) => {
    onUpdateGuruMengampu(guruMengampu.filter(g => g.id !== id));
    showBannerNotice('Petunjuk Guru Mengampu dibatalkan.');
  };

  // 8. DATA SEKOLAH
  const handleUpdateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    showBannerNotice('Identitas sekolah diperbarui secara global!');
  };

  // -----------------------------------------------------------------
  // CSV PARSING & MULTI-ROW IMPORT PROCEDURES
  // -----------------------------------------------------------------
  const parseCSVRows = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Auto-detect separating character (comma or semicolon)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    return lines
      .map(line => {
        if (!line.trim()) return [];
        
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        
        return result.map(val => {
          let clean = val;
          if (clean.startsWith('"') && clean.endsWith('"')) {
            clean = clean.substring(1, clean.length - 1);
          }
          return clean.trim();
        });
      })
      .filter(row => row.length > 0 && row.some(v => v !== ''));
  };

  const handleImportMapelCSV = (text: string) => {
    const rows = parseCSVRows(text);
    if (rows.length < 2) {
      showError('File CSV kosong atau tidak memiliki data.');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const kodeIdx = headers.indexOf('kode');
    const namaIdx = headers.indexOf('nama');

    if (kodeIdx === -1 || namaIdx === -1) {
      showError('Format CSV Mapel salah. Pastikan baris baris pertama berisi tajuk "kode" dan "nama".');
      return;
    }

    const currentMapels = [...mapel];
    let updatedCount = 0;
    let addedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= Math.max(kodeIdx, namaIdx)) continue;

      const kode = row[kodeIdx].trim();
      const nama = row[namaIdx].trim();

      if (!kode || !nama) continue;

      const existingIdx = currentMapels.findIndex(m => m.kode.toLowerCase() === kode.toLowerCase());
      if (existingIdx !== -1) {
        currentMapels[existingIdx] = {
          ...currentMapels[existingIdx],
          nama: nama
        };
        updatedCount++;
      } else {
        const newMapel: Mapel = {
          id: 'mapel-' + (Date.now() + i),
          kode,
          nama
        };
        currentMapels.push(newMapel);
        addedCount++;
      }
    }

    onUpdateMapel(currentMapels);
    showBannerNotice(`Berhasil impor CSV Mapel: ${addedCount} baru ditambahkan, ${updatedCount} diperbarui.`);
  };

  const handleImportGuruCSV = (text: string) => {
    const rows = parseCSVRows(text);
    if (rows.length < 2) {
      showError('File CSV kosong atau tidak memiliki data.');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const kodeIdx = headers.findIndex(h => h === 'kode' || h === 'kode_guru' || h === 'kodeguru' || h === 'nip' || h === 'nbm' || h === 'nbm_guru');
    const namaIdx = headers.indexOf('nama');

    if (kodeIdx === -1 || namaIdx === -1) {
      showError('Format CSV Guru salah. Pastikan baris baris pertama memiliki tajuk "kode" dan "nama".');
      return;
    }

    const currentGurus = [...guru];
    const currentUsers = [...users];
    let addedCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= Math.max(kodeIdx, namaIdx)) continue;

      const kode = row[kodeIdx].trim();
      const nama = row[namaIdx].trim();

      if (!kode || !nama) continue;

      const existingIdx = currentGurus.findIndex(g => g.kodeGuru.toLowerCase() === kode.toLowerCase());
      let guruId = '';
      if (existingIdx !== -1) {
        currentGurus[existingIdx] = {
          ...currentGurus[existingIdx],
          nama: nama
        };
        guruId = currentGurus[existingIdx].id;
        updatedCount++;
      } else {
        const newId = 'gur-' + (Date.now() + i);
        const newGur: Guru = {
          id: newId,
          nama,
          kodeGuru: kode
        };
        currentGurus.push(newGur);
        guruId = newId;
        addedCount++;
        
        // Auto-create Guru login credentials
        const firstWord = nama.split(/[ \t.,]/)[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        const randomNum = Math.floor(10 + Math.random() * 90);
        const usernameGuru = firstWord + randomNum;
        const autoUser: User = {
          id: 'usr-g-' + (Date.now() + i),
          username: usernameGuru,
          role: 'guru',
          name: nama,
          password: 'guru123',
          referenceId: newId
        };
        currentUsers.push(autoUser);
      }
    }

    onUpdateGuru(currentGurus);
    onUpdateUsers(currentUsers);
    showBannerNotice(`Berhasil impor CSV Guru: ${addedCount} ditambahkan (pass: guru123), ${updatedCount} diperbarui.`);
  };

  const handleImportSiswaCSV = (text: string) => {
    const rows = parseCSVRows(text);
    if (rows.length < 2) {
      showError('File CSV kosong atau tidak memiliki data.');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const nisIdx = headers.indexOf('nis');
    const namaIdx = headers.indexOf('nama');
    const kelasIdx = headers.findIndex(h => h === 'kelas' || h === 'kelas_nama' || h === 'nama_kelas');
    const ketuaIdx = headers.findIndex(h => h === 'is_ketua' || h === 'ketua' || h === 'is_ketua_kelas');

    if (nisIdx === -1 || namaIdx === -1 || kelasIdx === -1) {
      showError('Format CSV Siswa salah. Pastikan baris pertama memiliki tajuk "nis", "nama", dan "kelas".');
      return;
    }

    const currentSiswa = [...siswa];
    const currentUsers = [...users];
    const currentKelas = [...kelas];
    
    let addedCount = 0;
    let updatedCount = 0;
    let akunCreatedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= Math.max(nisIdx, namaIdx, kelasIdx)) continue;

      const nis = row[nisIdx].trim();
      const nama = row[namaIdx].trim();
      const kelasNameInput = row[kelasIdx].trim();
      const isKetuaInput = ketuaIdx !== -1 && row[ketuaIdx] ? row[ketuaIdx].trim().toLowerCase() : '';

      if (!nis || !nama || !kelasNameInput) continue;

      const isKetua = isKetuaInput === 'true' || isKetuaInput === '1' || isKetuaInput === 'ya' || isKetuaInput === 'yes';

      // Find or create class
      let finalKelasId = '';
      const existingKelas = currentKelas.find(k => k.nama.toLowerCase() === kelasNameInput.toLowerCase());
      if (existingKelas) {
        finalKelasId = existingKelas.id;
      } else {
        const targetJurId = jurusan[0]?.id || 'jur-default';
        const newClassId = 'kls-csv-' + (Date.now() + i);
        const newKls: Kelas = {
          id: newClassId,
          nama: kelasNameInput,
          jurusanId: targetJurId
        };
        currentKelas.push(newKls);
        finalKelasId = newClassId;
      }

      // Add or Update student
      const existingSiswaIdx = currentSiswa.findIndex(s => s.nis === nis);
      let siswaId = '';
      if (existingSiswaIdx !== -1) {
        currentSiswa[existingSiswaIdx] = {
          ...currentSiswa[existingSiswaIdx],
          nama,
          kelasId: finalKelasId,
          isKetuaKelas: isKetua
        };
        siswaId = currentSiswa[existingSiswaIdx].id;
        updatedCount++;
      } else {
        const newId = 'sis-' + (Date.now() + i);
        const newSis: Siswa = {
          id: newId,
          nama,
          nis,
          kelasId: finalKelasId,
          isKetuaKelas: isKetua
        };
        currentSiswa.push(newSis);
        siswaId = newId;
        addedCount++;
      }

      // Generate account for Ketua Kelas
      if (isKetua) {
        const userExists = currentUsers.some(u => u.referenceId === siswaId);
        if (!userExists) {
          const cleanNis = nis.padStart(5, '0');
          const usernameSiswa = 'S-' + cleanNis;
          const autoUser: User = {
            id: 'usr-s-' + (Date.now() + i),
            username: usernameSiswa,
            role: 'siswa',
            name: nama,
            password: 'siswa123',
            referenceId: siswaId
          };
          currentUsers.push(autoUser);
          akunCreatedCount++;
        }
      }
    }

    onUpdateKelas(currentKelas);
    onUpdateSiswa(currentSiswa);
    onUpdateUsers(currentUsers);
    showBannerNotice(`Berhasil impor CSV: ${addedCount} siswa baru, ${updatedCount} diperbarui, ${akunCreatedCount} akun login siswa baru.`);
  };

  const handleImportUsersCSV = (text: string) => {
    const rows = parseCSVRows(text);
    if (rows.length < 2) {
      showError('File CSV kosong atau tidak memiliki data.');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const usernameIdx = headers.indexOf('username');
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'nama');
    const roleIdx = headers.indexOf('role');
    const passwordIdx = headers.findIndex(h => h === 'password' || h === 'pass');
    const refIdx = headers.findIndex(h => h === 'referenceid' || h === 'reference_id' || h === 'ref_id');

    if (usernameIdx === -1 || nameIdx === -1 || roleIdx === -1) {
      showError('Format CSV User Akun salah. Pastikan baris pertama memiliki tajuk "username", "name" atau "nama", dan "role".');
      return;
    }

    const currentUsers = [...users];
    let addedCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= Math.max(usernameIdx, nameIdx, roleIdx)) continue;

      const username = row[usernameIdx].trim().toLowerCase();
      const name = row[nameIdx].trim();
      const roleRaw = row[roleIdx].trim().toLowerCase();
      const password = passwordIdx !== -1 && row[passwordIdx] ? row[passwordIdx].trim() : '';
      const referenceId = refIdx !== -1 && row[refIdx] ? row[refIdx].trim() : '';

      if (!username || !name || !roleRaw) continue;

      // Validate role
      let role: UserRole = 'guru';
      if (roleRaw === 'admin' || roleRaw === 'administrator') {
        role = 'admin';
      } else if (roleRaw === 'siswa' || roleRaw === 'murid' || roleRaw === 'ketua_kelas') {
        role = 'siswa';
      } else {
        role = 'guru';
      }

      const defaultPass = password || (role === 'admin' ? 'admin123' : role === 'guru' ? 'guru123' : 'siswa123');

      const existingIdx = currentUsers.findIndex(u => u.username.toLowerCase() === username);
      if (existingIdx !== -1) {
        currentUsers[existingIdx] = {
          ...currentUsers[existingIdx],
          name,
          role,
          password: password || currentUsers[existingIdx].password,
          referenceId: referenceId || currentUsers[existingIdx].referenceId
        };
        updatedCount++;
      } else {
        const newId = 'usr-csv-' + (Date.now() + i);
        const newUser: User = {
          id: newId,
          username,
          name,
          role,
          password: defaultPass,
          referenceId: referenceId || undefined
        };
        currentUsers.push(newUser);
        addedCount++;
      }
    }

    onUpdateUsers(currentUsers);
    showBannerNotice(`Berhasil impor CSV Akun: ${addedCount} akun baru ditambahkan, ${updatedCount} akun diperbarui.`);
  };

  // Initial trigger setup
  const handleEditTrigger = (item: any, type: string) => {
    setEditingId(item.id);
    if (type === 'jurusan') {
      setJurusanNama(item.nama);
      setJurusanSingkatan(item.singkatan);
    } else if (type === 'kelas') {
      setKelasNama(item.nama);
      setKelasJurusanId(item.jurusanId);
    } else if (type === 'mapel') {
      setMapelKode(item.kode);
      setMapelNama(item.nama);
    } else if (type === 'siswa') {
      setSiswaNama(item.nama);
      setSiswaNis(item.nis);
      setSiswaKelasId(item.kelasId);
      setSiswaIsKetua(item.isKetuaKelas);
    } else if (type === 'guru') {
      setGuruNama(item.nama);
      setGuruKode(item.kodeGuru);
    }
  };

  return (
    <div className="space-y-6">

      {/* Admin Information banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-amber-500/90 to-orange-500/90 rounded-3xl text-white shadow-xl flex items-center justify-between overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-60 h-60 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-white/20 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            <Shield className="w-3.5 h-3.5" />
            Mode Kontrol Administrator
          </div>
          <h2 className="text-2.5xl font-black tracking-tight leading-none mb-2">Panel Manajemen Master Data</h2>
          <p className="text-xs text-amber-50 max-w-xl">
            Audit penuh atas kelangsungan database akademik sekolah. Perubahan data master (guru, kelas, mapel) secara otomatis memengaruhi form input Ketua Kelas dan rekap Kurikulum Guru.
          </p>
        </div>
        <div className="p-4 bg-white/14 backdrop-blur-md rounded-2xl hidden md:block">
          <Users className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Global Admin notification banner */}
      {adminNotification && (
        <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-semibold rounded-r-xl flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{adminNotification}</span>
        </div>
      )}

      {/* CONTROLE AUDIT MODULE CONTAINER */}
      <div>
        
        {/* VIEW 1: ADMIN DASHBOARD / OVERVIEW */}
        {activeSubTab === 'admin-dashboard' && (
          <div className="space-y-6">
            
            {/* Counts grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-slate-205 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Akun Terdaftar</span>
                <p className="text-3xl font-black text-slate-800 mt-2">{users.length}</p>
                <span className="text-xs text-slate-405 font-mono">User login sistem</span>
              </div>
              <div className="bg-white p-5 border border-slate-205 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Mata Pelajaran</span>
                <p className="text-3xl font-black text-slate-800 mt-2">{mapel.length}</p>
                <span className="text-xs text-slate-405 font-mono">Kurikulum Merdeka</span>
              </div>
              <div className="bg-white p-5 border border-slate-205 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Jumlah Siswa</span>
                <p className="text-3xl font-black text-slate-800 mt-2">{siswa.length}</p>
                <span className="text-xs text-slate-405 font-mono">Ketua kelas: {siswa.filter(s=>s.isKetuaKelas).length} orang</span>
              </div>
              <div className="bg-white p-5 border border-slate-205 rounded-2xl shadow-xs">
                <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Tenaga Guru</span>
                <p className="text-3xl font-black text-slate-800 mt-2">{guru.length}</p>
                <span className="text-xs text-slate-405 font-mono">Guru mengampu: {guruMengampu.length} mapel</span>
              </div>
            </div>

            {/* School identity summary */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-3">Identitas {schoolInfo.nama}</h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Informasi sekolah dasar yang tercetak sebagai Kop Surat resmi pada semua lembar prapinjau laporan. Identitas dapat dikonfigurasi melalui tab "Identitas Sekolah".
                </p>
                
                <div className="space-y-2 text-xs">
                  <p><span className="text-slate-400 font-medium">NPSN :</span> <strong className="text-slate-700">{schoolInfo.npsn}</strong></p>
                  <p><span className="text-slate-400 font-medium">Alamat Lengkap :</span> <strong className="text-slate-700">{schoolInfo.alamat}</strong></p>
                  <p><span className="text-slate-400 font-medium">Kepala Sekolah :</span> <strong className="text-slate-700">{schoolInfo.kepalaSekolah}</strong></p>
                  <p><span className="text-slate-400 font-medium">NBM Kepala Sekolah :</span> <strong className="text-slate-705 font-mono">{schoolInfo.nbmKepalaSekolah}</strong></p>
                  <p><span className="text-slate-400 font-medium">Waka Kurikulum :</span> <strong className="text-slate-700">{schoolInfo.wakaKurikulum}</strong></p>
                  <p><span className="text-slate-400 font-medium">NBM Waka Kurikulum :</span> <strong className="text-slate-705 font-mono">{schoolInfo.nbmWakaKurikulum}</strong></p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-850 font-bold font-mono text-[11px] rounded-md tracking-wider uppercase">NOTIFIKASI INSTAN</span>
                <h4 className="text-sm font-bold text-slate-800">Petunjuk Sinkronisasi Data</h4>
                <p className="text-xs text-slate-650 leading-relaxed">
                  Semua form pengeditan pada panel admin bersifat reaktif. Menambahkan guru atau siswa yang ditunjuk menjadi <strong>Ketua Kelas</strong> secara otomatis membukakan akses akun login baru dengan password default sesuai kriteria sistem demi kenyamanan evaluasi.
                </p>
              </div>
            </div>

            {/* Database configuration card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md text-left">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 uppercase">
                <Layers className="w-4 h-4 text-indigo-500" />
                Status Integrasi Database & Lingkungan (.env)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Aplikasi terhubung ke database luring / daring yang telah terkonfigurasi pada file lingkungan <code>.env</code> server secara aman tanpa wizard penginstalan di klien.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 text-xs">DATABASE ENGINE</span>
                  <strong className="text-slate-800 font-bold">{dbConfig?.dbType || 'MySQL'}</strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 text-xs">HOST & PORT KONEKSI</span>
                  <strong className="text-slate-800 font-mono">{dbConfig?.host || 'localhost'}:{dbConfig?.port || '3306'}</strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 text-xs">NAMA DATABASE</span>
                  <strong className="text-slate-800 font-mono text-indigo-600">{dbConfig?.name || 'jurnalku_smk'}</strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 text-xs">PENGGUNA / USER</span>
                  <strong className="text-slate-800 font-mono">{dbConfig?.user || 'root'}</strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 text-xs">KATA SANDI / PASSWORD</span>
                  <strong className="text-slate-500 font-mono">•••••••• (Disembunyikan)</strong>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <span className="text-emerald-800 block text-xs font-bold uppercase tracking-wider">STATUS KONEKSI</span>
                    <strong className="text-emerald-900 font-black">🟢 AKTIF (.env Loaded)</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: USER MANAGEMENT */}
        {activeSubTab === 'admin-users' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Key className="w-4 h-4 text-orange-500" />
                  Registrasi Akun Baru
                </h3>
                
                <form onSubmit={handleAddUser} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Username Akun</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: ahmad_rpl"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap Pemilik</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Ahmad Yani"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Akses Role</label>
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value as UserRole)}
                        className="block w-full px-2.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-850 text-sm focus:outline-none"
                      >
                        <option value="admin">Administrator</option>
                        <option value="guru">Guru Mengampu</option>
                        <option value="siswa">Siswa Ketua Kelas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password Default</label>
                      <input
                        type="text"
                        placeholder="admin123/guru123..."
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                      <span>Reference ID (Optional)</span>
                      <span className="text-[11px] text-slate-400 font-normal">Hubungkan ke ID Guru/Siswa</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: gur-1 atau sis-1"
                      value={userRefId}
                      onChange={(e) => setUserRefId(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Akun Baru</span>
                  </button>
                </form>
              </div>

              {/* IMPORT CSV AKUN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm space-y-4 text-left">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  Import CSV Massal (User/Akun)
                </h3>
                
                <div className="text-[11px] text-slate-500 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-700">Format Kolom CSV:</p>
                  <code className="block p-1 bg-white border border-slate-200 rounded font-mono text-xs text-orange-700 font-bold overflow-x-auto whitespace-nowrap">
                    username,name,role,password,reference_id
                  </code>
                  <p className="font-bold text-slate-700 mt-1.5">Contoh baris data:</p>
                  <pre className="p-1 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-650 block leading-tight overflow-x-auto whitespace-pre-wrap">
username,name,role,password,reference_id
budi_guru,Drs. Budi M.Pd.,guru,guru123,gur-1
sis_ahmad,Ahmad Yani,siswa,siswa123,sis-1
                  </pre>
                  <p className="text-xs text-slate-400 leading-normal mt-1">
                    * Kolom <code className="text-orange-700 font-bold">role</code> bernilai salah satu dari: <code className="font-bold">admin</code>, <code className="font-bold">guru</code>, atau <code className="font-bold">siswa</code>.<br />
                    * Jika <code className="text-orange-700 font-bold">password</code> kosong, default pass: <code className="font-bold">admin123</code>, <code className="font-bold">guru123</code>, atau <code className="font-bold">siswa123</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih File CSV Akun</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const text = evt.target?.result;
                        if (typeof text === 'string') {
                          handleImportUsersCSV(text);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset file input
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-150 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Users className="w-4.5 h-4.5 text-orange-505 text-orange-500" />
                Daftar Akun Login Sistem
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">User info</th>
                      <th scope="col" className="px-3 py-2.5">Akses Role</th>
                      <th scope="col" className="px-3 py-2.5">Ref ID</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3">
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                        </td>
                        <td className="px-3 py-3 capitalize font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            u.role === 'admin' 
                              ? 'bg-amber-100 text-amber-800' 
                              : u.role === 'guru' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-orange-100 text-orange-850'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-400">{u.referenceId || '-'}</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: JURUSAN MANAGEMENT */}
        {activeSubTab === 'admin-jurusan' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm self-start">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Layers className="w-4 h-4 text-orange-505 text-orange-500" />
                {editingId ? 'Harmonisasi Jurusan' : 'Tambah Jurusan Sekolah'}
              </h3>
              
              <form onSubmit={handleAddJurusan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Panjang Jurusan</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Rekayasa Perangkat Lunak"
                    value={jurusanNama}
                    onChange={(e) => setJurusanNama(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Singkatan Resmi Jurusan</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: RPL"
                    value={jurusanSingkatan}
                    onChange={(e) => setJurusanSingkatan(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    {editingId ? 'Simpan Update' : 'Tambahkan Jurusan'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetFormValues}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Layers className="w-4 h-4 text-orange-500" />
                Daftar Jurusan Sekolah Aktif
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Singkatan</th>
                      <th scope="col" className="px-4 py-2.5">Nama Panjang Jurusan</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jurusan.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3.5">
                          <span className="font-extrabold text-slate-900 bg-slate-100 border px-2.5 py-1 rounded">
                            {j.singkatan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-850">{j.nama}</td>
                        <td className="px-3 py-3.5 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleEditTrigger(j, 'jurusan')}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteJurusan(j.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: KELAS MANAGEMENT */}
        {activeSubTab === 'admin-kelas' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm self-start">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-orange-500" />
                {editingId ? 'Edit Kelas' : 'Tambah Struktur Kelas'}
              </h3>
              
              <form onSubmit={handleAddKelas} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Kelas (e.g. XI RPL 1)</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: XI RPL 1"
                    value={kelasNama}
                    onChange={(e) => setKelasNama(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Program Jurusan Kelas</label>
                  <select
                    value={kelasJurusanId}
                    onChange={(e) => setKelasJurusanId(e.target.value)}
                    className="block w-full px-2.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-85 text-sm focus:outline-none"
                  >
                    {jurusan.map((j) => (
                      <option key={j.id} value={j.id}>{j.nama} ({j.singkatan})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    {editingId ? 'Simpan Struktur' : 'Tambahkan Kelas'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetFormValues}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-orange-500" />
                Daftar Seluruh Kelas Aktif
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Nama Kelas</th>
                      <th scope="col" className="px-4 py-2.5">Jurusan Terkait</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kelas.map((k) => {
                      const jurItem = jurusan.find(j => j.id === k.jurusanId);
                      return (
                        <tr key={k.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3.5">
                            <span className="font-extrabold text-orange-950 bg-orange-100/60 border border-orange-200 py-1 px-2.5 rounded-md">
                              {k.nama}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">
                            {jurItem ? `${jurItem.nama} (${jurItem.singkatan})` : 'Tidak terpetakan'}
                          </td>
                          <td className="px-3 py-3.5 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => handleEditTrigger(k, 'kelas')}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteKelas(k.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 5: MAPEL MANAGEMENT */}
        {activeSubTab === 'admin-mapel' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 space-y-6 self-start">
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  {editingId ? 'Edit Mata Pelajaran' : 'Registrasi Mapel Baru'}
                </h3>
                
                <form onSubmit={handleAddMapel} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kode Mapel (e.g. RPL-12)</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: RPL-A1"
                      value={mapelKode}
                      onChange={(e) => setMapelKode(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Panjang Matapelajaran</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Pemrograman Berorientasi Objek"
                      value={mapelNama}
                      onChange={(e) => setMapelNama(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      {editingId ? 'Simpan Mapel' : 'Daftarkan Mapel'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetFormValues}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* IMPORT CSV MAPEL */}
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-505 text-indigo-500" />
                  Import CSV Massal (Mapel)
                </h3>
                
                <div className="text-[11px] text-slate-550 text-slate-500 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-700">Format Kolom CSV:</p>
                  <code className="block p-1 bg-white border border-slate-200 rounded font-mono text-xs text-indigo-650 font-bold overflow-x-auto whitespace-nowrap">
                    kode,nama
                  </code>
                  <p className="font-bold text-slate-700 mt-1.5">Contoh baris data:</p>
                  <pre className="p-1 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-600 block leading-tight overflow-x-auto whitespace-pre-wrap">
kode,nama
RPL-B3,Pemrograman Web Dasar
COMMON-4,Bahasa Inggris
                  </pre>
                  <p className="text-xs text-slate-400 leading-normal mt-1">Sistem otomatis mendeteksi tanda pemisah koma (,) atau titik-koma (;). Duplikasi kode mapel akan memperbarui nama mapel lama.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih File CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const text = evt.target?.result;
                        if (typeof text === 'string') {
                          handleImportMapelCSV(text);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset file input
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-150 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Database Kurikulum Mapel
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Kode</th>
                      <th scope="col" className="px-4 py-2.5">Nama Matapelajaran</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mapel.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3.5 font-bold font-mono text-slate-800">{m.kode}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-700">{m.nama}</td>
                        <td className="px-3 py-3.5 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleEditTrigger(m, 'mapel')}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMapel(m.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 6: siswa MANAGEMENT */}
        {activeSubTab === 'admin-siswa' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-4 space-y-6 self-start">
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  {editingId ? 'Edit Biodata Siswa' : 'Daftarkan Siswa Baru'}
                </h3>
                
                <form onSubmit={handleAddSiswa} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Randy Pangalila"
                      value={siswaNama}
                      onChange={(e) => setSiswaNama(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">NIS Siswa</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12404"
                        value={siswaNis}
                        onChange={(e) => setSiswaNis(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih Kelas</label>
                      <select
                        value={siswaKelasId}
                        onChange={(e) => setSiswaKelasId(e.target.value)}
                        className="block w-full px-1.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-85 text-sm focus:outline-none"
                      >
                        {kelas.map((k) => (
                          <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Switch for Ketua Kelas */}
                  <div className="p-3 bg-slate-55 bg-slate-100/50 rounded-xl flex items-center justify-between border border-slate-200">
                    <div>
                      <span className="block text-xs font-bold text-slate-700">Tunjuk Jadi Ketua Kelas?</span>
                      <span className="text-xs text-slate-400 block">Diberi otorisasi mengisi jurnal harian</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={siswaIsKetua}
                      onChange={(e) => setSiswaIsKetua(e.target.checked)}
                      className="w-4.5 h-4.5 text-orange-600 border-slate-300 focus:ring-orange-550 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      {editingId ? 'Simpan Siswa' : 'Daftarkan Siswa'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetFormValues}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* IMPORT CSV SISWA */}
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Upload className="w-3.5 h-3.5 text-orange-505 text-orange-500" />
                  Import CSV Massal (Siswa)
                </h3>
                
                <div className="text-[11px] text-slate-550 text-slate-500 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-700">Format Kolom CSV:</p>
                  <code className="block p-1 bg-white border border-slate-200 rounded font-mono text-xs text-orange-700 font-bold overflow-x-auto whitespace-nowrap">
                    nis,nama,kelas,is_ketua
                  </code>
                  <p className="font-bold text-slate-700 mt-1.5">Contoh baris data:</p>
                  <pre className="p-1 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-650 block leading-tight overflow-x-auto whitespace-pre-wrap">
nis,nama,kelas,is_ketua
12499,Rizky Pratama,XI RPL 1,false
12501,M. Syahputra,XI RPL 1,true
                  </pre>
                  <p className="text-xs text-slate-400 leading-normal mt-1">
                    * Jika <code className="text-orange-700 font-bold">is_ketua</code> bernilai <code className="font-bold">true</code> atau <code className="font-bold">1</code>, sistem otomatis membukakan akun login ketua kelas (pass default: <code className="font-bold">siswa123</code>).<br />
                    * Jika nama kelas tidak terdaftar di sistem, sistem otomatis mendaftarkan nama kelas baru tersebut.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih File CSV Siswa</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const text = evt.target?.result;
                        if (typeof text === 'string') {
                          handleImportSiswaCSV(text);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset file input
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-150 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <UserCheck className="w-4 h-4 text-orange-500" />
                Daftar Peserta Didik (Siswa) Sekolah
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">NIS</th>
                      <th scope="col" className="px-3 py-2.5">Nama Peserta Didik</th>
                      <th scope="col" className="px-3 py-2.5">Kelas Terdaftar</th>
                      <th scope="col" className="px-3 py-2.5 text-center">Jabatan Kelas</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siswa.map((s) => {
                      const matchingClass = kelas.find(k => k.id === s.kelasId);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3.5 font-mono text-slate-400 font-semibold">{s.nis}</td>
                          <td className="px-3 py-3.5 font-bold text-slate-800">{s.nama}</td>
                          <td className="px-3 py-3.5">
                            <span className="font-bold text-slate-700 bg-slate-105 border px-2 py-0.5 rounded">
                              {matchingClass ? matchingClass.nama : 'Tidak Ada'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            {s.isKetuaKelas ? (
                              <span className="inline-block bg-orange-100 text-orange-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full border border-orange-200 uppercase tracking-wide">
                                Ketua Kelas (Active)
                              </span>
                            ) : (
                              <span className="text-slate-405 text-stone-400 font-medium text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => handleEditTrigger(s, 'siswa')}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSiswa(s.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 7: GURU MANAGEMENT */}
        {activeSubTab === 'admin-guru' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 space-y-6 self-start">
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Users className="w-4 h-4 text-orange-500" />
                  {editingId ? 'Edit Tenaga Pendidik' : 'Daftarkan Tenaga Guru Baru'}
                </h3>
                
                <form onSubmit={handleAddGuru} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap & Gelar Pendidik</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Siti Aminah, S.Pd."
                      value={guruNama}
                      onChange={(e) => setGuruNama(e.target.value)}
                      className="block w-full px-3.5 py-2 bg-slate-55 bg-slate-50 border border-slate-210 rounded-xl text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kode Guru (Pengganti NBM)</label>
                    <input
                      type="text"
                      placeholder="e.g. G-005 atau KGR-04"
                      value={guruKode}
                      onChange={(e) => setGuruKode(e.target.value)}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      {editingId ? 'Simpan Guru' : 'Daftarkan Guru'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetFormValues}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* IMPORT CSV GURU */}
              <div className="bg-white p-6 rounded-2xl border border-slate-210 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  Import CSV Massal (Guru)
                </h3>
                
                <div className="text-[11px] text-slate-500 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-700">Format Kolom CSV:</p>
                  <code className="block p-1 bg-white border border-slate-200 rounded font-mono text-xs text-orange-700 font-bold overflow-x-auto whitespace-nowrap">
                    kode,nama
                  </code>
                  <p className="font-bold text-slate-700 mt-1.5">Contoh baris data:</p>
                  <pre className="p-1 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-650 block leading-tight overflow-x-auto whitespace-pre-wrap">
kode,nama
KGR-009,H. Ahmad Dahlan, M.Ag.
KGR-010,Siti Zubaidah, S.Pd.
                  </pre>
                  <p className="text-xs text-slate-400 leading-normal mt-1">
                    * Kode Guru wajib berupa text tanpa spasi (pengganti NBM).<br />
                    * Guru yang didaftarkan via CSV otomatis dilesisikan akun login guru baru (password default: <code className="font-bold">guru123</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih File CSV Guru</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const text = evt.target?.result;
                        if (typeof text === 'string') {
                          handleImportGuruCSV(text);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = ''; // Reset file input
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-150 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Users className="w-4 h-4 text-orange-500" />
                Data Tenaga Pendidik (Guru)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Kode Guru</th>
                      <th scope="col" className="px-3 py-2.5">Nama Tenaga Pendidik</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {guru.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3.5 font-mono text-slate-500 font-bold">{g.kodeGuru || 'Belum Terisi'}</td>
                        <td className="px-3 py-3.5 font-bold text-slate-800">{g.nama}</td>
                        <td className="px-3 py-3 text-right whitespace-nowrap space-x-1 font-mono">
                          <button
                            onClick={() => handleEditTrigger(g, 'guru')}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuru(g.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 8: GURU MENGAMPU (SUBJECT ALLOCATION) */}
        {activeSubTab === 'admin-mengampu' && (
          <div className="grid lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm self-start">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Tambah Alokasi Mengampu
              </h3>
              
              <form onSubmit={handleAddMengampu} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih Guru Pengajar</label>
                  <select
                    value={ampuGuruId}
                    onChange={(e) => setAmpuGuruId(e.target.value)}
                    className="block w-full px-2.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-85 text-sm focus:outline-none"
                  >
                    {guru.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih Mata Pelajaran</label>
                  <select
                    value={ampuMapelId}
                    onChange={(e) => setAmpuMapelId(e.target.value)}
                    className="block w-full px-2.5 py-2.5 bg-slate-50 border border-slate-210 rounded-xl text-slate-85 text-sm focus:outline-none"
                  >
                    {mapel.map((m) => (
                      <option key={m.id} value={m.id}>[{m.kode}] - {m.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Pilih Kelas (Bisa Pilih Lebih Dari 1) <span className="text-rose-500 font-extrabold">*</span>
                  </label>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto space-y-1.5">
                    {kelas.map((k) => {
                      const isChecked = ampuKelasIds.includes(k.id);
                      return (
                        <label 
                          key={k.id} 
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                            isChecked 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' 
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-655'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setAmpuKelasIds(ampuKelasIds.filter(id => id !== k.id));
                              } else {
                                setAmpuKelasIds([...ampuKelasIds, k.id]);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>{k.nama}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Mankan Alokasi Mengampu</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-210 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-orange-550 text-orange-600" />
                Alokasi Mengampu Mata Pelajaran Terdata
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th scope="col" className="px-3 py-2.5 col-span-3">Pendidik</th>
                      <th scope="col" className="px-3 py-2.5">Matapelajaran</th>
                      <th scope="col" className="px-3 py-2.5 text-center">Kelas</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {guruMengampu.map((gm) => {
                      const matchedGuru = guru.find(g => g.id === gm.guruId);
                      const matchedMapel = mapel.find(m => m.id === gm.mapelId);
                      const matchedKelas = kelas.find(k => k.id === gm.kelasId);
                      return (
                        <tr key={gm.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3 font-semibold text-slate-800">{matchedGuru ? matchedGuru.nama : 'Guru dihapus'}</td>
                          <td className="px-3 py-3 font-medium text-slate-500">
                            {matchedMapel ? matchedMapel.nama : 'Mapel dihapus'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-xs">
                              {matchedKelas ? matchedKelas.nama : 'Kelas dihapus'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => handleDeleteMengampu(gm.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW: REKAP PEMBELAJARAN PER KELAS PER HARI (CURIKULUM MONITORING) */}
        {activeSubTab === 'admin-rekap-harian' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Header segment with Bento style styling */}
            <div className="p-6 md:p-8 bg-indigo-600 rounded-3xl text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,#fff_10%,transparent_70%)]" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium tracking-wide mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                  Pemantauan Kurikulum (KBM)
                </div>
                <h2 className="text-3xl font-black tracking-tight leading-none mb-2 font-display">
                  Rekap Pembelajaran per Kelas per Hari
                </h2>
                <p className="text-indigo-150 text-sm max-w-2xl">
                  Sistem pemantauan praktis bagi Bidang Kurikulum untuk memonitor keterlaksanaan Kegiatan Belajar Mengajar (KBM) harian secara real-time di setiap kelas paralel.
                </p>
              </div>
            </div>

            {/* Quick date & search filter bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-205 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="date"
                    value={rekapDate}
                    onChange={(e) => setRekapDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all outline-none font-medium"
                  />
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, '0');
                      const dd = String(today.getDate()).padStart(2, '0');
                      setRekapDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    className="py-2.5 px-3.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const yyyy = yesterday.getFullYear();
                      const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
                      const dd = String(yesterday.getDate()).padStart(2, '0');
                      setRekapDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    className="py-2.5 px-3.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Kemarin
                  </button>
                </div>
              </div>

              {/* Class name search filter */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={rekapSearchKelas}
                    onChange={(e) => setRekapSearchKelas(e.target.value)}
                    placeholder="Saring Kelas (misal: XI, RPL)..."
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all outline-none"
                  />
                  {rekapSearchKelas && (
                    <button
                      onClick={() => setRekapSearchKelas('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    const today = new Date();
                    showBannerNotice('Tampilan rekap diperbarui secara real-time!');
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Perbarui Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (onOpenPrintModal) {
                      onOpenPrintModal('monitoring', null, rekapDate);
                    }
                  }}
                  className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Pemantauan</span>
                </button>
                <button
                  onClick={() => handleOpenInputJurnal('')}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Isi Jurnal Manual</span>
                </button>
              </div>
            </div>

            {/* Compute daily metrics */}
            {(() => {
              const jurnalsForDate = jurnals.filter(j => j.tanggal === rekapDate);
              const classesFiltered = kelas.filter(k => {
                const matchesSearch = k.nama.toLowerCase().includes(rekapSearchKelas.toLowerCase());
                if (!matchesSearch) return false;
                
                const hasEntries = jurnalsForDate.some(j => j.kelasId === k.id);
                if (monitoringStatusFilter === 'belum') {
                  return !hasEntries;
                }
                if (monitoringStatusFilter === 'sudah') {
                  return hasEntries;
                }
                return true;
              });
              
              // Find unique kelasIds of the journals for this date
              const kelasWithEntries = new Set(jurnalsForDate.map(j => j.kelasId));
              const activeCount = kelas.length;
              const monitoredClassesCount = kelasWithEntries.size;
              const coverageRatePercent = activeCount > 0 ? Math.round((monitoredClassesCount / activeCount) * 100) : 0;
              
              const totalSessionsCompleted = jurnalsForDate.length;
              const presentCount = jurnalsForDate.filter(j => j.statusKehadiran === 'hadir').length;
              const tugasCount = jurnalsForDate.filter(j => j.statusKehadiran === 'tugas').length;
              const tidakCount = jurnalsForDate.filter(j => j.statusKehadiran === 'tidak').length;
              
              const teacherPresenceRate = totalSessionsCompleted > 0 
                ? Math.round((presentCount / totalSessionsCompleted) * 100) 
                : 0;

              return (
                <>
                  {/* Stats Bento Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-450 tracking-wider block uppercase">KBM Terpantau</span>
                        <div className="flex items-baseline mt-2 gap-2">
                          <p className="text-3xl font-black text-slate-800">{monitoredClassesCount}</p>
                          <p className="text-xs text-slate-400 font-bold">dr {activeCount} kelas</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, coverageRatePercent)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-450 font-mono mt-1 block font-semibold">{coverageRatePercent}% Kelas Menginput</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-450 tracking-wider block uppercase">Jam Sesi Terlaksana</span>
                        <p className="text-3xl font-black text-emerald-600 mt-2">{totalSessionsCompleted} <span className="text-xs font-normal text-slate-400">sesi</span></p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono mt-3 font-semibold">Tercatat di jurnalku hari ini</span>
                    </div>

                    <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-450 tracking-wider block uppercase">Rasio Kehadiran Guru</span>
                        <p className="text-3xl font-black text-indigo-700 mt-2">{teacherPresenceRate}%</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold font-mono">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{presentCount} Hadir</span>
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">{tugasCount} Tugas</span>
                        {tidakCount > 0 && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">{tidakCount} Alfa</span>}
                      </div>
                    </div>

                    <div className="bg-white p-5 border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-450 tracking-wider block uppercase">Pembelajaran Mandiri</span>
                        <p className="text-3xl font-black text-amber-600 mt-2">{tugasCount} <span className="text-xs font-normal text-slate-400">agenda</span></p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono mt-3 font-semibold">Guru memberikan instruksi tugas</span>
                    </div>
                  </div>

                  {/* Classes status list */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase flex items-center gap-1.5 font-display">
                        <ClipboardList className="w-4 h-4 text-indigo-550" />
                        Kelola Keterlaksanaan Kelas ({classesFiltered.length} paralel)
                      </h4>
                      <span className="text-[10.5px] text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100/30 px-3 py-1 rounded-full text-center">
                        Tinjauan Tanggal: {new Date(rekapDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Status filter segment */}
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                      <button
                        onClick={() => setMonitoringStatusFilter('semua')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          monitoringStatusFilter === 'semua'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Semua Kelas ({kelas.filter(k => k.nama.toLowerCase().includes(rekapSearchKelas.toLowerCase())).length})
                      </button>
                      <button
                        onClick={() => setMonitoringStatusFilter('belum')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          monitoringStatusFilter === 'belum'
                            ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/10'
                            : 'text-rose-500 hover:text-rose-600'
                        }`}
                      >
                        🔴 Belum Mengisi ({
                          kelas.filter(k => 
                            k.nama.toLowerCase().includes(rekapSearchKelas.toLowerCase()) && 
                            !jurnalsForDate.some(j => j.kelasId === k.id)
                          ).length
                        })
                      </button>
                      <button
                        onClick={() => setMonitoringStatusFilter('sudah')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          monitoringStatusFilter === 'sudah'
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                            : 'text-emerald-500 hover:text-emerald-600'
                        }`}
                      >
                        🟢 Sudah Mengisi ({
                          kelas.filter(k => 
                            k.nama.toLowerCase().includes(rekapSearchKelas.toLowerCase()) && 
                            jurnalsForDate.some(j => j.kelasId === k.id)
                          ).length
                        })
                      </button>
                    </div>

                    {classesFiltered.length === 0 ? (
                      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-xs">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-700">Hasil Saringan Kosong</h4>
                        <p className="text-xs text-slate-400 mt-1">Tidak ada kelas yang cocok dengan kata kunci "{rekapSearchKelas}".</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {classesFiltered.map((k) => {
                          const matchedJurusan = jurusan.find(jur => jur.id === k.jurusanId);
                          const classInDateEntries = jurnalsForDate.filter(j => j.kelasId === k.id);
                          
                          return (
                            <div key={k.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition-all duration-300">
                              <div>
                                <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                                  <div>
                                    <h5 className="font-extrabold text-lg text-slate-800 font-display leading-tight">{k.nama}</h5>
                                    <p className="text-xs font-bold text-slate-400 uppercase mt-0.5 tracking-wider truncate max-w-[200px]" title={matchedJurusan?.nama}>
                                      {matchedJurusan?.nama || 'Jurusan Sekolah'}
                                    </p>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                                    classInDateEntries.length >= 4
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                      : classInDateEntries.length > 0
                                      ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                                  }`}>
                                    {classInDateEntries.length > 0 ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 text-emerald-555" />
                                        <span>{classInDateEntries.length}/4 Terisi</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-3 h-3 text-slate-400" />
                                        <span>Kosong</span>
                                      </>
                                    )}
                                  </span>
                                </div>

                                {/* Standard periods line map */}
                                <div className="space-y-2.5">
                                  {classInDateEntries.length === 0 ? (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-left gap-3">
                                      <div>
                                        <p className="text-xs font-bold text-rose-800">Laporan Jurnal Belum Diisi</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Ketua Kelas bertanggung jawab menginput hari ini.</p>
                                      </div>
                                      {(() => {
                                        const ketua = siswa.find(s => s.kelasId === k.id && s.isKetuaKelas);
                                        if (ketua) {
                                          const waText = encodeURIComponent(`Halo Ketua Kelas ${ketua.nama} dari kelas ${k.nama}, mohon segera mengisi jurnal pembelajaran KBM untuk hari ini (${new Date(rekapDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}). Terima kasih!`);
                                          return (
                                            <a
                                              href={`https://wa.me/?text=${waText}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1.5 text-center cursor-pointer w-fit"
                                            >
                                              <Phone className="w-3 h-3" />
                                              <span>Hubungi Ketua: {ketua.nama}</span>
                                            </a>
                                          );
                                        }
                                        return (
                                          <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">Kosong</span>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    [...classInDateEntries]
                                      .sort((a, b) => {
                                        const parseStart = (s: string) => {
                                          const first = s.split('-')[0];
                                          return parseInt(first) || 0;
                                        };
                                        return parseStart(a.jamKe) - parseStart(b.jamKe);
                                      })
                                      .map((journalForSlot) => {
                                        const matchedMapel = mapel.find(m => m.id === journalForSlot.mapelId);
                                        const teacherNames = journalForSlot.guruId ? journalForSlot.guruId.split(',').map(subId => {
                                          const g = guru.find(x => x.id === subId.trim());
                                          return g ? g.nama : 'Guru Terhapus';
                                        }).join(' & ') : 'Guru Terhapus';

                                        return (
                                          <div 
                                            key={journalForSlot.id} 
                                            onClick={() => {
                                              setSelectedRekapJurnal(journalForSlot);
                                            }}
                                            className={`group/slot p-3 md:p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                                              journalForSlot.statusKehadiran === 'hadir'
                                                ? 'bg-emerald-50/45 border-emerald-100 hover:bg-emerald-50/80 hover:border-emerald-200'
                                                : journalForSlot.statusKehadiran === 'tugas'
                                                ? 'bg-amber-50/45 border-amber-100 hover:bg-amber-50/80 hover:border-amber-200'
                                                : 'bg-rose-50/45 border-rose-100 hover:bg-rose-50/80 hover:border-rose-200'
                                            }`}
                                          >
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Jam Pelajaran Ke-{journalForSlot.jamKe}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 mt-1 truncate group-hover/slot:text-indigo-600 transition-colors">
                                                  {matchedMapel ? matchedMapel.nama : 'Mapel Terhapus'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                                  Guru: {teacherNames}
                                                </p>
                                              </div>
                                              
                                              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider block shrink-0 ${
                                                journalForSlot.statusKehadiran === 'hadir'
                                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
                                                  : journalForSlot.statusKehadiran === 'tugas'
                                                  ? 'bg-amber-100 text-amber-805 border border-amber-200/50'
                                                  : 'bg-rose-100 text-rose-800 border border-rose-200/50'
                                              }`}>
                                                {journalForSlot.statusKehadiran === 'hadir' ? 'Hadir' : journalForSlot.statusKehadiran === 'tugas' ? 'Tugas' : 'Alfa'}
                                              </span>
                                            </div>
                                            {journalForSlot.catatan && (
                                              <div className="mt-2 text-xs text-slate-500 bg-white/70 p-2 border border-slate-100 rounded-xl block truncate italic">
                                                "{journalForSlot.catatan}"
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-bold font-mono">
                                  {classInDateEntries.length} JAM TERISI
                                </span>
                                <button
                                  onClick={() => handleOpenInputJurnal(k.id)}
                                  className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-xl flex items-center gap-1 transition-all cursor-pointer border border-indigo-100/40"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Isi Jurnal Kelas</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Input Jurnal Manual Modal for Admin */}
            {showInputJurnalModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 overflow-y-auto font-sans">
                <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-slide-up text-left my-8">
                  <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 tracking-tight font-display text-base leading-none">Isi Jurnal Manual (Admin)</h4>
                        <span className="text-[11px] text-indigo-605 font-mono font-bold uppercase mt-1 block tracking-wider">INPUT DATA KBM OLEH ADMINISTRATOR</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowInputJurnalModal(false)}
                      className="p-1.5 hover:bg-indigo-100 text-slate-500 rounded-lg cursor-pointer transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAdminSubmitJurnal}>
                    <div className="p-6 md:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Hari & Tanggal */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
                          <input 
                            type="date"
                            required
                            value={inputJurnalDate}
                            onChange={(e) => setInputJurnalDate(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hari</label>
                          <select
                            value={inputJurnalHari}
                            onChange={(e) => setInputJurnalHari(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold cursor-pointer"
                          >
                            <option value="Senin">Senin</option>
                            <option value="Selasa">Selasa</option>
                            <option value="Rabu">Rabu</option>
                            <option value="Kamis">Kamis</option>
                            <option value="Jumat">Jumat</option>
                            <option value="Sabtu">Sabtu</option>
                            <option value="Minggu">Minggu</option>
                          </select>
                        </div>
                      </div>

                      {/* Kelas */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kelas Sasaran</label>
                        <select
                          required
                          value={inputJurnalKelasId}
                          onChange={(e) => setInputJurnalKelasId(e.target.value)}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold cursor-pointer"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {kelas.map((k) => (
                            <option key={k.id} value={k.id}>{k.nama}</option>
                          ))}
                        </select>
                      </div>

                      {/* Jam Pelajaran / Durasi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jam Pelajaran Ke-</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <select
                              value={inputJurnalJamMulai}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setInputJurnalJamMulai(val);
                                if (val > inputJurnalJamSelesai) {
                                  setInputJurnalJamSelesai(val);
                                }
                              }}
                              className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold cursor-pointer"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                <option key={h} value={h}>Mulai Jam {h}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              value={inputJurnalJamSelesai}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val >= inputJurnalJamMulai) {
                                  setInputJurnalJamSelesai(val);
                                } else {
                                  showError('Jam selesai tidak boleh mendahului jam mulai!');
                                }
                              }}
                              className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold cursor-pointer"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                <option key={h} value={h} disabled={h < inputJurnalJamMulai}>Selesai Jam {h}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Mata Pelajaran */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mata Pelajaran</label>
                        <select
                          required
                          value={inputJurnalMapelId}
                          onChange={(e) => setInputJurnalMapelId(e.target.value)}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold cursor-pointer"
                        >
                          <option value="">-- Pilih Mata Pelajaran --</option>
                          {mapel.map((m) => (
                            <option key={m.id} value={m.id}>{m.nama} ({m.kode})</option>
                          ))}
                        </select>
                      </div>

                      {/* Guru Pengampu Checklist */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Guru Pengampu (Bisa Pilih Lebih Dari 1)</label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-36 overflow-y-auto space-y-1.5">
                          {guru.map((g) => {
                            const isChecked = inputJurnalGuruIds.includes(g.id);
                            return (
                              <label 
                                key={g.id} 
                                className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all border text-xs ${
                                  isChecked 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' 
                                    : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setInputJurnalGuruIds(inputJurnalGuruIds.filter(id => id !== g.id));
                                    } else {
                                      setInputJurnalGuruIds([...inputJurnalGuruIds, g.id]);
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span>{g.nama} {g.kodeGuru ? `(Kode: ${g.kodeGuru})` : ''}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Sistem otomatis menyarankan guru kurikulum, namun Anda dapat menyesuaikan secara bebas.</p>
                      </div>

                      {/* Status Kehadiran */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Presensi Pendidik</label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { id: 'hadir', label: 'Hadir', desc: 'Di Kelas', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-800' },
                            { id: 'tugas', label: 'Tugas', desc: 'Belajar Mandiri', color: 'border-amber-200 hover:bg-amber-50 text-amber-800' },
                            { id: 'tidak', label: 'Alpa', desc: 'Tanpa Keterangan', color: 'border-rose-200 hover:bg-rose-50 text-rose-800' },
                          ].map((opt) => {
                            const isSelected = inputJurnalStatus === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setInputJurnalStatus(opt.id as any)}
                                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected 
                                    ? opt.id === 'hadir' 
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-black' 
                                      : opt.id === 'tugas'
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-700 font-black'
                                      : 'bg-rose-500/10 border-rose-500 text-rose-700 font-black'
                                    : 'bg-slate-50 ' + opt.color
                                }`}
                              >
                                <span className="text-xs">{opt.label}</span>
                                <span className="text-[8px] opacity-75 font-medium mt-0.5">{opt.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Catatan / Ringkasan Materi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ringkasan Materi / Catatan KBM</label>
                        <textarea
                          required
                          rows={3}
                          value={inputJurnalCatatan}
                          onChange={(e) => setInputJurnalCatatan(e.target.value)}
                          placeholder="Tuliskan pokok pembahasan materi atau keterangan penugasan kelas..."
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-semibold resize-none"
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end items-center">
                      <button
                        type="button"
                        onClick={() => setShowInputJurnalModal(false)}
                        className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Jurnal</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Rekap detailed model drawer if selectedRekapJurnal is set */}
            {selectedRekapJurnal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 font-sans">
                <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-slide-up text-left">
                  <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                        <ClipboardList className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 tracking-tight font-display text-base leading-none">Rincian Laporan KBM</h4>
                        <span className="text-[11px] text-indigo-605 font-mono font-bold uppercase mt-1 block tracking-wider">PRESENSI & MATERI DETIL</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedRekapJurnal(null)}
                      className="p-1.5 hover:bg-indigo-100 text-slate-500 rounded-lg cursor-pointer transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 md:p-8 space-y-4">
                    {(() => {
                      const matKelas = kelas.find(k => k.id === selectedRekapJurnal.kelasId);
                      const matMapel = mapel.find(m => m.id === selectedRekapJurnal.mapelId);
                      const matGuru = guru.find(g => g.id === selectedRekapJurnal.guruId);
                      const matSiswa = siswa.find(s => s.id === selectedRekapJurnal.diinputOleh);
                      
                      return (
                        <div className="space-y-4 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">SASARAN KELAS</span>
                              <strong className="text-slate-800 mt-1 block font-display text-base">{matKelas ? matKelas.nama : 'Kelas dihapus'}</strong>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">HARI / TANGGAL</span>
                              <strong className="text-slate-700 mt-1 block">
                                {selectedRekapJurnal.hari}, {new Date(selectedRekapJurnal.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </strong>
                            </div>
                          </div>

                          <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-2xl">
                            <div>
                              <span className="text-[11px] font-bold text-slate-420 text-slate-400 uppercase tracking-wider block">MATA PELAJARAN</span>
                              <strong className="text-slate-800 block text-base mt-0.5">{matMapel ? matMapel.nama : 'Mapel Terhapus'}</strong>
                            </div>
                            <div className="border-t border-slate-100 pt-2.5">
                              <span className="text-[11px] font-bold text-slate-420 text-slate-400 uppercase tracking-wider block">GURU PENGAMPU</span>
                              <strong className="text-slate-800 block mt-0.5">
                                {selectedRekapJurnal.guruId ? selectedRekapJurnal.guruId.split(',').map(subId => {
                                  const found = guru.find(x => x.id === subId.trim());
                                  return found ? found.nama : 'Pendidik dihapus';
                                }).join(' & ') : 'Pendidik dihapus'}
                              </strong>
                              <span className="text-xs text-slate-500 font-mono font-semibold block">
                                Kode Guru: {selectedRekapJurnal.guruId ? selectedRekapJurnal.guruId.split(',').map(subId => {
                                  const found = guru.find(x => x.id === subId.trim());
                                  return found ? found.kodeGuru : '-';
                                }).join(', ') : '-'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PENGALOKASIAN PERIODE</span>
                              <strong className="text-indigo-700 block mt-1">Sesi Ke-{selectedRekapJurnal.jamKe}</strong>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PRESENSI PENDIDIK</span>
                              <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-bold uppercase ${
                                selectedRekapJurnal.statusKehadiran === 'hadir'
                                  ? 'text-emerald-700'
                                  : selectedRekapJurnal.statusKehadiran === 'tugas'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  selectedRekapJurnal.statusKehadiran === 'hadir'
                                    ? 'bg-emerald-500'
                                    : selectedRekapJurnal.statusKehadiran === 'tugas'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`} />
                                {selectedRekapJurnal.statusKehadiran === 'hadir' ? 'Hadir' : selectedRekapJurnal.statusKehadiran === 'tugas' ? 'Belajar Mandiri (Tugas)' : 'Alpa (Belum Hadir)'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">RINGKASAN MATERI YANG DIAJARKAN</span>
                            <p className="text-slate-700 mt-1 text-xs leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-200/40 select-text font-medium">
                              {selectedRekapJurnal.catatan ? `"${selectedRekapJurnal.catatan}"` : 'Tidak ada penjelasan materi yang diinput.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase font-mono">
                            <span>Saksi: {matSiswa ? `${matSiswa.nama} (Ketua Kelas)` : 'Ketua Kelas / Siswa'}</span>
                            <span>{new Date(selectedRekapJurnal.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end items-center">
                    {onDeleteJurnal && (
                      <button
                        onClick={() => {
                          if (window.confirm('Yakin ingin menghapus jurnal kelas ini? Tindakan ini tidak dapat dibatalkan.')) {
                            onDeleteJurnal(selectedRekapJurnal.id);
                            setSelectedRekapJurnal(null);
                            showBannerNotice('Laporan jurnal berhasil dihapus dari history sistem.');
                          }
                        }}
                        className="py-2 px-3.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Laporan</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRekapJurnal(null)}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      Tutup Rincian
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 9: IDENTITAS SEKOLAH */}
        {activeSubTab === 'admin-sekolah' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md">
            <h3 className="text-sm font-bold text-slate-800 tracking-wider mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3 uppercase">
              <School className="w-4 h-4 text-orange-500" />
              Identitas & Kop Resmi {schoolInfo.nama}
            </h3>

            <form onSubmit={handleUpdateSchool} className="space-y-5 max-w-2xl text-left">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">Nama Institusi Sekolah</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.nama}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, nama: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">NPSN Resmi</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.npsn}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, npsn: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">Alamat Lengkap Kantor</label>
                <input
                  type="text"
                  required
                  value={schoolInfo.alamat}
                  onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, alamat: e.target.value })}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.kepalaSekolah}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, kepalaSekolah: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">NBM Kepala Sekolah</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.nbmKepalaSekolah}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, nbmKepalaSekolah: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">Nama Waka Kurikulum</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.wakaKurikulum}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, wakaKurikulum: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">NBM Waka Kurikulum</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.nbmWakaKurikulum}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, nbmWakaKurikulum: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">Situs Website</label>
                  <input
                    type="text"
                    required
                    value={schoolInfo.website}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, website: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">Email Aktif</label>
                  <input
                    type="email"
                    required
                    value={schoolInfo.email}
                    onChange={(e) => onUpdateSchoolInfo({ ...schoolInfo, email: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Simpan Identitas Kop Sekolah
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
