import React, { useState } from 'react';
import { Guru, Kelas, Mapel, Jurnal, Sekolah } from '../types';
import { 
  Calendar, Search, Filter, Printer, FileText, CheckCircle, 
  HelpCircle, AlertTriangle, FileSpreadsheet, Download, RefreshCw, Eye
} from 'lucide-react';

interface GuruPanelProps {
  guru: Guru;
  gurus: Guru[];
  kelas: Kelas[];
  mapel: Mapel[];
  jurnals: Jurnal[];
  schoolInfo: Sekolah;
  onPrintPreview: (type: 'harian' | 'mingguan' | 'bulanan', classId: string, filterDate?: string) => void;
  activeSubTab: string; // 'guru-dashboard' | 'guru-rekap'
}

export default function GuruPanel({
  guru,
  gurus,
  kelas,
  mapel,
  jurnals,
  schoolInfo,
  onPrintPreview,
  activeSubTab
}: GuruPanelProps) {
  
  // State for filtering
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('all');
  const [searchNotesQuery, setSearchNotesQuery] = useState<string>('');

  // Filter journals taught either by this teacher OR we display ALL journals with clear teacher tags
  // Teachers are usually interested in journals of their own teaching session, but let's give them both views!
  const myJournals = jurnals.filter(j => j.guruId ? j.guruId.split(',').map(id => id.trim()).includes(guru.id) : false);
  const allJournals = jurnals;
  
  // Choose which list to prioritize: let's allow them to toggle "Hanya mengajar saya" or "Seluruh Sekolah"
  const [viewScope, setViewScope] = useState<'my' | 'all'>('my');
  
  const activeJournalDataset = viewScope === 'my' ? myJournals : allJournals;

  // Perform filtering
  const filteredJournals = activeJournalDataset.filter((jr) => {
    // Date filter (exact match for "per tanggal" as requested or fallback if empty)
    const matchesDate = filterDate ? jr.tanggal === filterDate : true;
    
    // Class filter
    const matchesClass = selectedClassId === 'all' ? true : jr.kelasId === selectedClassId;
    
    // Mapel filter
    const matchesMapel = selectedMapelId === 'all' ? true : jr.mapelId === selectedMapelId;
    
    // Search text query
    const matchesSearch = searchNotesQuery.trim() === '' 
      ? true 
      : jr.catatan.toLowerCase().includes(searchNotesQuery.toLowerCase());

    return matchesDate && matchesClass && matchesMapel && matchesSearch;
  });

  const getClassName = (id: string) => kelas.find(k => k.id === id)?.nama || 'N/A';
  const getMapelName = (id: string) => mapel.find(m => m.id === id)?.nama || 'N/A';
  const getMapelCode = (id: string) => mapel.find(m => m.id === id)?.kode || 'N/A';

  // Stats
  const totalMyTeaching = myJournals.length;
  const totalHadir = myJournals.filter(j => j.statusKehadiran === 'hadir').length;
  const totalTugas = myJournals.filter(j => j.statusKehadiran === 'tugas').length;
  const totalTidak = myJournals.filter(j => j.statusKehadiran === 'tidak').length;

  const getPresenceBadge = (status: 'hadir' | 'tidak' | 'tugas') => {
    switch (status) {
      case 'hadir':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-250">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Hadir Teratur
          </span>
        );
      case 'tugas':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-250">
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            Dengan Tugas
          </span>
        );
      case 'tidak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-250">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Tidak Hadir
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Teacher Welcoming Banner */}
      <div className="p-6 md:p-8 bg-indigo-600 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/4 opacity-10 bg-[radial-gradient(ellipse_at_center,#fff_20%,transparent_80%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/10 text-indigo-150 text-xs font-bold rounded-full mb-3">
              Tenaga Pendidik Berwenang
            </span>
            <h2 className="text-3xl font-black tracking-tight leading-none mb-2 font-display">{guru.nama}</h2>
            <p className="text-sm font-mono text-indigo-200 uppercase tracking-widest">KODE GURU: {guru.kodeGuru || 'Belum Terdaftar'}</p>
            <p className="text-indigo-100 text-sm mt-3 max-w-xl">
              Gunakan panel ini untuk mereview, memvalidasi, dan mencetak laporan harian, mingguan, maupun bulanan berdasarkan input dari ketua kelas.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onPrintPreview('harian', selectedClassId === 'all' ? kelas[0]?.id : selectedClassId, filterDate)}
              className="py-3 px-4 bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Harian</span>
            </button>
            <button
              onClick={() => onPrintPreview('mingguan', selectedClassId === 'all' ? kelas[0]?.id : selectedClassId, filterDate)}
              className="py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Mingguan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Summary Numbers */}
      {activeSubTab === 'guru-dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Jam Mengajar</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-black text-slate-800">{totalMyTeaching}</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2">Terhitung sejak awal semester</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hadir Mengajar</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-black text-emerald-600">{totalHadir}</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2">Rasio kehadiran: {totalMyTeaching > 0 ? Math.round((totalHadir/totalMyTeaching)*100) : 100}%</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tugas Terdistribusi</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-black text-amber-600">{totalTugas}</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2">Tugas mandiri via Ketua Kelas</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Guru Berhalangan</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-3xl font-black text-rose-600">{totalTidak}</span>
                <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-2">Tanpa tugas / jam kosong</p>
            </div>

          </div>

          {/* Quick instructions and scope toggle section */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Quick printable card selector */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mb-2">Pusat Cetak Laporan Jurnal</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Ekspor rekaman harian, mingguan, atau bulanan langsung ke dalam format dokumen cetak resmi sekolah. Laporan sudah terformat dengan Kop Surat resmi dan kolom tanda tangan Kepala Sekolah.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PILIH KELAS SASARAN</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="block w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    >
                      {kelas.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">TANGGAL DASAR</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="block w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6">
                <button
                  onClick={() => onPrintPreview('harian', selectedClassId === 'all' ? kelas[0]?.id : selectedClassId, filterDate)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-1 border border-slate-250"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Harian</span>
                </button>
                <button
                  onClick={() => onPrintPreview('mingguan', selectedClassId === 'all' ? kelas[0]?.id : selectedClassId, filterDate)}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-1 border border-rose-200/50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Mingguan</span>
                </button>
                <button
                  onClick={() => onPrintPreview('bulanan', selectedClassId === 'all' ? kelas[0]?.id : selectedClassId, filterDate)}
                  className="py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-1 border border-orange-200/50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Bulanan</span>
                </button>
              </div>
            </div>

            {/* Quick access cards information */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-850 font-bold font-mono text-[9px] rounded-md tracking-wider uppercase">INFORMASI HARIAN</span>
                <h4 className="text-sm font-bold text-slate-800">Petunjuk Kurikulum Sekolah</h4>
                <p className="text-xs text-slate-650 leading-relaxed">
                  Laporan rekapitulasi jurnal harian berfungsi untuk memantau kelangsungan Kurikulum Merdeka di sekolah secara terintegrasi harian. Jika terdapat ketidaksamaan log data, guru disarankan melakukan koordinasi langsung dengan Ketua Kelas bersangkutan agar revisi entri dapat segera diproses dari halaman Admin.
                </p>
                <p className="text-[11px] text-slate-400 font-semibold italic">NPSN Aktif: {schoolInfo.npsn} | Server: Cloud Indonesia 2026</p>
              </div>
              <button 
                onClick={() => setViewScope(viewScope === 'my' ? 'all' : 'my')}
                className="mt-4 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 text-left cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Jurnal {viewScope === 'my' ? 'Seluruh Sekolah' : 'Hanya Mata Pelajaran Saya'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Journal Recap / List Table */}
      {(activeSubTab === 'guru-rekap' || activeSubTab === 'guru-dashboard') && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Daftar Rekap Jurnal Mengajar Sekolah</h3>
              <p className="text-xs text-slate-450">Review entri harian yang telah dipublikasikan secara real-time berdasarkan tanggal</p>
            </div>
            
            {/* View Scope Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl self-start lg:self-center">
              <button
                type="button"
                onClick={() => setViewScope('my')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewScope === 'my' 
                    ? 'bg-white text-rose-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Mata Pelajaran Anda
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewScope === 'all' 
                    ? 'bg-white text-rose-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Seluruh Jurnal Kelas
              </button>
            </div>
          </div>

          {/* Filtering Widgets Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            
            {/* Date filter */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-widest mb-1.5 flex items-center gap-1 text-left">
                <Calendar className="w-3 h-3 text-rose-500" />
                Filter Per Tanggal
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Class filter */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-widest mb-1.5 text-left">
                Filter Struktur Kelas
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Mapel filter */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-widest mb-1.5 text-left">
                Filter Mata Pelajaran
              </label>
              <select
                value={selectedMapelId}
                onChange={(e) => setSelectedMapelId(e.target.value)}
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Mapel</option>
                {mapel.map((m) => (
                  <option key={m.id} value={m.id}>[{m.kode}] - {m.nama}</option>
                ))}
              </select>
            </div>

            {/* Search filter */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-widest mb-1.5 text-left">
                Cari Berdasarkan Bahasan
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik topik materi..."
                  value={searchNotesQuery}
                  onChange={(e) => setSearchNotesQuery(e.target.value)}
                  className="w-full text-xs font-semibold pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

          </div>

          {/* Table view */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-650 min-w-[800px]">
              <thead className="bg-slate-50 text-slate-800 uppercase text-xs tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3">Hari & Tanggal</th>
                  <th scope="col" className="px-4 py-3">Jam Ke</th>
                  <th scope="col" className="px-4 py-3">Kelas</th>
                  <th scope="col" className="px-6 py-3">Mata Pelajaran</th>
                  <th scope="col" className="px-5 py-3">Guru Mengajar</th>
                  <th scope="col" className="px-4 py-3">Kehadiran</th>
                  <th scope="col" className="px-6 py-3">Pembahasan / Resume Tugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Tidak ditemukan entri jurnal kelas yang cocok dengan filter tanggal & parameter terpilih.
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((jr) => (
                    <tr key={jr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block text-xs">{jr.tanggal}</span>
                        <span className="text-xs text-slate-400 font-mono">{jr.hari}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-xs bg-slate-100 text-slate-700 py-1 px-2 rounded">
                          Jam {jr.jamKe}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-xs bg-orange-100/60 text-orange-900 border border-orange-200/50 py-1 px-2.5 rounded-md">
                          {getClassName(jr.kelasId)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-bold text-slate-800 text-xs leading-tight">{getMapelName(jr.mapelId)}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{getMapelCode(jr.mapelId)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${jr.guruId ? jr.guruId.split(',').map(x => x.trim()).includes(guru.id) : false ? 'text-rose-600 font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : 'text-slate-650'}`}>
                          {jr.guruId ? jr.guruId.split(',').map(subId => {
                            const trimmed = subId.trim();
                            if (trimmed === guru.id) return 'Anda';
                            return gurus.find(g => g.id === trimmed)?.nama || 'Guru';
                          }).join(' & ') : 'Guru'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getPresenceBadge(jr.statusKehadiran)}
                      </td>
                      <td className="px-6 py-3 max-w-sm">
                        <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-150 whitespace-pre-line leading-relaxed text-left">
                          {jr.catatan}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Menampilkan <strong>{filteredJournals.length}</strong> dari total {activeJournalDataset.length} entri terdata.</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono text-xs">Scope: {viewScope === 'my' ? 'Mata Pelajaran Anda' : 'Semua Guru'}</span>
          </div>

        </div>
      )}

    </div>
  );
}
