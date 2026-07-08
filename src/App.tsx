import React, { useState, useEffect } from 'react';
import { 
  User, Sekolah, Jurusan, Mapel, Kelas, Siswa, Guru, GuruMengampu, Jurnal 
} from './types';
import { 
  initialUsers, initialSekolah, initialJurusan, initialMapel, 
  initialKelas, initialSiswa, initialGuru, initialGuruMengampu, initialJurnal 
} from './initialData';

// Dashboard layout, Login screens, & Print documents
import LoginScreen from './components/LoginScreen';
import ShapeRexLayout from './components/ShapeRexLayout';
import AdminPanel from './components/AdminPanel';
import GuruPanel from './components/GuruPanel';
import SiswaPanel from './components/SiswaPanel';
import CetakLaporanModal from './components/CetakLaporanModal';
import InstallWizard from './components/InstallWizard';

export default function App() {
  
  // -------------------------------------------------------------
  // DATABASE STORAGE SYNCS (localStorage with initialSeed fallbacks)
  // -------------------------------------------------------------
  const [installed, setInstalled] = useState<boolean>(() => {
    return localStorage.getItem('jurnal_installed') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jurnal_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [schoolInfo, setSchoolInfo] = useState<Sekolah>(() => {
    const saved = localStorage.getItem('jurnal_school_info');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialSekolah : { nama: '', npsn: '', alamat: '', kepalaSekolah: '', nipKepalaSekolah: '', website: '', email: '' });
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('jurnal_db_users');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialUsers : []);
  });

  const [jurusan, setJurusan] = useState<Jurusan[]>(() => {
    const saved = localStorage.getItem('jurnal_db_jurusan');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialJurusan : []);
  });

  const [mapel, setMapel] = useState<Mapel[]>(() => {
    const saved = localStorage.getItem('jurnal_db_mapel');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialMapel : []);
  });

  const [kelas, setKelas] = useState<Kelas[]>(() => {
    const saved = localStorage.getItem('jurnal_db_kelas');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialKelas : []);
  });

  const [siswa, setSiswa] = useState<Siswa[]>(() => {
    const saved = localStorage.getItem('jurnal_db_siswa');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialSiswa : []);
  });

  const [guru, setGuru] = useState<Guru[]>(() => {
    const saved = localStorage.getItem('jurnal_db_guru');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialGuru : []);
  });

  const [guruMengampu, setGuruMengampu] = useState<GuruMengampu[]>(() => {
    const saved = localStorage.getItem('jurnal_db_mengampu');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialGuruMengampu : []);
  });

  const [jurnals, setJurnals] = useState<Jurnal[]>(() => {
    const saved = localStorage.getItem('jurnal_db_jurnal_entries');
    return saved ? JSON.parse(saved) : (localStorage.getItem('jurnal_installed') === 'true' ? initialJurnal : []);
  });

  // Save changes to localStorage whenever state arrays update
  useEffect(() => {
    localStorage.setItem('jurnal_school_info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_jurusan', JSON.stringify(jurusan));
  }, [jurusan]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_mapel', JSON.stringify(mapel));
  }, [mapel]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_kelas', JSON.stringify(kelas));
  }, [kelas]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_siswa', JSON.stringify(siswa));
  }, [siswa]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_guru', JSON.stringify(guru));
  }, [guru]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_mengampu', JSON.stringify(guruMengampu));
  }, [guruMengampu]);

  useEffect(() => {
    localStorage.setItem('jurnal_db_jurnal_entries', JSON.stringify(jurnals));
  }, [jurnals]);

  // -------------------------------------------------------------
  // ACTIVE SUBMENU NAVIGATION STATE
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<string>('');

  // Set default active view tab upon role-based authorization
  useEffect(() => {
    if (!currentUser) {
      setActiveTab('');
      return;
    }
    if (currentUser.role === 'admin') {
      setActiveTab('admin-dashboard');
    } else if (currentUser.role === 'guru') {
      setActiveTab('guru-dashboard');
    } else {
      setActiveTab('siswa-input');
    }
  }, [currentUser]);

  // -------------------------------------------------------------
  // PRINT OVERLAY DIALOG PARAMETERS
  // -------------------------------------------------------------
  const [printModalParams, setPrintModalParams] = useState<{
    type: 'harian' | 'mingguan' | 'bulanan';
    classId: string;
    filterDate?: string;
  } | null>(null);

  // -------------------------------------------------------------
  // INSTALLATION MANAGEMENT ENTRIES
  // -------------------------------------------------------------
  const handleInstallComplete = (config: {
    dbType: string;
    dbConfig: any;
    schoolName: string;
    schoolNpsn: string;
    schoolAlamat: string;
    seedDemo: boolean;
  }) => {
    // 1. Update school info
    const fullSchool: Sekolah = {
      nama: config.schoolName,
      npsn: config.schoolNpsn,
      alamat: config.schoolAlamat,
      kepalaSekolah: 'Drs. H. Sukardiyono, M.Pd.',
      nipKepalaSekolah: '196711041994031005',
      website: 'www.smkmuhmungkid.sch.id',
      email: 'info@smkmuhmungkid.sch.id'
    };
    setSchoolInfo(fullSchool);
    localStorage.setItem('jurnal_school_info', JSON.stringify(fullSchool));

    // 2. Clear any prior active session
    localStorage.removeItem('jurnal_active_user');
    setCurrentUser(null);

    // 3. Build users and database state depending on seeding selection
    if (config.seedDemo) {
      // Seed with sample data but update the default administrator password to what was requested: admin12345
      const seededUsers = initialUsers.map(u => 
        u.username === 'admin' 
          ? { ...u, password: 'admin12345' } 
          : u
      );
      setUsers(seededUsers);
      setJurusan(initialJurusan);
      setMapel(initialMapel);
      setKelas(initialKelas);
      setSiswa(initialSiswa);
      setGuru(initialGuru);
      setGuruMengampu(initialGuruMengampu);
      setJurnals(initialJurnal);

      localStorage.setItem('jurnal_db_users', JSON.stringify(seededUsers));
      localStorage.setItem('jurnal_db_jurusan', JSON.stringify(initialJurusan));
      localStorage.setItem('jurnal_db_mapel', JSON.stringify(initialMapel));
      localStorage.setItem('jurnal_db_kelas', JSON.stringify(initialKelas));
      localStorage.setItem('jurnal_db_siswa', JSON.stringify(initialSiswa));
      localStorage.setItem('jurnal_db_guru', JSON.stringify(initialGuru));
      localStorage.setItem('jurnal_db_mengampu', JSON.stringify(initialGuruMengampu));
      localStorage.setItem('jurnal_db_jurnal_entries', JSON.stringify(initialJurnal));
    } else {
      // Clear data, create standard administrator user only (username: admin, password: admin12345)
      const cleanUsers: User[] = [
        {
          id: 'user-admin',
          username: 'admin',
          password: 'admin12345',
          role: 'admin',
          name: 'Administrator Utama (Tata Usaha/Kurikulum)'
        }
      ];
      setUsers(cleanUsers);
      setJurusan([]);
      setMapel([]);
      setKelas([]);
      setSiswa([]);
      setGuru([]);
      setGuruMengampu([]);
      setJurnals([]);

      localStorage.setItem('jurnal_db_users', JSON.stringify(cleanUsers));
      localStorage.setItem('jurnal_db_jurusan', JSON.stringify([]));
      localStorage.setItem('jurnal_db_mapel', JSON.stringify([]));
      localStorage.setItem('jurnal_db_kelas', JSON.stringify([]));
      localStorage.setItem('jurnal_db_siswa', JSON.stringify([]));
      localStorage.setItem('jurnal_db_guru', JSON.stringify([]));
      localStorage.setItem('jurnal_db_mengampu', JSON.stringify([]));
      localStorage.setItem('jurnal_db_jurnal_entries', JSON.stringify([]));
    }

    // 4. Record install metadata
    localStorage.setItem('jurnal_db_type', config.dbType);
    localStorage.setItem('jurnal_db_config', JSON.stringify(config.dbConfig));
    localStorage.setItem('jurnal_installed', 'true');
    
    // Set state
    setInstalled(true);
  };

  const handleResetInstall = () => {
    localStorage.clear();
    setInstalled(false);
    setCurrentUser(null);
    setSchoolInfo({ nama: '', npsn: '', alamat: '', kepalaSekolah: '', nipKepalaSekolah: '', website: '', email: '' });
    setUsers([]);
    setJurusan([]);
    setMapel([]);
    setKelas([]);
    setSiswa([]);
    setGuru([]);
    setGuruMengampu([]);
    setJurnals([]);
  };

  // -------------------------------------------------------------
  // CORE AUTH LOGIC ENTRIES
  // -------------------------------------------------------------
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('jurnal_active_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jurnal_active_user');
  };

  // -------------------------------------------------------------
  // LIVE JOURNAL ACTIONS
  // -------------------------------------------------------------
  const handleAddJurnal = (newEntry: Omit<Jurnal, 'id' | 'createdAt' | 'diinputOleh'>) => {
    if (!currentUser) return;

    const fullEntry: Jurnal = {
      ...newEntry,
      id: 'jur-j' + Date.now(),
      diinputOleh: currentUser.referenceId || 'system',
      createdAt: new Date().toISOString()
    };

    setJurnals([fullEntry, ...jurnals]);
  };

  const handleDeleteJurnal = (id: string) => {
    setJurnals(jurnals.filter(j => j.id !== id));
  };

  // Filter linked objects based on current student accounts
  const loggedSiswa = currentUser && currentUser.role === 'siswa' 
    ? siswa.find(s => s.id === currentUser.referenceId)
    : null;

  const loggedGuru = currentUser && currentUser.role === 'guru'
    ? guru.find(g => g.id === currentUser.referenceId)
    : null;

  return (
    <div id="main-view-wrapper" className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* 0. DISPATCH INSTALLATION WIZARD SCREEN */}
      {!installed && (
        <InstallWizard onInstallComplete={handleInstallComplete} />
      )}

      {/* 1. AUTH SCREEN VIEW */}
      {installed && !currentUser && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          users={users}
          schoolName={schoolInfo.nama}
        />
      )}

      {/* 2. AUTHENTICATED DASHBOARD PORTAL */}
      {installed && currentUser && (
        <ShapeRexLayout
          user={currentUser}
          onLogout={handleLogout}
          schoolInfo={schoolInfo}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        >
          {/* Display panel based on role */}
          {currentUser.role === 'siswa' && loggedSiswa && (
            <SiswaPanel
              siswa={loggedSiswa}
              kelas={kelas}
              mapel={mapel}
              guru={guru}
              guruMengampu={guruMengampu}
              jurnals={jurnals}
              onAddJurnal={handleAddJurnal}
              onDeleteJurnal={handleDeleteJurnal}
              activeSubTab={activeTab} // 'siswa-input' or 'siswa-riwayat'
            />
          )}

          {currentUser.role === 'guru' && loggedGuru && (
            <GuruPanel
              guru={loggedGuru}
              gurus={guru}
              kelas={kelas}
              mapel={mapel}
              jurnals={jurnals}
              schoolInfo={schoolInfo}
              onPrintPreview={(type, classId, date) => setPrintModalParams({ type, classId, filterDate: date })}
              activeSubTab={activeTab} // 'guru-dashboard' or 'guru-rekap'
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminPanel
              users={users}
              onUpdateUsers={setUsers}
              jurusan={jurusan}
              onUpdateJurusan={setJurusan}
              mapel={mapel}
              onUpdateMapel={setMapel}
              kelas={kelas}
              onUpdateKelas={setKelas}
              siswa={siswa}
              onUpdateSiswa={setSiswa}
              guru={guru}
              onUpdateGuru={setGuru}
              guruMengampu={guruMengampu}
              onUpdateGuruMengampu={setGuruMengampu}
              schoolInfo={schoolInfo}
              onUpdateSchoolInfo={setSchoolInfo}
              activeSubTab={activeTab} // tracks sub-managers
              jurnals={jurnals}
              onAddJurnal={handleAddJurnal}
              onDeleteJurnal={handleDeleteJurnal}
              onResetInstall={handleResetInstall}
            />
          )}
        </ShapeRexLayout>
      )}

      {/* 3. PRINT PREVIEW OVERLAY DRAWER */}
      {printModalParams && (
        <CetakLaporanModal
          type={printModalParams.type}
          classId={printModalParams.classId}
          filterDate={printModalParams.filterDate}
          kelas={kelas}
          jurusan={jurusan}
          mapel={mapel}
          guru={guru}
          jurnals={jurnals}
          schoolInfo={schoolInfo}
          onClose={() => setPrintModalParams(null)}
        />
      )}

    </div>
  );
}
