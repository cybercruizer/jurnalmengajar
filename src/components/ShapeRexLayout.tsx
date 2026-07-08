import React, { useState, useEffect } from 'react';
import { User, Sekolah } from '../types';
import { 
  LogOut, School, ShieldAlert, BookOpen, UserCheck, Menu, X, 
  Calendar, Clock, User as UserIcon, ListFilter, AlertCircle, ClipboardList
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: ('admin' | 'guru' | 'siswa')[];
}

interface ShapeRexLayoutProps {
  user: User;
  onLogout: () => void;
  schoolInfo: Sekolah;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  children: React.ReactNode;
}

export default function ShapeRexLayout({ 
  user, 
  onLogout, 
  schoolInfo, 
  activeTab, 
  setActiveTab, 
  children 
}: ShapeRexLayoutProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'guru': return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'siswa': return <UserCheck className="w-4 h-4 text-indigo-500" />;
      default: return <UserIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-100/70 text-amber-900 border border-amber-200/50 rounded-xl';
      case 'guru': return 'bg-emerald-100/70 text-emerald-900 border border-emerald-200/50 rounded-xl';
      case 'siswa': return 'bg-indigo-100/70 text-indigo-900 border border-indigo-200/50 rounded-xl';
      default: return 'bg-slate-100 text-slate-800 rounded-xl';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Staf Admin';
      case 'guru': return 'Guru Pengampu';
      case 'siswa': return 'Ketua Kelas';
      default: return 'Pengguna';
    }
  };

  const menuItems: SidebarItem[] = [
    // SISWA / KETUA KELAS TABS
    {
      id: 'siswa-input',
      label: 'Input Jurnal Harian',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['siswa']
    },
    {
      id: 'siswa-riwayat',
      label: 'Riwayat Jurnal Kelas',
      icon: <ListFilter className="w-4 h-4" />,
      roles: ['siswa']
    },

    // GURU TABS
    {
      id: 'guru-dashboard',
      label: 'Dashboard Recap',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['guru']
    },
    {
      id: 'guru-rekap',
      label: 'Daftar Jurnal Belajar',
      icon: <ListFilter className="w-4 h-4" />,
      roles: ['guru']
    },

    // ADMIN TABS
    {
      id: 'admin-dashboard',
      label: 'Sistem Informasi Utama',
      icon: <School className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-rekap-harian',
      label: 'Rekap KBM Harian',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-users',
      label: 'Manajemen User / Akun',
      icon: <UserIcon className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-jurusan',
      label: 'Data Jurusan Sekolah',
      icon: <ListFilter className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-kelas',
      label: 'Data Struktur Kelas',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-mapel',
      label: 'Data Mata Pelajaran',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-siswa',
      label: 'Data Peserta Didik (Siswa)',
      icon: <UserCheck className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-guru',
      label: 'Data Tenaga Pendidik (Guru)',
      icon: <UserIcon className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-mengampu',
      label: 'Guru Mengampu Mapel',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['admin']
    },
    {
      id: 'admin-sekolah',
      label: 'Identitas Sekolah Kami',
      icon: <School className="w-4 h-4" />,
      roles: ['admin']
    }
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative font-sans antialiased">
      {/* Decorative Blur Background Bubbles based on uploaded template visual design */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-indigo-200/20 to-violet-200/20 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-20 left-10 w-[30vw] h-[30vw] rounded-full bg-gradient-to-br from-sky-200/10 to-indigo-250/10 blur-3xl pointer-events-none z-0" />

      {/* Main Structural Wrapper with floating styling */}
      <div className="flex relative z-10 min-h-screen">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-850 h-screen sticky top-0 shrink-0 select-none text-slate-300">
          <div className="p-6 border-b border-slate-850 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xl font-display shadow-lg shadow-indigo-500/25 shrink-0">
              J
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg tracking-tight truncate leading-tight font-display">
                JurnalKu
              </h2>
              <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase font-mono mt-0.5">
                BENTO CONTROL
              </p>
            </div>
          </div>

          <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1.5 custom-scrollbar">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              MENU UTAMA
            </p>
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3.5 transition-all text-left cursor-pointer group ${
                  activeTab === item.id
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/15'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <div className={`transition-transform group-hover:scale-110 duration-200 ${
                  activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  {item.icon}
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

          {/* School Identifier Indicator & Footer menu */}
          <div className="p-4 border-t border-slate-850 bg-slate-950/20">
            <div className="p-3 bg-slate-850 border border-slate-800 rounded-xl mb-3">
              <div className="flex items-center gap-2 mb-1">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekolah Aktif</span>
              </div>
              <p className="text-xs font-bold text-white truncate line-clamp-1">{schoolInfo.nama}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">NPSN : {schoolInfo.npsn}</p>
            </div>
            
            <button
              onClick={onLogout}
              id="sidebar-logout"
              className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/45 text-rose-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer border border-rose-900/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sesi (Logout)</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden">
            <div className="w-80 max-w-[85vw] bg-slate-900 text-slate-300 h-full flex flex-col shadow-2xl relative">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-450 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                  J
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-base tracking-tight font-display">
                    JurnalKu
                  </h2>
                  <p className="text-[9px] font-mono text-indigo-400 uppercase">SMART CONTROL</p>
                </div>
              </div>

              <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1.5">
                <p className="px-3 text-[9px] font-bold text-slate-500 tracking-wider uppercase mb-3">
                  MENU NAVIGASI
                </p>
                {visibleMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center gap-3.5 transition-colors cursor-pointer text-left ${
                      activeTab === item.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className={activeTab === item.id ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                <button
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-900/35"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Bar / Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-18 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
            
            {/* Toggle Button for Mobile Screen */}
            <div className="flex items-center gap-3 lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black font-display text-base">J</div>
                <span className="font-extrabold text-sm text-slate-900 tracking-tight font-display">
                  JurnalKu
                </span>
              </div>
            </div>

            {/* Desktop Left Header Indicator */}
            <div className="hidden lg:flex items-center gap-3 text-sm text-slate-500">
              <Calendar className="w-4.5 h-4.5 text-indigo-550" />
              <span className="font-semibold text-slate-750 text-xs">{currentDate || 'Memuat Tanggal...'}</span>
              <span className="text-slate-300">|</span>
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100/30 px-2 py-0.5 rounded-md">{currentTime || '00:00:00'}</span>
            </div>

            {/* Right User Profiler Panel */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight font-display">{user.name}</span>
                <span className="text-[10px] text-slate-450 font-mono">ID: {user.username}</span>
              </div>

              {/* Role Indicator Widget */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-250">
                <div className={`px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 ${getRoleBadge(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span>{getRoleLabel(user.role)}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-mono text-sm shadow-md shadow-indigo-500/10 shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Core Body Container */}
          <main className="flex-1 p-4 md:p-8 relative z-10">
            {children}
          </main>

          {/* Footer element */}
          <footer className="py-4 px-4 md:px-8 border-t border-slate-200/50 text-center text-xs text-slate-400 mt-12 bg-white/40">
            &copy; 2026 <strong>{schoolInfo.nama}</strong>. Aplikasi Jurnal Mengajar Digital - Dikembangkan berdasar standar Kurikulum.
          </footer>
        </div>
      </div>
    </div>
  );
}
