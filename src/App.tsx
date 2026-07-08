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

export default function App() {
  
  // -------------------------------------------------------------
  // DATABASE STORAGE SYNCS (localStorage with initialSeed fallbacks)
  // -------------------------------------------------------------
  const [installed, setInstalled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jurnal_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [schoolInfo, setSchoolInfo] = useState<Sekolah>(initialSekolah);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [jurusan, setJurusan] = useState<Jurusan[]>(initialJurusan);
  const [mapel, setMapel] = useState<Mapel[]>(initialMapel);
  const [kelas, setKelas] = useState<Kelas[]>(initialKelas);
  const [siswa, setSiswa] = useState<Siswa[]>(initialSiswa);
  const [guru, setGuru] = useState<Guru[]>(initialGuru);
  const [guruMengampu, setGuruMengampu] = useState<GuruMengampu[]>(initialGuruMengampu);
  const [jurnals, setJurnals] = useState<Jurnal[]>(initialJurnal);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const dbData = result.data;
          if (dbData.sekolah) setSchoolInfo(dbData.sekolah);
          if (dbData.users?.length) setUsers(dbData.users);
          if (dbData.jurusan?.length) setJurusan(dbData.jurusan);
          if (dbData.mapel?.length) setMapel(dbData.mapel);
          if (dbData.kelas?.length) setKelas(dbData.kelas);
          if (dbData.siswa?.length) setSiswa(dbData.siswa);
          if (dbData.guru?.length) setGuru(dbData.guru);
          if (dbData.guruMengampu?.length) setGuruMengampu(dbData.guruMengampu);
          if (dbData.jurnal?.length) setJurnals(dbData.jurnal);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching from DB:', err);
        setLoading(false); // fallback to initialData
      });
  }, []);

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
    type: 'harian' | 'mingguan' | 'bulanan' | 'monitoring';
    classId?: string | null;
    filterDate?: string;
  } | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium tracking-wide">Memuat Data Database...</p>
      </div>
    );
  }

  return (
    <div id="main-view-wrapper" className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* 1. AUTH SCREEN VIEW */}
      {!currentUser && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          users={users}
          schoolName={schoolInfo.nama}
        />
      )}

      {/* 2. AUTHENTICATED DASHBOARD PORTAL */}
      {currentUser && (
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
              onOpenPrintModal={(type, classId, filterDate) => {
                setPrintModalParams({ type, classId, filterDate });
              }}
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
          siswa={siswa}
          jurnals={jurnals}
          schoolInfo={schoolInfo}
          onClose={() => setPrintModalParams(null)}
        />
      )}

    </div>
  );
}
