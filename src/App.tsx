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
import { Toast, ToastContainer } from './components/ToastNotification';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

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

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const applyDatabaseData = (dbData: any) => {
    if (!dbData) return;
    if (dbData.sekolah) {
      setSchoolInfo(prev => ({ ...initialSekolah, ...prev, ...dbData.sekolah }));
    }
    if (Array.isArray(dbData.users) && dbData.users.length > 0) setUsers(dbData.users);
    if (Array.isArray(dbData.jurusan)) setJurusan(dbData.jurusan);
    if (Array.isArray(dbData.mapel)) setMapel(dbData.mapel);
    if (Array.isArray(dbData.kelas)) setKelas(dbData.kelas);
    if (Array.isArray(dbData.siswa)) setSiswa(dbData.siswa);
    if (Array.isArray(dbData.guru)) setGuru(dbData.guru);
    if (Array.isArray(dbData.guruMengampu)) setGuruMengampu(dbData.guruMengampu);
    if (Array.isArray(dbData.jurnal)) setJurnals(dbData.jurnal);
  };

  const fetchDataFromDb = async () => {
    try {
      const res = await fetch('/api/data');
      const result = await res.json();
      if (result.success && result.data) {
        applyDatabaseData(result.data);
      }
    } catch (err) {
      console.error('Error fetching from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Server-Sent Events (SSE) Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'connected') {
            setIsRealtimeConnected(true);
          } else if (parsed.type === 'realtime_update' && parsed.data) {
            setIsRealtimeConnected(true);
            applyDatabaseData(parsed.data);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error processing realtime event:', err);
        }
      };

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(setupSSE, 4000);
      };
    };

    fetchDataFromDb();
    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    const appName = schoolInfo.namaAplikasi || 'JurnalKu SMK';
    document.title = `${appName} - ${schoolInfo.nama}`;
  }, [schoolInfo]);

  // -------------------------------------------------------------
  // REAL-TIME MUTATION HANDLERS (No full wipes, direct database sync)
  // -------------------------------------------------------------
  const handleUpdateSchoolInfo = async (newSchool: Sekolah) => {
    setSchoolInfo(newSchool);
    try {
      await fetch('/api/sekolah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchool)
      });
      showToast('Identitas sekolah berhasil diperbarui secara realtime!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan identitas sekolah ke database.', 'error');
    }
  };

  const handleUpdateUsers = async (newUsers: User[]) => {
    setUsers(newUsers);
    try {
      await fetch('/api/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUsers)
      });
    } catch (err) {
      console.error('Error updating users:', err);
    }
  };

  const handleUpdateJurusan = async (newJurusan: Jurusan[]) => {
    setJurusan(newJurusan);
    try {
      await fetch('/api/jurusan/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJurusan)
      });
    } catch (err) {
      console.error('Error updating jurusan:', err);
    }
  };

  const handleUpdateMapel = async (newMapel: Mapel[]) => {
    setMapel(newMapel);
    try {
      await fetch('/api/mapel/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMapel)
      });
    } catch (err) {
      console.error('Error updating mapel:', err);
    }
  };

  const handleUpdateKelas = async (newKelas: Kelas[]) => {
    setKelas(newKelas);
    try {
      await fetch('/api/kelas/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKelas)
      });
    } catch (err) {
      console.error('Error updating kelas:', err);
    }
  };

  const handleUpdateSiswa = async (newSiswa: Siswa[]) => {
    setSiswa(newSiswa);
    try {
      await fetch('/api/siswa/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSiswa)
      });
    } catch (err) {
      console.error('Error updating siswa:', err);
    }
  };

  const handleUpdateGuru = async (newGuru: Guru[]) => {
    setGuru(newGuru);
    try {
      await fetch('/api/guru/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuru)
      });
    } catch (err) {
      console.error('Error updating guru:', err);
    }
  };

  const handleUpdateGuruMengampu = async (newGM: GuruMengampu[]) => {
    setGuruMengampu(newGM);
    try {
      await fetch('/api/guru-mengampu/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGM)
      });
    } catch (err) {
      console.error('Error updating guru mengampu:', err);
    }
  };

  // -------------------------------------------------------------
  // ACTIVE SUBMENU NAVIGATION STATE
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<string>('');

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
  const handleAddJurnal = async (newEntry: Omit<Jurnal, 'id' | 'createdAt' | 'diinputOleh'>) => {
    if (!currentUser) return;

    try {
      const fullEntry: Jurnal = {
        ...newEntry,
        id: 'jur-j' + Date.now(),
        diinputOleh: currentUser.referenceId || currentUser.name || 'system',
        createdAt: new Date().toISOString()
      };

      // Optimistic update
      setJurnals(prev => [fullEntry, ...prev]);

      const res = await fetch('/api/jurnal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullEntry)
      });

      const result = await res.json();
      if (result.success) {
        if (Array.isArray(result.jurnals)) {
          setJurnals(result.jurnals);
        }
        showToast('Jurnal mengajar berhasil disimpan & dipublikasikan secara realtime!', 'success');
      } else {
        showToast('Gagal menyimpan ke database server: ' + (result.error || result.message || 'Error'), 'error');
      }
    } catch (err: any) {
      console.error('Error adding jurnal:', err);
      showToast('Gagal terhubung ke database server saat menyimpan jurnal.', 'error');
    }
  };

  const handleDeleteJurnal = async (id: string) => {
    try {
      setJurnals(prev => prev.filter(j => j.id !== id));
      const res = await fetch(`/api/jurnal/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        if (Array.isArray(result.jurnals)) {
          setJurnals(result.jurnals);
        }
        showToast('Laporan jurnal mengajar berhasil dihapus!', 'success');
      } else {
        showToast('Gagal menghapus dari database server.', 'error');
      }
    } catch (err: any) {
      console.error('Error deleting jurnal:', err);
      showToast('Gagal terhubung ke database server saat menghapus jurnal.', 'error');
    }
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
        <p className="mt-4 text-slate-500 font-medium tracking-wide">Memuat Data Database Realtime...</p>
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
          schoolInfo={schoolInfo}
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
          isRealtimeConnected={isRealtimeConnected}
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
              activeSubTab={activeTab}
              showToast={showToast}
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
              activeSubTab={activeTab}
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminPanel
              users={users}
              onUpdateUsers={handleUpdateUsers}
              jurusan={jurusan}
              onUpdateJurusan={handleUpdateJurusan}
              mapel={mapel}
              onUpdateMapel={handleUpdateMapel}
              kelas={kelas}
              onUpdateKelas={handleUpdateKelas}
              siswa={siswa}
              onUpdateSiswa={handleUpdateSiswa}
              guru={guru}
              onUpdateGuru={handleUpdateGuru}
              guruMengampu={guruMengampu}
              onUpdateGuruMengampu={handleUpdateGuruMengampu}
              schoolInfo={schoolInfo}
              onUpdateSchoolInfo={handleUpdateSchoolInfo}
              activeSubTab={activeTab}
              jurnals={jurnals}
              onAddJurnal={handleAddJurnal}
              onDeleteJurnal={handleDeleteJurnal}
              onOpenPrintModal={(type, classId, filterDate) => {
                setPrintModalParams({ type, classId, filterDate });
              }}
              showToast={showToast}
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
          currentUser={currentUser}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

    </div>
  );
}
