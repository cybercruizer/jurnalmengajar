import React, { useState, useEffect } from 'react';
import { Siswa, Kelas, Mapel, Guru, Jurnal, GuruMengampu } from '../types';
import { 
  BookOpen, Plus, Calendar, Clock, ClipboardList, CheckCircle, 
  HelpCircle, AlertTriangle, FileSpreadsheet, Sparkles, Send, Trash2
} from 'lucide-react';

interface SiswaPanelProps {
  siswa: Siswa;
  kelas: Kelas[];
  mapel: Mapel[];
  guru: Guru[];
  guruMengampu: GuruMengampu[];
  jurnals: Jurnal[];
  onAddJurnal: (jurnal: Omit<Jurnal, 'id' | 'createdAt' | 'diinputOleh'>) => void;
  onDeleteJurnal?: (id: string) => void;
  activeSubTab: string; // 'siswa-input' | 'siswa-riwayat'
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function SiswaPanel({
  siswa,
  kelas,
  mapel,
  guru,
  guruMengampu,
  jurnals,
  onAddJurnal,
  onDeleteJurnal,
  activeSubTab,
  showToast
}: SiswaPanelProps) {
  
  // Find Student's class
  const studentClass = kelas.find(k => k.id === siswa.kelasId);

  const showError = (msg: string) => {
    if (showToast) {
      showToast(msg, 'error');
    } else {
      alert(msg);
    }
  };

  // States for input form
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [jamMulai, setJamMulai] = useState<number>(1);
  const [jamSelesai, setJamSelesai] = useState<number>(2);
  const [selectedMapelId, setSelectedMapelId] = useState<string>('');
  const [selectedGuruIds, setSelectedGuruIds] = useState<string[]>([]);
  const [statusPresence, setStatusPresence] = useState<'hadir' | 'tidak' | 'tugas'>('hadir');
  const [notes, setNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Auto-resolve day of the week from selected date
  useEffect(() => {
    if (!selectedDate) return;
    const daysIndonesian = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dateObj = new Date(selectedDate);
    const dayName = daysIndonesian[dateObj.getDay()];
    setSelectedDay(dayName);
  }, [selectedDate]);

  // Pre-fill first subject and try to find matching teacher
  useEffect(() => {
    if (mapel.length > 0 && !selectedMapelId) {
      setSelectedMapelId(mapel[0].id);
    }
  }, [mapel, selectedMapelId]);

  // Auto-resolve Assigned Teacher based on selected Mapel and Student's class
  useEffect(() => {
    if (!selectedMapelId || !siswa.kelasId) return;
    
    // Look up all matching guru mengampu mappings
    const matches = guruMengampu.filter(
      g => g.mapelId === selectedMapelId && g.kelasId === siswa.kelasId
    );

    if (matches.length > 0) {
      const ids = Array.from(new Set(
        matches.flatMap(match => match.guruId.split(',').map(id => id.trim()).filter(Boolean))
      ));
      setSelectedGuruIds(ids);
    } else {
      setSelectedGuruIds([]);
    }
  }, [selectedMapelId, siswa.kelasId, guruMengampu, guru]);

  // Filter journals logged specifically for this student's class
  const myClassJournals = jurnals
    .filter(j => j.kelasId === siswa.kelasId)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const getMapelName = (id: string) => mapel.find(m => m.id === id)?.nama || 'Mata Pelajaran Tidak Diketahui';
  
  const getGuruName = (id: string) => {
    if (!id) return 'Guru Tidak Diketahui';
    return id.split(',').map(subId => {
      const g = guru.find(x => x.id === subId.trim());
      return g ? g.nama : 'Guru Tidak Diketahui';
    }).join(' & ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMapelId) {
      showError('Maaf, Mata Pelajaran harus dipilih.');
      return;
    }
    if (selectedGuruIds.length === 0) {
      showError('Maaf, minimal harus memilih 1 guru pengampu.');
      return;
    }
    if (!notes.trim()) {
      showError('Mohon isi ringkasan materi harian/catatan tugas!');
      return;
    }

    const jamKeStr = jamMulai === jamSelesai ? `${jamMulai}` : `${jamMulai}-${jamSelesai}`;

    onAddJurnal({
      hari: selectedDay,
      tanggal: selectedDate,
      jamKe: jamKeStr,
      kelasId: siswa.kelasId,
      mapelId: selectedMapelId,
      guruId: selectedGuruIds.join(','),
      statusKehadiran: statusPresence,
      catatan: notes.trim()
    });

    setNotes('');
    setSuccessMsg('Jurnal mengajar berhasil disimpan ke rekapitulasi!');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const getPresenceStyles = (status: 'hadir' | 'tidak' | 'tugas') => {
    switch (status) {
      case 'hadir': return 'bg-emerald-50 text-emerald-800 border bg-emerald-100/50 border-emerald-300';
      case 'tugas': return 'bg-amber-50 text-amber-800 border bg-amber-100/50 border-amber-300';
      case 'tidak': return 'bg-rose-50 text-rose-800 border bg-rose-100/50 border-rose-300';
    }
  };

  const getPresenceBadge = (status: 'hadir' | 'tidak' | 'tugas') => {
    switch (status) {
      case 'hadir':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-250">
            <CheckCircle className="w-3.5 h-3.5" />
            Hadir Guru
          </span>
        );
      case 'tugas':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-250">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Diberi Tugas
          </span>
        );
      case 'tidak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-250">
            <AlertTriangle className="w-3.5 h-3.5" />
            Tidak Hadir
          </span>
        );
    }
  };

