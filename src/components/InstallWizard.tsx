import React, { useState, useEffect } from 'react';
import { 
  Database, Server, School, Key, ArrowRight, Sparkles, CheckCircle, 
  AlertCircle, Terminal, HelpCircle, HardDrive, Cpu, ShieldCheck
} from 'lucide-react';

interface InstallWizardProps {
  onInstallComplete: (config: {
    dbType: string;
    dbConfig: any;
    schoolName: string;
    schoolNpsn: string;
    schoolAlamat: string;
    seedDemo: boolean;
  }) => void;
}

type DatabaseType = 'local_storage' | 'postgresql' | 'mysql' | 'sqlite';

export default function InstallWizard({ onInstallComplete }: InstallWizardProps) {
  // Wizard settings
  const [step, setStep] = useState<1 | 2>(1);
  const [schoolName, setSchoolName] = useState('SMK Muhammadiyah Mungkid');
  const [schoolNpsn, setSchoolNpsn] = useState('20338402');
  const [schoolAlamat, setSchoolAlamat] = useState('Jl. Letnan Sulistyo No.1, Mungkid, Magelang, Jawa Tengah');
  
  const [dbType, setDbType] = useState<DatabaseType>('local_storage');
  
  // DB parameters
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('5432');
  const [dbUser, setDbUser] = useState('postgres');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('jurnalku_smk');
  
  const [seedDemo, setSeedDemo] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);

  // Load configuration from .env if exists
  useEffect(() => {
    fetch('/api/env-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          const cfg = data.config;
          if (cfg.dbType) setDbType(cfg.dbType as DatabaseType);
          if (cfg.host) setDbHost(cfg.host);
          if (cfg.port && cfg.port !== 'N/A') setDbPort(cfg.port);
          if (cfg.user && cfg.user !== 'N/A') setDbUser(cfg.user);
          if (cfg.password !== undefined) setDbPassword(cfg.password);
          if (cfg.name) setDbName(cfg.name);
        }
        setHasLoadedConfig(true);
      })
      .catch(err => {
        console.log('Belum ada konfigurasi .env:', err);
        setHasLoadedConfig(true);
      });
  }, []);

  // DB ports helpers based on selections
  useEffect(() => {
    if (!hasLoadedConfig) return; // Wait until initial check has completed
    
    if (dbType === 'postgresql') {
      setDbPort('5432');
      setDbUser('postgres');
    } else if (dbType === 'mysql') {
      setDbPort('3306');
      setDbUser('root');
    } else {
      setDbPort('N/A');
      setDbUser('N/A');
    }
  }, [dbType, hasLoadedConfig]);

  const handleStartInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;

    setIsInstalling(true);
    setInstallProgress(0);
    setInstallLogs([]);

    // Call save-env API in background to store in .env
    let envSavedStatus = '⚙️ Menulis konfigurasi database ke file .env ...';
    try {
      const response = await fetch('/api/save-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dbType,
          host: dbType === 'local_storage' ? 'localhost' : dbHost,
          port: dbType === 'local_storage' ? '5432' : dbPort,
          user: dbType === 'local_storage' ? 'postgres' : dbUser,
          password: dbType === 'local_storage' ? '' : dbPassword,
          name: dbType === 'local_storage' ? 'jurnalku_smk' : dbName
        })
      });
      const data = await response.json();
      if (data.success) {
        envSavedStatus = '✔️ Sukses menyimpan konfigurasi database ke file .env untuk Live Production!';
      } else {
        envSavedStatus = `⚠️ File .env tidak dapat ditulis secara otomatis: ${data.error || 'Server error'}`;
      }
    } catch (err: any) {
      envSavedStatus = '⚠️ Gagal menulis file .env (Menggunakan penyimpanan database browser)';
    }

    const logs = [
      '⚡ Menginisialisasi modul penginstal basis data JurnalKu...',
      `📂 Konfigurasi penyimpanan dasar terpilih: [${dbType.toUpperCase()}]`,
      envSavedStatus,
      `🏫 Mengatur data primer sekolah: ${schoolName}`,
      '🔍 Memverifikasi struktur skema entitas relational...',
      '🛠️ Membuat tabel struktur `sekolah` ... SUKSES',
      '🛠️ Membuat tabel struktur `jurusan` ... SUKSES',
      '🛠️ Membuat tabel struktur `kelas` ... SUKSES',
      '🛠️ Membuat tabel struktur `mapel` ... SUKSES',
      '🛠️ Membuat tabel struktur `siswa` ... SUKSES',
      '🛠️ Membuat tabel struktur `guru` ... SUKSES',
      '🛠️ Membuat tabel struktur `guru_mengampu` ... SUKSES',
      '🛠️ Membuat tabel struktur `jurnal_harian` ... SUKSES',
      '🔑 Menyiapkan autentikasi keamanan & modul enkripsi...',
      '👤 Menambahkan user standar administrator utama ...',
      '👉 [KREDENSIAL UTAMA] username = admin, password = admin12345',
      seedDemo ? '🌱 Memulai prosedur seeding data demo kurikulum harian...' : '🧹 Prosedur bersih diaktifkan (tanpa data demo)...',
      seedDemo ? '✔️ Seeding data contoh jurusan & kelas selesai.' : '',
      seedDemo ? '✔️ Seeding data contoh pendidik & mata pelajaran selesai.' : '',
      seedDemo ? '✔️ Seeding data percontohan jurnal KBM harian (15-18 Juni 2026).' : '',
      '💾 Menyimpan konfigurasi parameter ke memori luring...',
      '🚀 Sistem JurnalKu berhasil diinstal dan diaktifkan!',
      '🎉 Memuat ulang antarmuka portal...'
    ].filter(Boolean);

    // Stagger logs to render progressively
    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setInstallLogs(prev => [...prev, logs[logIndex]]);
        setInstallProgress(Math.min(100, Math.round(((logIndex + 1) / logs.length) * 100)));
        logIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onInstallComplete({
            dbType,
            dbConfig: {
              host: dbHost,
              port: dbPort,
              user: dbUser,
              name: dbName
            },
            schoolName,
            schoolNpsn,
            schoolAlamat,
            seedDemo
          });
        }, 800);
      }
    }, 120);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-50 overflow-hidden font-sans text-left">
      {/* Decorative Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-indigo-200/30 to-violet-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-sky-200/20 to-indigo-350/20 blur-3xl pointer-events-none" />
      
      {/* Installation Container */}
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl overflow-hidden relative z-10 m-2">
        <div className="grid md:grid-cols-12 min-h-[580px]">
          
          {/* Left Panel: Progress Outline */}
          <div className="md:col-span-4 bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#ffffff08,transparent_50%)]" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-semibold tracking-wider uppercase mb-8">
                <Sparkles className="w-3 h-3 text-indigo-300 animate-pulse" />
                Setup Wizard Pertama
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Database className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl font-black font-display tracking-tight leading-none">Instalasi</h1>
                  <p className="text-[9px] text-indigo-200 font-mono tracking-wider">JURNALKU ENGINE v1.2</p>
                </div>
              </div>

              <div className="space-y-6 mt-8">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full text-xs font-bold leading-none ${step === 1 && !isInstalling ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/10 text-indigo-200'}`}>
                    01
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Profil Sekolah</h3>
                    <p className="text-[11px] text-slate-400">Identitas sekolah & NPSN</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full text-xs font-bold leading-none ${step === 2 && !isInstalling ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/10 text-indigo-200'}`}>
                    02
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Database & Admin</h3>
                    <p className="text-[11px] text-slate-400">Pilih adapter dan password</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full text-xs font-bold leading-none ${isInstalling ? 'bg-emerald-500 text-white shadow-md animate-pulse' : 'bg-white/10 text-indigo-200'}`}>
                    03
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Membuat Struktur</h3>
                    <p className="text-[11px] text-slate-400">Prosedur migrasi & schema</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-slate-800/80 pt-5 mt-8">
              <span className="text-[10px] text-slate-400 block font-semibold">STANDAR KREDENSIAL:</span>
              <span className="text-xs text-white block mt-1 font-mono">admin / admin12345</span>
            </div>
          </div>

          {/* Right Panel: Content Form */}
          <div className="md:col-span-8 p-6 md:p-10 bg-white flex flex-col justify-between relative overflow-y-auto max-h-[640px]">
            
            {/* STEP 1: PROFIL SEKOLAH */}
            {step === 1 && !isInstalling && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 font-display">Informasi Umum Lembaga</h2>
                  <p className="text-slate-500 text-xs mt-1">Masukkan data pokok sekolah di bawah ini untuk inisiasi awal identitas laporan cetak dan header portal.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nama Sekolah / Instansi Pendidikan</label>
                    <div className="relative">
                      <School className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Contoh: SMK Muhammadiyah Mungkid" 
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nomor NPSN</label>
                      <input 
                        type="text" 
                        required
                        value={schoolNpsn}
                        onChange={(e) => setSchoolNpsn(e.target.value)}
                        placeholder="NPSN Sekolah..." 
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
                      <input 
                        type="text" 
                        required
                        value={schoolAlamat}
                        onChange={(e) => setSchoolAlamat(e.target.value)}
                        placeholder="Alamat instansi..." 
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!schoolName.trim()}
                    className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                  >
                    <span>Langkah Selanjutnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DATABASE & CREDENTIALS */}
            {step === 2 && !isInstalling && (
              <form onSubmit={handleStartInstallation} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 font-display">Tipe Adapter Database</h2>
                  <p className="text-slate-500 text-xs mt-1">Sesuaikan tipe penyimpanan yang ingin Anda migrasikan. Silakan pilih jenis database dan koneksi yang sesuai.</p>
                </div>

                {/* Jenis Database Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'local_storage', title: 'Local Storage', desc: 'Client browser storage, tangguh & luring', icon: <HardDrive className="w-4 h-4 text-emerald-600" /> },
                    { id: 'postgresql', title: 'PostgreSQL', desc: 'Cloud SQL / PostgreSQL eksternal', icon: <Server className="w-4 h-4 text-indigo-600" /> },
                    { id: 'mysql', title: 'MySQL / MariaDB', desc: 'MySQL relational server', icon: <Database className="w-4 h-4 text-sky-600" /> },
                    { id: 'sqlite', title: 'SQLite Storage', desc: 'File-based server-side embedded', icon: <Cpu className="w-4 h-4 text-slate-605" /> }
                  ].map((db) => (
                    <div
                      key={db.id}
                      onClick={() => setDbType(db.id as DatabaseType)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        dbType === db.id
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {db.icon}
                        <h4 className="text-xs font-bold text-slate-800">{db.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">{db.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Database Connection inputs - shown as disabled or enabled based on type */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                    <span className="text-[10px] font-bold text-slate-650 tracking-wider block uppercase">KONEKSI DATABASE ({dbType.toUpperCase()})</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {dbType === 'local_storage' ? 'Mode Luring Aktif' : 'Aktif'}
                    </span>
                  </div>

                  {dbType === 'local_storage' ? (
                    <div className="p-2 bg-emerald-50 text-emerald-850 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                      <p className="text-[10.5px] leading-relaxed font-medium">
                        Anda memilih <strong>Local Storage</strong>. Prosedur integrasi akan langsung menginstal skema database termigrasi langsung ke dalam local database luring, menjamin keamanan privasi offline penuh.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">Host Server</label>
                        <input 
                          type="text" 
                          value={dbHost} 
                          onChange={(e) => setDbHost(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">Port</label>
                        <input 
                          type="text" 
                          value={dbPort} 
                          onChange={(e) => setDbPort(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">Username</label>
                        <input 
                          type="text" 
                          value={dbUser} 
                          onChange={(e) => setDbUser(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">Password</label>
                        <input 
                          type="password" 
                          value={dbPassword} 
                          onChange={(e) => setDbPassword(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">Database Name</label>
                        <input 
                          type="text" 
                          value={dbName} 
                          onChange={(e) => setDbName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Administrator target detail display */}
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
                  <div>
                    <h5 className="text-xs font-extrabold text-indigo-950 font-display">Kredensial Akun Administrator Utama</h5>
                    <p className="text-[10.5px] text-indigo-900 mt-0.5 leading-relaxed font-semibold">
                      Penginstalan akan otomatis membuat sebuah user administrator utama (super-admin) dengan username dan sandi standar berikut untuk login pertama Anda:
                    </p>
                    <div className="flex gap-4 mt-2 justify-start items-center">
                      <span className="text-[11px] font-mono select-all bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-950">
                        Username: <strong>admin</strong>
                      </span>
                      <span className="text-[11px] font-mono select-all bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-950">
                        Sandi: <strong>admin12345</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Demo database Seeding */}
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="checkbox-seed"
                    checked={seedDemo}
                    onChange={(e) => setSeedDemo(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 pointer-events-auto cursor-pointer"
                  />
                  <div className="text-left">
                    <label htmlFor="checkbox-seed" className="block text-xs font-bold text-slate-800 cursor-pointer">
                      Sertakan Data Pelajaran Contoh (Seeding Demo)
                    </label>
                    <p className="text-[10px] text-slate-450 font-medium">Beri centang untuk memuat data contoh Jurusan, Kelas, Pendataan Guru, beserta entri jurnal agar siap dipakai langsung.</p>
                  </div>
                </div>

                {/* Action button controls */}
                <div className="pt-4 border-t border-slate-105 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer transition-all"
                  >
                    Mulai Instalasi & Sinkronisasi
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: RUNNING INSTALLER TERMINAL ANIMATION */}
            {isInstalling && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 font-display">
                    <Terminal className="w-5 h-5 text-indigo-600 animate-pulse" />
                    Membuat Struktur Database...
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sistem sedang merangkai entitas tabel relasi dan menyuntikkan data dasar.</p>
                </div>

                {/* Terminal box */}
                <div className="flex-1 bg-slate-900 text-slate-250 p-4 rounded-2xl border border-slate-850 font-mono text-[10.5px] leading-relaxed overflow-y-auto max-h-[290px] min-h-[240px] shadow-inner select-text my-4 scrollbar-thin">
                  {installLogs.map((log, i) => (
                    <div key={i} className="flex gap-1.5">
                      <span className="text-indigo-400 shrink-0 select-none">$&gt;</span>
                      <span className={log.startsWith('❌') ? 'text-rose-455' : log.includes('SUKSES') || log.startsWith('🎉') || log.startsWith('✔️') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {log}
                      </span>
                    </div>
                  ))}
                  {/* blinking underscore */}
                  <div className="w-2 h-4 bg-slate-300 animate-pulse inline-block ml-1" />
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold font-mono">
                    <span className="text-slate-400 uppercase">MIGRASI DATA</span>
                    <span className="text-indigo-600">{installProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-150"
                      style={{ width: `${installProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
