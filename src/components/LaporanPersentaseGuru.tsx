import React, { useState, useMemo } from 'react';
import { Guru, Kelas, Mapel, Jurnal, Sekolah } from '../types';
import { 
  Printer, Search, Filter, CheckCircle, FileSpreadsheet, 
  AlertTriangle, Percent, Calendar, UserCheck, RefreshCw, BookOpen, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface LaporanPersentaseGuruProps {
  role: 'admin' | 'guru';
  currentGuru?: Guru | null;
  gurus: Guru[];
  kelas: Kelas[];
  mapel: Mapel[];
  jurnals: Jurnal[];
  schoolInfo: Sekolah;
}

export default function LaporanPersentaseGuru({
  role,
  currentGuru,
  gurus,
  kelas,
  mapel,
  jurnals,
  schoolInfo
}: LaporanPersentaseGuruProps) {
  const [selectedKelasId, setSelectedKelasId] = useState<string>('all');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchGuruQuery, setSearchGuruQuery] = useState<string>('');

  // Determine list of teachers to compute for:
  // If role is guru, strictly filter to currentGuru
  const targetGurus = useMemo(() => {
    if (role === 'guru') {
      return currentGuru ? [currentGuru] : [];
    }
    // For admin, show all teachers matching search query
    if (!searchGuruQuery.trim()) return gurus;
    return gurus.filter(g => 
      g.nama.toLowerCase().includes(searchGuruQuery.toLowerCase()) ||
      (g.kodeGuru && g.kodeGuru.toLowerCase().includes(searchGuruQuery.toLowerCase()))
    );
  }, [role, currentGuru, gurus, searchGuruQuery]);

  // Compute attendance stats per teacher
  const reportData = useMemo(() => {
    return targetGurus.map((g, index) => {
      // Filter journals where this teacher is assigned
      const teacherJournals = jurnals.filter(j => {
        // Match teacher ID
        const isMyJournal = j.guruId 
          ? j.guruId.split(',').map(id => id.trim()).includes(g.id) 
          : false;
        if (!isMyJournal) return false;

        // Match class filter
        if (selectedKelasId !== 'all' && j.kelasId !== selectedKelasId) {
          return false;
        }

        // Match mapel filter
        if (selectedMapelId !== 'all' && j.mapelId !== selectedMapelId) {
          return false;
        }

        // Match start date filter
        if (startDate && j.tanggal < startDate) {
          return false;
        }

        // Match end date filter
        if (endDate && j.tanggal > endDate) {
          return false;
        }

        return true;
      });

      const hadir = teacherJournals.filter(j => j.statusKehadiran === 'hadir').length;
      const tugas = teacherJournals.filter(j => j.statusKehadiran === 'tugas').length;
      const tidakHadir = teacherJournals.filter(j => j.statusKehadiran === 'tidak').length;
      const total = hadir + tugas + tidakHadir;

      // Formula explicitly requested: (hadir + tugas) / total * 100
      const persentase = total > 0 ? Math.round(((hadir + tugas) / total) * 100) : 0;

      return {
        no: index + 1,
        guruId: g.id,
        namaGuru: g.nama,
        kodeGuru: g.kodeGuru,
        hadir,
        tugas,
        tidakHadir,
        total,
        persentase
      };
    });
  }, [targetGurus, jurnals, selectedKelasId, selectedMapelId, startDate, endDate]);

  // Overall calculations across all target teachers
  const totalHadirAll = reportData.reduce((acc, r) => acc + r.hadir, 0);
  const totalTugasAll = reportData.reduce((acc, r) => acc + r.tugas, 0);
  const totalTidakAll = reportData.reduce((acc, r) => acc + r.tidakHadir, 0);
  const totalEntriesAll = totalHadirAll + totalTugasAll + totalTidakAll;
  const overallPercentage = totalEntriesAll > 0 
    ? Math.round(((totalHadirAll + totalTugasAll) / totalEntriesAll) * 100) 
    : 0;

  const getKelasLabel = (id: string) => {
    if (id === 'all') return 'Semua Kelas';
    return kelas.find(k => k.id === id)?.nama || id;
  };

  const getMapelLabel = (id: string) => {
    if (id === 'all') return 'Semua Mapel';
    return mapel.find(m => m.id === id)?.nama || id;
  };

  const getDateRangeLabel = () => {
    if (startDate && endDate) return `${startDate} s/d ${endDate}`;
    if (startDate) return `Mulai ${startDate}`;
    if (endDate) return `Sampai ${endDate}`;
    return 'Semua Tanggal';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Construct Excel Worksheet
    const excelData = [
      ['LAPORAN PERSENTASE KEHADIRAN GURU DI KELAS'],
      [`Institusi: ${schoolInfo.nama}`],
      [`Filter Kelas: ${getKelasLabel(selectedKelasId)} | Mapel: ${getMapelLabel(selectedMapelId)} | Tanggal: ${getDateRangeLabel()}`],
      [],
      ['No', 'Nama Guru', 'Kode Guru', 'Hadir', 'Tugas', 'Tidak Hadir', 'Total', 'Persentase (%)'],
      ...reportData.map(r => [
        r.no,
        r.namaGuru,
        r.kodeGuru || '-',
        r.hadir,
        r.tugas,
        r.tidakHadir,
        r.total,
        `${r.persentase}%`
      ]),
      [],
      ['', 'Total Keseluruhan', '', totalHadirAll, totalTugasAll, totalTidakAll, totalEntriesAll, `${overallPercentage}%`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Persentase Kehadiran');

    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 }
    ];

    const fileName = `Laporan_Persentase_Kehadiran_Guru_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Percent className="w-3.5 h-3.5" />
              Laporan Kinerja Pengajaran
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight">
              {role === 'guru' ? 'Persentase Kehadiran Saya' : 'Laporan Persentase Kehadiran Guru'}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              {role === 'guru' 
                ? 'Rekapitulasi persentase kehadiran mengajar Anda berdasarkan entri jurnal kelas harian. Persentase dihitung dari akumulasi sesi Hadir dan Tugas.'
                : 'Pemantauan persentase kedisiplinan mengajar seluruh tenaga pendidik. Total jam mengajar adalah penjumlahan dari Hadir, Tugas, dan Tidak Hadir.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 no-print">
            <button
              type="button"
              onClick={handleExportExcel}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Laporan Persentase</span>
          </div>
          {(startDate || endDate || selectedKelasId !== 'all' || selectedMapelId !== 'all' || searchGuruQuery) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedKelasId('all');
                setSelectedMapelId('all');
                setSearchGuruQuery('');
              }}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Struktur Kelas
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              {kelas.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Mapel Filter */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Mata Pelajaran
            </label>
            <select
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {mapel.map(m => (
                <option key={m.id} value={m.id}>{m.nama} ({m.kode})</option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            />
          </div>

          {/* Search Guru (Admin Only) */}
          {role === 'admin' ? (
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                Cari Nama Guru
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchGuruQuery}
                  onChange={(e) => setSearchGuruQuery(e.target.value)}
                  placeholder="Ketik nama guru..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                Status Guru
              </label>
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 truncate">
                {currentGuru?.nama || 'Guru Terdaftar'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Hadir</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-emerald-600 font-display">{totalHadirAll}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Dengan Tugas</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-amber-600 font-display">{totalTugasAll}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Tidak Hadir</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-rose-600 font-display">{totalTidakAll}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rata-Rata Persentase</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-2xl font-black font-display ${
              overallPercentage >= 90 ? 'text-emerald-600' : overallPercentage >= 75 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {overallPercentage}%
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN REPORT TABLE CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Printable Letterhead (Kop Surat) - ONLY visible during Print */}
        <div className="hidden print:block p-8 border-b-4 border-double border-slate-800 text-left">
          <div className="flex items-center gap-5">
            {schoolInfo.logoUrl ? (
              <img 
                src={schoolInfo.logoUrl} 
                alt="Logo Sekolah" 
                className="w-20 h-20 object-contain shrink-0" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 bg-orange-100 border border-orange-200 text-orange-600 rounded-full shrink-0 flex items-center justify-center font-black text-2xl font-mono text-center">
                🏫
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 leading-none">
                MAJELIS PENDIDIKAN DASAR MENENGAH DAN PENDIDIKAN NONFORMAL
              </h4>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-normal uppercase mt-0.5">
                {schoolInfo.nama}
              </h2>
              <p className="text-[10px] font-mono font-medium text-slate-500 mt-0.5">
                TERAKREDITASI "A" | NPSN: {schoolInfo.npsn}
              </p>
              <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                Alamat: {schoolInfo.alamat} | Website: {schoolInfo.website} | Email: {schoolInfo.email}
              </p>
            </div>
          </div>

          <div className="text-center mt-6 border-t border-slate-300 pt-4">
            <h3 className="text-base font-black uppercase text-slate-900 tracking-wider">
              LAPORAN PERSENTASE KEHADIRAN GURU DI KELAS
            </h3>
            <p className="text-xs font-mono font-medium text-slate-600 mt-1">
              Filter: {getKelasLabel(selectedKelasId)} | Mapel: {getMapelLabel(selectedMapelId)} | Rentang: {getDateRangeLabel()}
            </p>
          </div>
        </div>

        {/* On-screen Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 font-display">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Tabel Persentase Kehadiran Guru</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rumus: <span className="font-mono font-bold text-slate-600">(Hadir + Tugas) / Total × 100%</span>
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Total Record: <strong className="text-slate-700">{reportData.length} Guru</strong>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Row 1 Header */}
              <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px] text-center">
                <th rowSpan={2} className="py-3 px-4 border-r border-slate-200 w-12">
                  No
                </th>
                <th rowSpan={2} className="py-3 px-4 border-r border-slate-200 text-left min-w-[200px]">
                  Nama Guru
                </th>
                <th colSpan={3} className="py-2 px-4 border-r border-slate-200 bg-slate-200/60">
                  Rekap Jurnal
                </th>
                <th rowSpan={2} className="py-3 px-4 border-r border-slate-200 w-20">
                  Total
                </th>
                <th rowSpan={2} className="py-3 px-4 w-28 bg-indigo-50/60 text-indigo-900 font-black">
                  Persentase
                </th>
              </tr>

              {/* Row 2 Sub-Header for Rekap Jurnal */}
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] text-center">
                <th className="py-2 px-3 border-r border-slate-200 text-emerald-700 bg-emerald-50/30">
                  Hadir
                </th>
                <th className="py-2 px-3 border-r border-slate-200 text-amber-700 bg-amber-50/30">
                  Tugas
                </th>
                <th className="py-2 px-3 border-r border-slate-200 text-rose-700 bg-rose-50/30">
                  Tidak Hadir
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data guru yang ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                reportData.map((row) => (
                  <tr 
                    key={row.guruId} 
                    className="hover:bg-slate-50/80 transition-colors text-center font-medium text-slate-700"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400 border-r border-slate-100">
                      {row.no}
                    </td>

                    <td className="py-3.5 px-4 text-left font-bold text-slate-900 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{row.namaGuru}</span>
                        {row.kodeGuru && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono text-[9px] no-print">
                            {row.kodeGuru}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 border-r border-slate-100 font-bold text-emerald-600 bg-emerald-50/10">
                      {row.hadir}
                    </td>

                    <td className="py-3.5 px-3 border-r border-slate-100 font-bold text-amber-600 bg-amber-50/10">
                      {row.tugas}
                    </td>

                    <td className="py-3.5 px-3 border-r border-slate-100 font-bold text-rose-600 bg-rose-50/10">
                      {row.tidakHadir}
                    </td>

                    <td className="py-3.5 px-4 font-black font-mono text-slate-800 border-r border-slate-100 bg-slate-50/50">
                      {row.total}
                    </td>

                    <td className="py-3.5 px-4 font-black font-mono text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${
                          row.persentase >= 90 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : row.persentase >= 75 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : row.total === 0
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {row.persentase}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total / Summary Footer Row */}
            {reportData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300 text-center">
                  <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px] border-r border-slate-200">
                    Total Keseluruhan :
                  </td>
                  <td className="py-3.5 px-3 text-emerald-700 border-r border-slate-200 font-mono">
                    {totalHadirAll}
                  </td>
                  <td className="py-3.5 px-3 text-amber-700 border-r border-slate-200 font-mono">
                    {totalTugasAll}
                  </td>
                  <td className="py-3.5 px-3 text-rose-700 border-r border-slate-200 font-mono">
                    {totalTidakAll}
                  </td>
                  <td className="py-3.5 px-4 border-r border-slate-200 font-mono text-slate-900">
                    {totalEntriesAll}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-700 bg-indigo-50/80">
                    {overallPercentage}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Printable Footer / Signatures - ONLY visible during Print */}
        <div className="hidden print:block p-8 pt-12 mt-8">
          <div className="grid grid-cols-2 gap-12 text-center text-xs font-semibold text-slate-800">
            <div>
              <p className="text-slate-500 mb-1 font-mono">Mengetahui,</p>
              <p className="font-bold text-slate-800 uppercase">Waka Kurikulum {schoolInfo.nama}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline underline-offset-4">
                {schoolInfo.wakaKurikulum || '......................................................'}
              </p>
              <p className="text-slate-500 mt-0.5 font-mono">
                NBM. {schoolInfo.nbmWakaKurikulum || '.................................................'}
              </p>
            </div>

            <div>
              <p className="text-slate-500 mb-1 font-mono">
                Mungkid, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="font-bold text-slate-800 uppercase">Kepala Sekolah {schoolInfo.nama}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline underline-offset-4">
                {schoolInfo.kepalaSekolah}
              </p>
              <p className="text-slate-500 mt-0.5 font-mono">
                NBM. {schoolInfo.nbmKepalaSekolah || '-'}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