  // Stats for current class's journal
  const totalEntries = myClassJournals.length;
  const presenceRate = totalEntries > 0 
    ? Math.round((myClassJournals.filter(j => j.statusKehadiran === 'hadir').length / totalEntries) * 100)
    : 100;
  const totalTugas = myClassJournals.filter(j => j.statusKehadiran === 'tugas').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner introducing current role and class */}
      <div className="p-6 md:p-8 bg-indigo-600 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,#fff_10%,transparent_70%)]" />
        <div className="relative z-10 grid md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium tracking-wide mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Siswa Pengisi Jurnal Harian
            </div>
            <h2 className="text-3xl font-black font-display tracking-tight leading-none mb-2">Halo, {siswa.nama}!</h2>
            <p className="text-indigo-100 text-sm max-w-xl">
              Sebagai Ketua Kelas yang ditunjuk, Anda bertanggung jawab mengisi jurnal mengajar setiap jam pelajaran secara berkala, jujur, dan akurat.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4.5 border border-white/20 text-center">
            <p className="text-xs font-bold tracking-widest text-indigo-200 uppercase">KELAS ANDA</p>
            <p className="text-3xl font-extrabold tracking-tight text-white mt-1 font-display">{studentClass?.nama || 'N/A'}</p>
            <p className="text-[11px] text-indigo-100 font-mono mt-0.5">Automated Smart Lock</p>
          </div>
        </div>
      </div>

      {/* Basic Metrics row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Jurnal Diinput</p>
            <p className="text-2.5xl font-black mt-1 text-slate-800">{totalEntries} <span className="text-xs font-normal text-slate-400">kali masuk</span></p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kehadiran Guru Kelas</p>
            <p className="text-2.5xl font-black mt-1 text-emerald-600">{presenceRate}% <span className="text-xs font-normal text-slate-400">hadir</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pembelajaran Mandiri (Tugas)</p>
            <p className="text-2.5xl font-black mt-1 text-orange-600">{totalTugas} <span className="text-xs font-normal text-slate-400">agenda</span></p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main interactive split view */}
      {activeSubTab === 'siswa-input' ? (
        <div className="grid lg:grid-cols-12 gap-6">

          {/* Left Block: Journal filing form */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <BookOpen className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight font-display">Formulir Penginputan Jurnal Harian</h3>
                <p className="text-xs text-slate-400">Data kelas terisi otomatis berdasarkan registrasi Ketua Kelas</p>
              </div>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-xl text-xs font-semibold flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-450" />
                    Tanggal Belajar
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full px-4.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all outline-none"
                  />
                </div>

                {/* Hari - Auto resolved */}
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">
                    Hari (Otomatis)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedDay}
                    className="block w-full px-4.5 py-3 bg-slate-100 border border-slate-205 rounded-xl text-slate-500 text-sm font-semibold select-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Jam-ke 2 Select Forms */}
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-450" />
                    Jam Pelajaran (Durasi)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={jamMulai}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setJamMulai(val);
                          if (val > jamSelesai) {
                            setJamSelesai(val);
                          }
                        }}
                        className="block w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer font-bold outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>Mulai Jam {h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={jamSelesai}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= jamMulai) {
                            setJamSelesai(val);
                          } else {
                            showError('Jam selesai tidak boleh mendahului jam mulai!');
                          }
                        }}
                        className="block w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer font-bold outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h} disabled={h < jamMulai}>Selesai Jam {h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Kelas - Locked as requested */}
                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">
                    Kelas Terbaca
                  </label>
                  <input
                    type="text"
                    disabled
                    value={studentClass?.nama || 'Tidak Terbaca'}
                    className="block w-full px-4.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-indigo-900 font-bold text-sm cursor-not-allowed select-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Sistem menyematkan kelas otomatis demi kepatuhan data</p>
                </div>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">
                  Mata Pelajaran Kelas XI
                </label>
                <select
                  required
                  value={selectedMapelId}
                  onChange={(e) => setSelectedMapelId(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer font-medium outline-none"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {mapel.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.kode}] - {m.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guru Pengampu - Multi-select */}
              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">
                  Guru Pengampu (Bisa Pilih Lebih Dari 1 Guru) <span className="text-rose-500 font-extrabold">*</span>
                </label>
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 max-h-44 overflow-y-auto space-y-2">
                  {(() => {
                    const allowedGuruIds = Array.from(new Set(
                      guruMengampu
                        .filter(gm => gm.mapelId === selectedMapelId && gm.kelasId === siswa.kelasId)
                        .flatMap(gm => gm.guruId.split(',').map(id => id.trim()).filter(Boolean))
                    ));
                    const relevantGurus = allowedGuruIds.length > 0 
                      ? guru.filter(g => allowedGuruIds.includes(g.id))
                      : [];

                    if (relevantGurus.length === 0) {
                      return (
                        <div className="text-center py-4 text-xs text-slate-400 font-medium bg-white rounded-lg border border-dashed border-slate-200">
                          Tidak ada guru yang terdaftar mengampu mapel ini di kelas Anda. Hubungi Admin untuk melakukan pemetaan.
                        </div>
                      );
                    }

                    return relevantGurus.map((g) => {
                      const isChecked = selectedGuruIds.includes(g.id);
                      return (
                        <label 
                          key={g.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                            isChecked 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-905 font-semibold' 
                              : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedGuruIds(selectedGuruIds.filter(id => id !== g.id));
                              } else {
                                setSelectedGuruIds([...selectedGuruIds, g.id]);
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs">
                            {g.nama} {g.kodeGuru ? `(Kode: ${g.kodeGuru})` : ''}
                          </span>
                        </label>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-slate-405 mt-1.5">Sistem memetakan guru kurikulum secara otomatis, namun Anda dapat mencentang lebih dari 1 guru bila sedang team-teaching.</p>
              </div>

              {/* Status Kehadiran Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-3.5 text-center sm:text-left">
                  Status Kehadiran Guru Pengampu
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatusPresence('hadir')}
                    className={`py-3.5 px-3 rounded-2xl text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer  transition-all transition-duration-200 ${
                      statusPresence === 'hadir'
                        ? 'bg-emerald-550 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 text-emerald-900 bg-emerald-100'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 ${statusPresence === 'hadir' ? 'text-emerald-600 animate-bounce' : 'text-slate-400'}`} />
                    <span>Hadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusPresence('tugas')}
                    className={`py-3.5 px-3 rounded-2xl text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all transition-duration-200 ${
                      statusPresence === 'tugas'
                        ? 'bg-amber-550 border-2 border-amber-500 shadow-md shadow-amber-500/10 text-amber-900 bg-amber-100'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FileSpreadsheet className={`w-5 h-5 ${statusPresence === 'tugas' ? 'text-amber-600 animate-swing' : 'text-slate-400'}`} />
                    <span>Tidak Hadir, Ada Tugas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusPresence('tidak')}
                    className={`py-3.5 px-3 rounded-2xl text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all transition-duration-200 ${
                      statusPresence === 'tidak'
                        ? 'bg-rose-550 border-2 border-rose-500 shadow-md shadow-rose-500/10 text-rose-900 bg-rose-100'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${statusPresence === 'tidak' ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                    <span>Tidak Hadir, Tanpa Tugas</span>
                  </button>
                </div>
              </div>

              {/* Catatan / Pokok Bahasan */}
              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-widest mb-1.5">
                  Materi Yang Dibahas / Deskripsi Tugas Mandiri
                </label>
                <textarea
                  required
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Belajar modul bab 3 Laravel CRUD dengan database, atau tugas merangkum halaman 102."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 text-left align-top outline-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Kirim & Publikasikan Jurnal Harian</span>
              </button>

            </form>
          </div>

          {/* Right Block: Instant preview sidebar of logs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-4 flex items-center gap-2 font-display">
                <ClipboardList className="w-4.5 h-4.5 text-indigo-550" />
                <span>Terakhir Diinput (Kelas Anda)</span>
              </h3>
              
              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                {myClassJournals.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Belum Ada Catatan Jurnal</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Gunakan form di kiri untuk merekam jurnal kelas pertama hari ini.</p>
                  </div>
                ) : (
                  myClassJournals.map((jr) => (
                    <div 
                      key={jr.id}
                      className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-150 transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2.5">
                        <div>
                          <p className="text-[11px] font-mono text-slate-450 font-semibold uppercase">{jr.hari}, {jr.tanggal}</p>
                          <p className="text-xs font-black text-orange-850 mt-1 leading-tight">{getMapelName(jr.mapelId)}</p>
                          <p className="text-xs text-slate-500 mt-1">Oleh: <span className="font-semibold text-slate-700">{getGuruName(jr.guruId)}</span></p>
                        </div>
                        <span className="text-xs bg-slate-200 font-bold text-slate-700 px-2 py-0.5 rounded">
                          Jam {jr.jamKe}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-150 line-clamp-2">
                        {jr.catatan}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        {getPresenceBadge(jr.statusKehadiran)}
                        {onDeleteJurnal && (
                          <button
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus jurnal input ini?')) {
                                onDeleteJurnal(jr.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="Hapus jurnal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Full history layout for mobile/desktop */
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Semua Riwayat Jurnal Kelas {studentClass?.nama}</h3>
              <p className="text-xs text-slate-450">Tabel rangkuman dari seluruh entri yang dipublikasikan oleh Ketua Kelas</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs tracking-widest font-bold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3">Tanggal / Hari</th>
                  <th scope="col" className="px-4 py-3">Jam Ke</th>
                  <th scope="col" className="px-6 py-3">Mata Pelajaran</th>
                  <th scope="col" className="px-6 py-3">Guru Pengampu</th>
                  <th scope="col" className="px-4 py-3">Kehadiran</th>
                  <th scope="col" className="px-6 py-3">Pembahasan Materi</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 select-none">
                {myClassJournals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Belum ada rekaman entri jurnal mengajar untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  myClassJournals.map((jr) => (
                    <tr key={jr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{jr.tanggal}</p>
                        <p className="text-xs text-slate-400 font-mono">{jr.hari}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-xs text-slate-700 bg-slate-105 border border-slate-200 py-1 px-2.5 rounded-md">
                          {jr.jamKe}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-800 leading-tight block">{getMapelName(jr.mapelId)}</span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-slate-700 font-semibold">{getGuruName(jr.guruId)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex shrink-0">
                          {getPresenceBadge(jr.statusKehadiran)}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 max-w-sm">
                        <p className="text-xs text-slate-600 line-clamp-2 md:line-clamp-3 bg-slate-50 p-2.5 border border-slate-200 rounded-xl whitespace-pre-line text-left leading-relaxed">
                          {jr.catatan}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {onDeleteJurnal && (
                          <button
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus jurnal input ini?')) {
                                onDeleteJurnal(jr.id);
                              }
                            }}
                            className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructional Card */}
      <div className="p-5 bg-orange-50 border border-orange-200/40 rounded-2xl flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-orange-900 leading-snug">Butuh Bantuan Pengisian?</h4>
          <p className="text-xs text-orange-850 mt-1 leading-relaxed">
            Pengisian jurnal ini disinkronisasikan langsung ke server kurikulum sekolah agar guru pengampu bersangkutan dapat melakukan rekap kehadiran tiap minggu. Harap perhatikan ketepatan jam pelajaran (Jam Ke-), Mata Pelajaran, dan Nama Guru Pengampu yang mengajar saat sesi bersangkutan.
          </p>
        </div>
      </div>

    </div>
  );
}
