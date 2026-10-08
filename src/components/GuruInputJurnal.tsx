import React, { useState, useEffect, useMemo } from 'react';
import { Guru, Kelas, Mapel, Jurnal, GuruMengampu, Sekolah } from '../types';
import { 
  BookOpen, Calendar, Clock, CheckCircle, AlertTriangle, 
  FileSpreadsheet, Sparkles, Send, Trash2, Users, UserCheck, 
  HelpCircle, Info, ChevronRight, Layers, RefreshCw
} from 'lucide-react';

interface GuruInputJurnalProps {
  guru: Guru;
  gurus: Guru[];
  kelas: Kelas[];
  mapel: Mapel[];
  guruMengampu?: GuruMengampu[];
  jurnals: Jurnal[];
  schoolInfo: Sekolah;
  onAddJurnal: (jurnal: Omit<Jurnal, 'id' | 'createdAt' | 'diinputOleh'>) => void;
  onDeleteJurnal?: (id: string) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  onNavigateTab?: (tabId: string) => void;
}

export default function GuruInputJurnal({
  guru,
  gurus,
  kelas,
  mapel,
  guruMengampu = [],
  jurnals,
  schoolInfo,
  onAddJurnal,
  onDeleteJurnal,
  showToast,
  onNavigateTab
}: GuruInputJurnalProps) {

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  // ------------------------------------------------------------------
  // FORM STATES
  // ------------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  
  // Sorted options (A-Z)
  const sortedKelas = useMemo(() => {
    return [...kelas].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [kelas]);

  const sortedMapel = useMemo(() => {
    return [...mapel].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [mapel]);

  const otherGurus = useMemo(() => {
    return gurus
      .filter(g => g.id !== guru.id)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [gurus, guru.id]);

  // Identify subjects assigned to this teacher
  const assignedMapelIds = useMemo(() => {
    const ids = new Set<string>();
    guruMengampu.forEach(gm => {
      if (gm.guruId === guru.id) {
        ids.add(gm.mapelId);
      }
    });
    return ids;
  }, [guruMengampu, guru.id]);

  // Form Fields
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('');
  
  // Jam-ke states: 1 - 12
  const [jamMulai, setJamMulai] = useState<number>(1);
  const [jamSelesai, setJamSelesai] = useState<number>(2);

  // Team Teaching states
  const [isTeamTeaching, setIsTeamTeaching] = useState<boolean>(false);
  const [partnerGuruId, setPartnerGuruId] = useState<string>('');
  const [customPartnerName, setCustomPartnerName] = useState<string>('');

  // Status Kehadiran
  const [statusPresence, setStatusPresence] = useState<'hadir' | 'tidak' | 'tugas'>('hadir');
  
  // Catatan / Materi
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inlineSuccess, setInlineSuccess] = useState<string>('');

  // Auto-resolve Indonesian day name
  useEffect(() => {
    if (!selectedDate) return;
    const daysIndonesian = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dateObj = new Date(selectedDate);
    const dayName = daysIndonesian[dateObj.getDay()];
    setSelectedDay(dayName);
  }, [selectedDate]);

  // Auto-select first class or assigned subject if not set
  useEffect(() => {
    if (!selectedMapelId && sortedMapel.length > 0) {
      // Prioritize subject taught by this teacher if available
      const myMapel = sortedMapel.find(m => assignedMapelIds.has(m.id));
      if (myMapel) {
        setSelectedMapelId(myMapel.id);
      } else {
        setSelectedMapelId(sortedMapel[0].id);
      }
    }
  }, [sortedMapel, assignedMapelIds, selectedMapelId]);

  // Quick preset helper for Jam Pelajaran
  const applyJamPreset = (mulai: number, selesai: number) => {
    setJamMulai(mulai);
    setJamSelesai(selesai);
  };

  // Toggle individual jam button (1 - 12)
  const handleJamPillClick = (jamNum: number) => {
    if (jamNum < jamMulai) {
      setJamMulai(jamNum);
    } else if (jamNum === jamMulai && jamSelesai > jamMulai) {
      setJamMulai(jamNum);
      setJamSelesai(jamNum);
    } else {
      setJamSelesai(jamNum);
    }
  };

  // Quick topics template appender
  const appendTemplate = (text: string) => {
    setNotes(prev => {
      const clean = prev.trim();
      return clean ? `${clean}\n• ${text}` : `• ${text}`;
    });
  };

  // Partner Guru label calculation
  const partnerGuruObj = otherGurus.find(g => g.id === partnerGuruId);
  const resolvedPartnerDisplayName = isTeamTeaching
    ? (partnerGuruObj ? partnerGuruObj.nama : (customPartnerName.trim() || 'Belum dipilih'))
    : null;

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKelasId) {
      notify('Mohon pilih Kelas yang diajar terlebih dahulu.', 'error');
      return;
    }

    if (!selectedMapelId) {
      notify('Mohon pilih Mata Pelajaran yang diampu.', 'error');
      return;
    }

    if (jamSelesai < jamMulai) {
      notify('Jam selesai tidak boleh lebih kecil dari jam mulai!', 'error');
      return;
    }

    if (isTeamTeaching && !partnerGuruId && !customPartnerName.trim()) {
      notify('Opsi Team Teaching aktif: Mohon pilih atau tulis nama Guru Pasangan!', 'error');
      return;
    }

    if (!notes.trim()) {
      notify('Mohon tuliskan ringkasan materi/kegiatan KBM yang diajarkan.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build jam-ke string (e.g. "1-2" or "3")
      const jamKeStr = jamMulai === jamSelesai ? `${jamMulai}` : `${jamMulai}-${jamSelesai}`;

      // Build guruId string:
      // Primary teacher ID is guru.id
      // If team teaching, append partner ID or partner name so it is registered
      let finalGuruId = guru.id;
      if (isTeamTeaching) {
        if (partnerGuruId) {
          finalGuruId = `${guru.id},${partnerGuruId}`;
        } else if (customPartnerName.trim()) {
          // Custom external teacher name
          finalGuruId = `${guru.id},${customPartnerName.trim()}`;
        }
      }

      // If team teaching with custom external teacher name, prepend note for clarity
      let finalNotes = notes.trim();
      if (isTeamTeaching && customPartnerName.trim() && !partnerGuruId) {
        finalNotes = `[Team Teaching bersama: ${customPartnerName.trim()}]\n${finalNotes}`;
      }

      onAddJurnal({
        hari: selectedDay,
        tanggal: selectedDate,
        jamKe: jamKeStr,
        kelasId: selectedKelasId,
        mapelId: selectedMapelId,
        guruId: finalGuruId,
        statusKehadiran: statusPresence,
        catatan: finalNotes
      });

      setInlineSuccess(`Jurnal mengajar Jam ke ${jamKeStr} berhasil disimpan dan disinkronkan ke database!`);
      setNotes('');
      // Keep date, class, and mapel to speed up consecutive inputs, or reset partner if needed
      setTimeout(() => {
        setInlineSuccess('');
      }, 5000);

    } catch (err: any) {
      notify('Gagal menyimpan jurnal: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recent journals for this teacher
  const myRecentJournals = useMemo(() => {
    return jurnals
      .filter(j => j.guruId && j.guruId.split(',').map(x => x.trim()).includes(guru.id))
      .slice(0, 10);
  }, [jurnals, guru.id]);

  const getClassName = (id: string) => kelas.find(k => k.id === id)?.nama || 'N/A';
  const getMapelName = (id: string) => mapel.find(m => m.id === id)?.nama || 'N/A';
  const getMapelCode = (id: string) => mapel.find(m => m.id === id)?.kode || 'N/A';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_top_right,#fff_10%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-xs text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                Formulir Jurnal Mengajar Guru
              </span>
              <span className="px-2.5 py-1 bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-mono font-bold rounded-full">
                KODE: {guru.kodeGuru || 'GURU'}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">
              {guru.nama}
            </h2>
            <p className="text-indigo-150 text-xs md:text-sm max-w-2xl leading-relaxed">
              Catat riwayat kegiatan belajar mengajar (KBM) harian secara real-time. Mendukung pilihan mata pelajaran terpadu, alokasi jam ke-1 hingga 12, dan kolaborasi <strong>Team Teaching</strong> bersama guru pasangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('guru-rekap')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <span>Lihat Rekap Jurnal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-md">
          
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Input Jurnal Kelas Hari Ini</h3>
                <p className="text-xs text-slate-400">Silakan lengkapi detail pertemuan tatap muka atau penugasan</p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {selectedDay}, {selectedDate}
            </span>
          </div>

          {/* Inline Success Notice */}
          {inlineSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">{inlineSuccess}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ROW 1: Tanggal & Kelas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tanggal & Hari */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Tanggal Pelaksanaan
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hari: <strong className="text-indigo-600">{selectedDay}</strong>
                </p>
              </div>

              {/* Pilihan Struktur Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Struktur Kelas Sasaran <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {sortedKelas.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih rombongan belajar yang Anda ajar pada sesi ini
                </p>
              </div>

            </div>

            {/* ROW 2: Mata Pelajaran */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedMapelId}
                onChange={(e) => setSelectedMapelId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {sortedMapel.map((m) => {
                  const isAssigned = assignedMapelIds.has(m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {isAssigned ? '★ ' : ''}[{m.kode}] - {m.nama} {isAssigned ? '(Mapel Anda)' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Tanda <strong className="text-amber-500">★</strong> menandakan mata pelajaran yang resmi terdaftar di pengampuan Anda.
              </p>
            </div>

            {/* ROW 3: Jam-Ke (1-12) */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Alokasi Jam Ke (Jam 1 s/d Jam 12) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400">Pilih jam ke berapa sesi KBM berlangsung di jadwal sekolah</p>
                </div>
                
                {/* Visual duration indicator badge */}
                <div className="self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Jam ke-{jamMulai === jamSelesai ? jamMulai : `${jamMulai} s/d ${jamSelesai}`} ({jamSelesai - jamMulai + 1} JP)
                  </span>
                </div>
              </div>

              {/* Interactive 1 to 12 Buttons Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PILIH LANGSUNG JAM PELAJARAN:
                </span>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((jamNum) => {
                    const isInRange = jamNum >= jamMulai && jamNum <= jamSelesai;
                    const isEndpoint = jamNum === jamMulai || jamNum === jamSelesai;
                    return (
                      <button
                        key={jamNum}
                        type="button"
                        onClick={() => handleJamPillClick(jamNum)}
                        className={`h-11 flex flex-col items-center justify-center rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                          isEndpoint
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-105 z-10'
                            : isInRange
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-tighter opacity-80">Jam</span>
                        <span className="text-sm leading-none">{jamNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Hour Selectors */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mulai Dari Jam Ke</label>
                  <select
                    value={jamMulai}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setJamMulai(val);
                      if (val > jamSelesai) setJamSelesai(val);
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>Jam ke-{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sampai Jam Ke</label>
                  <select
                    value={jamSelesai}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setJamSelesai(val);
                      if (val < jamMulai) setJamMulai(val);
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>Jam ke-{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  PRESET CEPAT SESI SMK:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyJamPreset(1, 2)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Jam 1-2
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(3, 4)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Jam 3-4
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(5, 6)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Jam 5-6
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(7, 8)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Jam 7-8
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(9, 10)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Jam 9-10
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(11, 12)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Jam 11-12
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(1, 4)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    Praktikum Pagi (1-4)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyJamPreset(5, 8)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    Praktikum Siang (5-8)
                  </button>
                </div>
              </div>

            </div>

            {/* ROW 4: TEAM TEACHING & GURU PASANGAN */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isTeamTeaching 
                ? 'bg-amber-50/70 border-amber-300' 
                : 'bg-slate-50/60 border-slate-200'
            }`}>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isTeamTeaching ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                      <span>Team Teaching (Mengajar Beregu)</span>
                      {isTeamTeaching && (
                        <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-bold rounded-full">
                          Aktif
                        </span>
                      )}
                    </label>
                    <p className="text-xs text-slate-500">
                      Aktifkan opsi ini jika mengajar bersama <strong>Guru Pasangan</strong> (praktikum kejuruan/kolaboratif)
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsTeamTeaching(!isTeamTeaching)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isTeamTeaching ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isTeamTeaching ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Expanded Team Teaching Partner Fields */}
              {isTeamTeaching && (
                <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-4 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pilih Guru Pasangan dari Database */}
                    <div>
                      <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                        Pilih Guru Pasangan (Daftar Pengajar)
                      </label>
                      <select
                        value={partnerGuruId}
                        onChange={(e) => {
                          setPartnerGuruId(e.target.value);
                          if (e.target.value) setCustomPartnerName('');
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-800 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih Guru Pasangan Dari Sekolah --</option>
                        {otherGurus.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nama} {g.kodeGuru ? `(${g.kodeGuru})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-amber-800/80 mt-1">
                        Daftar guru terurut alfabetis. Rekap kehadiran otomatis tercatat pada guru pasangan ini.
                      </p>
                    </div>

                    {/* Atau Ketik Manual Guru Pasangan / Instruktur Tamu */}
                    <div>
                      <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                        Atau Tulis Nama Guru Pasangan / Instruktur Industri
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Ir. Hendri (Instruktur DUDI) / Bpk. Yanto"
                        value={customPartnerName}
                        onChange={(e) => {
                          setCustomPartnerName(e.target.value);
                          if (e.target.value) setPartnerGuruId('');
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                      <p className="text-[11px] text-amber-800/80 mt-1">
                        Gunakan ini jika guru pasangan merupakan instruktur tamu / mitra DUDI eksternal.
                      </p>
                    </div>
                  </div>

                  {/* Summary of Team Teaching pairing */}
                  <div className="p-3 bg-white/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Format Pengajar: <strong>{guru.nama}</strong> (Utama) & <strong>{resolvedPartnerDisplayName}</strong> (Pasangan)
                    </span>
                    <span className="text-amber-800 font-bold font-mono text-[11px] bg-amber-100 px-2 py-0.5 rounded">
                      Mode Team Teaching
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* ROW 5: Status Kehadiran */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Status Kehadiran Tenaga Pendidik
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <label className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                  statusPresence === 'hadir'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="statusKehadiranGuru"
                    value="hadir"
                    checked={statusPresence === 'hadir'}
                    onChange={() => setStatusPresence('hadir')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-left">
                    <span className="block text-xs font-bold">Hadir Mengajar</span>
                    <span className="block text-[10px] text-slate-400">Tatap muka di kelas/lab</span>
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                  statusPresence === 'tugas'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="statusKehadiranGuru"
                    value="tugas"
                    checked={statusPresence === 'tugas'}
                    onChange={() => setStatusPresence('tugas')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-left">
                    <span className="block text-xs font-bold">Dengan Tugas</span>
                    <span className="block text-[10px] text-slate-400">Tugas mandiri / daring</span>
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                  statusPresence === 'tidak'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="statusKehadiranGuru"
                    value="tidak"
                    checked={statusPresence === 'tidak'}
                    onChange={() => setStatusPresence('tidak')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div className="text-left">
                    <span className="block text-xs font-bold">Tidak Hadir</span>
                    <span className="block text-[10px] text-slate-400">Jam kosong / dinas luar</span>
                  </div>
                </label>

              </div>
            </div>

            {/* ROW 6: Catatan / Bahasan Materi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  Uraian Materi Pokok & Catatan KBM <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Mendukung bullet point & multi-baris</span>
              </div>
              
              <textarea
                required
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan Capaian Pembelajaran (CP), materi pokok bahasan, aktivitas praktikum di bengkel/lab, atau instruksi penugasan..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none leading-relaxed"
              />

              {/* Fast Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">SISIPKAN CEPAT:</span>
                <button
                  type="button"
                  onClick={() => appendTemplate('Penyampaian Teori & Diskusi Konsep')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  + Teori & Konsep
                </button>
                <button
                  type="button"
                  onClick={() => appendTemplate('Praktikum di Laboratorium / Bengkel')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  + Praktikum Lab/Bengkel
                </button>
                <button
                  type="button"
                  onClick={() => appendTemplate('Penilaian Harian / Asesmen Sumatif')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  + Asesmen / Ulangan
                </button>
                <button
                  type="button"
                  onClick={() => appendTemplate('Pengerjaan Tugas Kelompok Kolaboratif')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  + Tugas Kelompok
                </button>
                <button
                  type="button"
                  onClick={() => appendTemplate('Remedial & Pengayaan Materi')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  + Remedial
                </button>
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-slate-400 text-center sm:text-left">
                Data jurnal akan langsung tersimpan ke database sekolah dan dapat dipantau oleh Administrator serta diikutsertakan dalam rekapan cetak resmi.
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setNotes('');
                    setIsTeamTeaching(false);
                    setPartnerGuruId('');
                    setCustomPartnerName('');
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal Mengajar'}</span>
                </button>
              </div>
            </div>

          </form>

        </div>

        {/* Right Info Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Guru Information Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Profil Pengampu Aktif
            </h4>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
              <p className="font-extrabold text-slate-800 text-sm">{guru.nama}</p>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Kode Guru:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                  {guru.kodeGuru || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Status Entri:</span>
                <span className="font-bold text-emerald-700">Pendidik Berwenang</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Petunjuk Pengisian:</p>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
                <li>Pilih kelas sasaran dan mata pelajaran yang Anda ampu pada jam tersebut.</li>
                <li>Rentang jam 1 s/d 12 dapat dipilih langsung dari tombol kotak jam atau preset cepat.</li>
                <li>Bila mengajar bersama rekan pengajar, aktifkan toggle <strong>Team Teaching</strong> dan tentukan guru pasangan.</li>
              </ul>
            </div>
          </div>

          {/* Recent Entries by This Teacher */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Jurnal Terbaru Anda
              </h4>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {myRecentJournals.length} Entri
              </span>
            </div>

            {myRecentJournals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                Belum ada jurnal yang diinput oleh Anda. Gunakan form di sebelah kiri untuk mulai mengisi.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {myRecentJournals.map((jr) => {
                  const isPair = jr.guruId && jr.guruId.includes(',');
                  return (
                    <div 
                      key={jr.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition-all text-xs space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{getClassName(jr.kelasId)}</span>
                          <span className="text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            Jam {jr.jamKe}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">{jr.tanggal}</span>
                          {onDeleteJurnal && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus jurnal kelas ${getClassName(jr.kelasId)} jam ke-${jr.jamKe}?`)) {
                                  onDeleteJurnal(jr.id);
                                }
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Hapus jurnal ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="font-semibold text-slate-700 line-clamp-1">
                        {getMapelName(jr.mapelId)}
                      </div>

                      {/* Team Teaching Tag */}
                      {isPair && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-bold w-fit">
                          <Users className="w-3 h-3" />
                          <span>Team Teaching</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 line-clamp-2 bg-white/70 p-1.5 rounded-lg border border-slate-200/50">
                        {jr.catatan}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('guru-rekap')}
                className="w-full py-2.5 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              >
                Lihat Semua Daftar Jurnal →
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
